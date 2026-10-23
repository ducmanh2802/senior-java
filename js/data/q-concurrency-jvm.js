/* Topics: concurrency, jvm — owner: task T2. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'concurrency-001',
  topic: 'concurrency',
  level: 'mid',
  q: 'Java Memory Model: "happens-before" nghĩa là gì? {{volatile}} đảm bảo điều gì và KHÔNG đảm bảo điều gì?',
  a: `**Tóm tắt:** happens-before là quan hệ thứ tự do JMM bảo chứng: nếu A happens-before B thì mọi ghi của A là nhìn thấy được với B và có thứ tự ổn định so với B. {{volatile}} tạo happens-before giữa write và read cùng biến — đảm bảo **visibility và ordering** — nhưng KHÔNG đảm bảo **atomicity** của chuỗi nhiều lệnh như {{i++}}.

### Vì sao cần JMM
Mỗi core có cache riêng; compiler/JIT xếp lại lệnh để tối ưu. Một thread có thể đọc giá trị cũ, thậm chí thấy field của object là giá trị mặc định dù thread A đã chạy xong constructor (unsafe publication).

### Các rule happens-before hay dùng
- **Program order**: các hành động trong cùng một thread.
- **Monitor**: unlock happens-before lần lock tiếp theo trên cùng monitor.
- {{volatile}}: write happens-before read cùng biến.
- {{Thread.start()}} và {{Thread.join()}}; quy tắc transitive.

### Volatile: được và không được gì

~~~java
volatile boolean stop;
// ĐÚNG: flag visibility, safe publication
while (!stop) { work(); }
// SAI: i++ gồm read-modify-write 3 lệnh, vẫn mất update
volatile int counter;
counter++;               // => phải dùng AtomicInteger
~~~

- **Được**: read thấy giá trị mới nhất; ghi trước volatile được "publish" cho thread đọc sau.
- **Không được**: atomic compound action; loại bỏ check-then-act race.

> Senior tip: phỏng vấn hay hỏi "volatile rồi mà vẫn sai thì do đâu?" — chuẩn: volatile chỉ đảm bảo thấy giá trị, không đảm bảo tính toàn vẹn của phép nhiều bước; cần lock hoặc object bất biến.`,
  follow: [
    'Vì sao double-checked locking bắt buộc dùng {{volatile}}?',
    'Ví dụ một tình huống dùng {{volatile}} mà vẫn có race.'
  ],
  tags: ['volatile', 'JMM', 'happens-before']
},
{
  id: 'concurrency-002',
  topic: 'concurrency',
  level: 'senior',
  q: 'So sánh {{synchronized}}, {{ReentrantLock}}, {{ReadWriteLock}} và {{StampedLock}}: khi nào bạn chọn cái nào?',
  a: `**Tóm tắt:** {{synchronized}} là lựa chọn mặc định — JVM tối ưu mạnh (thin lock, lock coarsening/elision). Mở sang {{ReentrantLock}} khi cần tryLock, giờ ngắt, fair, nhiều Condition. {{ReadWriteLock}} và {{StampedLock}} chỉ đáng dùng khi read nhiều hơn write rõ rệt và có contention thật.

### Bảng so sánh

| Tính năng | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|---|---|---|---|---|
| Cơ chế | monitor JVM | CAS + AQS | 1 AQS, state chia read/write | CAS + spin/park |
| tryLock/timeout | Không | Có | Có | Có |
| Ngắt được khi chờ | Không | Có | Có | Có |
| Reentrant | Có | Có | Có | Không |

### Điểm cần kể
1. **synchronized**: JVM nâng cấp qua thin lock rồi inflate khi contention; JIT làm lock coarsening và elimination (escape analysis). 90% case nên dùng nó trước.
2. **{{ReentrantLock}}**: mỗi Condition là hàng chờ riêng (vd notFull/notEmpty); lockInterruptibly cho phép thoát khi cancel/shutdown.
3. **{{ReentrantReadWriteLock}}**: read lock chia sẻ, write độc quyền; chỉ đáng giá khi tỷ lệ read/write rất lệch (>10:1) và critical section đủ dài. Fair mode chống starvation nhưng giảm throughput.
4. **{{StampedLock}}**: có Optimistic read — đọc không khóa, kiểm stamp rồi mới rơi xuống readLock nếu write xen vào. Nhanh nhất cho read-heavy; giá: non-reentrant, code phức tạp, dễ quên unlock đúng stamp.

~~~java
// Optimistic read của StampedLock
long stamp = sl.tryOptimisticRead();   // không khóa
double x = cx, y = cy;
if (!sl.validate(stamp)) {             // có write xen vào?
    stamp = sl.readLock();             // fallback pessimistic
    try { x = cx; y = cy; } finally { sl.unlockRead(stamp); }
}
~~~

> Senior tip: đừng chọn lock theo whiteboard — benchmark với JMH trên profile thật. Tôi từng thấy module migrate JDK 8 lên 17 đổi ReentrantLock về synchronized: throughput không giảm, code gọn đi nhiều.`,
  follow: [
    'StampedLock không reentrant — gây vấn đề gì khi refactor code cũ?',
    'Condition của ReentrantLock khác Object.wait/notify thế nào?'
  ],
  tags: ['synchronized', 'ReentrantLock', 'ReadWriteLock', 'StampedLock'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-003',
  topic: 'concurrency',
  level: 'senior',
  q: 'Đi sâu vào {{ThreadPoolExecutor}}: thứ tự tạo thread khi submit 1 task, rejection policy và cách sizing pool cho CPU-bound vs IO-bound?',
  a: `**Tóm tắt:** thứ tự submit là: tạo thread mới nếu chưa đủ corePoolSize; đủ rồi thì vào queue; queue đầy thì tạo thread tới maximumPoolSize; vượt max mà queue vẫn đầy thì reject theo policy. Sizing: CPU-bound ≈ số core; IO-bound ≈ core × (1 + W/C) với W/C là tỉ lệ thời gian chờ/tính toán — công thức chỉ là điểm khởi đầu, phải đo thật.

### Constructor đầy đủ

~~~java
new ThreadPoolExecutor(
    4,                                  // corePoolSize
    8,                                  // maximumPoolSize
    60, TimeUnit.SECONDS,               // keepAlive cho thread ngoài core
    new ArrayBlockingQueue<>(100),      // queue BOUNDED (rất quan trọng)
    namedThreadFactory,                 // đặt tên thread
    new ThreadPoolExecutor.CallerRunsPolicy()); // rejection
~~~

- Bẫy tư duy: queue được check **trước** khi tạo thread vượt core. Với queue vô hạn, maxPoolSize gần như vô nghĩa.
- {{allowCoreThreadTimeOut(true)}} cho core chết khi idle — hợp cho pool có traffic co giãn.

### Rejection policy
- **AbortPolicy** (mặc định): ném {{RejectedExecutionException}} — fail fast, caller tự retry.
- **CallerRunsPolicy**: chạy trên thread submit — backpressure tự nhiên; nhưng nếu submit từ Netty event loop thì chậm cả hệ thống.
- **DiscardPolicy / DiscardOldestPolicy**: bỏ im lặng — chỉ hợp task có thể vứt (metric, log).

### Sizing
- **CPU-bound**: pool ≈ số core, thêm thread chỉ tăng context switch.
- **IO-bound**: pool ≈ core × (1 + W/C); W/C tỉ lệ chờ/tính toán — REST, JDBC, file IO có thể gấp 10–50 lần số core.
- Little's law kiểm chứng: concurrency cần ≈ throughput × latency mục tiêu (vd 1000 req/s × 200 ms = 200 đang bay).
- Metric: expose activeCount/queueSize qua Micrometer; alert khi queue > 70% trong nhiều phút.

### Pitfall production
- Queue vô hạn (mặc định của {{newFixedThreadPool}}): p99 trượt dài rồi OOM heap.
- Task ném exception không ai hay: bọc try-catch, định nghĩa UncaughtExceptionHandler.
- Pool JDBC phải tune song song: 200 thread với 10 connection = 190 thread xếp hàng chờ connection.

> Senior tip: tôi luôn đưa ra con số mẫu: với API ngoài 100 rps và latency 200 ms, concurrency cap = 20 theo Little's law; rate limiter 100 rps chặn burst. Câu trả lời thiếu số và thiếu cách đo là thiếu nửa điểm ở vị trí senior.`,
  follow: [
    'Vì sao JDK check queue trước khi tạo thread vượt core?',
    'CallerRunsPolicy block Netty event loop — xử lý thế nào?'
  ],
  tags: ['ThreadPoolExecutor', 'thread pool', 'sizing'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
}
,
{
  id: 'concurrency-004',
  topic: 'concurrency',
  level: 'senior',
  q: 'Vì sao không nên dùng {{Executors.newFixedThreadPool}} / {{newCachedThreadPool}} mặc định trên production?',
  a: `**Tóm tắt:** {{newFixedThreadPool}} dùng {{LinkedBlockingQueue}} vô hạn ⇒ burst làm queue phình vô hạn: p99 trượt dài rồi OOM heap; maxPoolSize gần như vô nghĩa. {{newCachedThreadPool}} có max = {{Integer.MAX_VALUE}} với {{SynchronousQueue}} ⇒ burst tạo hàng nghìn thread ⇒ OOM "unable to create native thread". Production nên tự dựng ThreadPoolExecutor với queue bounded và policy có chủ đích.

### Câu chuyện failure

~~~java
// Burst 50k task trong 10s, mỗi task ~100ms
Executors.newFixedThreadPool(10);
// queue vô hạn: hàng chục nghìn task chờ => p99 lên hàng trăm giây
// task giữ payload lớn => OOM heap

Executors.newCachedThreadPool();
// SynchronousQueue: mỗi task cần một thread mới
// 10k thread x 1 MB stack reserve => "unable to create native thread"
~~~

### Thiếu sót của factory helper
- Không expose rejection policy (mặc định Abort) và ThreadFactory — thread dump thành pool-1-thread-123, khó grep.
- Không expose queue type/capacity, allowCoreThreadTimeOut — mọi tuning phải sửa code.
- Không có sẵn metric queue depth / active count / rejection count.
- Java 21: {{newVirtualThreadPerTaskExecutor}} thay "cached pool" cho task IO — nhưng vẫn phải giới hạn ở tầng tài nguyên (pool JDBC, semaphore), nếu không tự DDOS chính DB của mình.

### Cách làm đúng

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 32, 30, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),
    new CustomizableThreadFactory("video-encode-"), // Spring; set daemon qua setDaemon(true)
    new ThreadPoolExecutor.CallerRunsPolicy()); // hoặc Abort + retry/MQ
pool.allowCoreThreadTimeOut(true);
~~~

Rule tôi áp cho team khi review: mọi pool trên production phải có (1) queue bounded, (2) rejection policy được ghi rõ, (3) thread name dễ grep.

> Senior tip: vụ thực tế tôi điều tra: p99 nhảy từ 80 ms lên 9 s không phải vì code chậm mà vì queue vô hạn nuốt 200k task sau một khoảng traffic spike. Fail fast với rejection công khai tốt hơn âm thầm xếp hàng vô hạn nhiều.`,
  follow: [
    'CallerRunsPolicy dùng cùng Netty event loop — risk thế nào?',
    'Với virtual threads, còn cần giới hạn gì ngoài số thread?'
  ],
  tags: ['Executors', 'thread pool', 'OOM'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-005',
  topic: 'concurrency',
  level: 'senior',
  q: '{{CompletableFuture}}: khác biệt giữa {{thenApply}} và {{thenCompose}}, dùng {{allOf}} thế nào, xử lý exception, executor mặc định chạy ở đâu?',
  a: `**Tóm tắt:** {{thenApply}} = map giá trị thành giá trị; {{thenCompose}} = flatMap khi bước tiếp theo tự nó trả về CompletableFuture — tránh lồng CF<CF<T>>. Lỗi dùng exceptionally / handle / whenComplete. Không truyền executor: callback chạy trên thread hoàn thành bước trước, hoặc ForkJoinPool.commonPool() — task blocking bắt buộc phải dùng executor riêng.

### thenApply vs thenCompose

~~~java
CompletableFuture<HttpResp> resp = client.callAsync(url);

// map giá trị -> giá trị
CompletableFuture<Dto> dto = resp.thenApply(Dto::of);

// flatMap: bước tiếp theo là async (trả CF)
CompletableFuture<Detail> d = resp.thenCompose(r -> fetchAsync(r.id));

// nếu dùng thenApply r -> fetchAsync(r.id): được CF<CF<Detail>> — sai mong muốn
~~~

### allOf + gom kết quả
~~~java
CompletableFuture<List<Price>> all = CompletableFuture
    .allOf(c1, c2, c3)
    .thenApply(v -> List.of(c1.join(), c2.join(), c3.join()));
~~~
- allOf trả về CF<Void>; sau khi complete, từng CF con đã done nên join không block.
- Một CF con hoàn thành exceptionally thì allOf cũng complete exceptionally (bọc trong CompletionException) — nhưng chỉ khi TẤT CẢ CF con đã xong: allOf không fail-fast, muốn hủy sớm phải tự xử lý.

### Xử lý exception
- {{exceptionally(ex -> fallback)}}: chỉ khi lỗi; dùng cho fallback giá trị.
- {{handle((v, ex) -> ...)}}: luôn chạy; dùng để normalize cả 2 đường.
- {{whenComplete((v, ex) -> ...)}}: side effect (log/metric), giữ nguyên kết quả.
- Chain không handle lỗi sẽ im lặng cho tới khi join/get — kể lỗi "rơi vào hư không"; nhớ whenComplete để log.

### Executor mặc định
- Không truyền: callback chạy trên thread hoàn thành bước trước (hoặc Caller thread nếu đã complete).
- async mới mà không có executor: chạy trên {{ForkJoinPool.commonPool()}} (parallelism = cores - 1) — cạn thì ảnh hưởng toàn JVM (parallel stream, CF khác).
- Pitfall lớn: blocking code (JDBC, REST sync) trong commonPool gây treo toàn commonPool; deadlock tự tạo kinh điển: callback trong commonPool .join() một CF con cũng chạy trong commonPool.

> Senior tip: quy ước của tôi: callback then* chỉ non-blocking; mọi IO đi qua supplyAsync(fn, ioExecutor) riêng; join/get chỉ ở tầng biên (controller, batch-finish). Thiết kế này giúp tránh "CF hell" và deadlock tự tạo chung commonPool.`,
  follow: [
    'thenApply vs thenApplyAsync — callback chạy trên thread nào từng trường hợp?',
    'Đặt timeout cho chuỗi CF nhiều step: làm thế nào?'
  ],
  tags: ['CompletableFuture', 'async', 'ForkJoinPool'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-006',
  topic: 'concurrency',
  level: 'lead',
  q: 'Deadlock: 4 điều kiện cần là gì, phát hiện bằng thread dump ra sao, phòng tránh khi thiết kế thế nào? Phân biệt với livelock và starvation.',
  a: `**Tóm tắt:** deadlock cần đủ 4 điều kiện Coffman — mutual exclusion, hold-and-wait, no-preemption, circular wait; phá một trong bốn là hết. Trên production phát hiện qua thread dump: JVM tự in "Found one Java-level deadlock". Livelock: thread còn chạy nhưng tiến độ = 0 vì liên tục nhường nhau. Starvation: thread không bao giờ được cấp tài nguyên vì bị chen hàng liên tục.

### 4 điều kiện Coffman
1. **Mutual exclusion** — tài nguyên một thread dùng tại một thời điểm.
2. **Hold and wait** — đang giữ 1 lock mà đi chờ lock khác.
3. **No preemption** — không thể tước lock khỏi thread đang giữ.
4. **Circular wait** — vòng: A chờ B, B chờ A.

### Phát hiện thread dump

~~~bash
jstack <pid> > dump-1.txt       # chụp 2-3 lần cách nhau vài giây
jcmd <pid> Thread.print -l      # thay thế jstack
~~~

~~~text
"Thread-A" waiting to lock <0x0a1b> (owned by "Thread-B")
"Thread-B" waiting to lock <0x9c2d> (owned by "Thread-A")
Java level deadlock ...
~~~

ReentrantLock cũng được phát hiện vì AQS giữ owner. Dump không báo deadlock mà service vẫn treo (chờ IO/DB lock): so sánh nhiều dump — thread đứng nguyên cùng stack qua mọi lần chụp là nghi phạm (hot thread analysis).

### Phòng tránh — phá đúng 1 trong 4 điều kiện
- **Lock ordering**: mọi code lock theo cùng thứ tự (vd theo entity id tăng dần) — phá circular wait, cách bền nhất.
- **tryLock + timeout**: chờ không được thì nhả hết đã giữ rồi retry — phủ nhận no-preemption.
- **Open calls**: không gọi callback/DB/network khi đang giữ lock.
- Giảm nested lock: một method một lock; dùng cấu trúc concurrent sẵn.

~~~java
// Phá circular wait: luôn khóa hai account theo id tăng dần
Account a = from, b = to;
if (a.id > b.id) { Account t = a; a = b; b = t; }
synchronized (a) { synchronized (b) { transfer(from, to, amount); } }
~~~

### Livelock & starvation
- **Livelock**: hai hướng retry liên tục hủy hành động của nhau — có hoạt động nhưng không tiến triển; fix bằng random backoff hoặc một bên quyết.
- **Starvation**: writer liên tiếp thắng, reader đói mãi vì lock không fair; fix bằng fair lock (đổi throughput), quota, hoặc MQ có thứ tự.

> Senior tip: deadlock DB là dạng khó nhất: MySQL tự resolve (rollback 1 transaction) nhưng app chỉ thấy lỗi generic. Bật innodb_print_all_deadlocks để log mọi deadlock vào error log — một deadlock app gặp chỉ là một trong hàng trăm DB log ra.`,
  follow: [
    'Thread dump không báo deadlock nhưng service treo — điều tra tiếp thế nào?',
    'synchronized không có timeout — implement "chờ tối đa X ms" bằng cách nào?'
  ],
  tags: ['deadlock', 'thread dump', 'livelock', 'starvation'],
  refs: [
    { type: 'doc', title: 'Java ThreadMXBean API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ],
}
,
{
  id: 'concurrency-007',
  topic: 'concurrency',
  level: 'senior',
  q: 'Virtual threads (Java 21): cơ chế hoạt động bên trong, vấn đề pinning, khi nào nên/không nên dùng, ảnh hưởng tới {{ThreadLocal}} và connection pool?',
  a: `**Tóm tắt:** virtual thread là thread do JVM quản, không phải OS thread: JVM mount nó lên một carrier thread (ForkJoinPool, số carrier ≈ số CPU) và khi gặp blocking IO, JVM lưu stack xuống heap, unmount, trả carrier cho task khác. Chi phí thấp nên có thể chạy hàng triệu task đồng thời. Pinning: khi block trong khối {{synchronized}} trên Java 21, virtual thread không unmount được — carrier bị giữ (Java 24/25 đã bỏ hạn chế này qua JEP 491).

### Cơ chế
- Virtual thread có stack trên heap (continuation); scheduler là ForkJoinPool FIFO.
- Blocking IO do JDK cung cấp (Socket, sleep, lock của j.u.c...) là điểm unmount (Object.wait trên Java 21 vẫn pin); IO xong, task được mount lại trên carrier mới.
- API tương thích: {{Thread.ofVirtual().start()}} hoặc {{Executors.newVirtualThreadPerTaskExecutor()}}. Phong cách mới: một thread cho mỗi task, KHÔNG pool.

### Pinning
~~~java
synchronized (lock) {        // trong khối này block IO...
    api.call();              // => virtual thread bị pin vào carrier
}                            // carrier không thể giải phóng
~~~
- Java 21: block trong synchronized (hoặc gọi native) khiến virtual thread không unmount => giữ carrier; khi nhiều task chạm khối đó, parallelism sụp về số carrier.
- Phát hiện: flag {{-Djdk.tracePinnedThreads=full}} (in stack chỗ bị pin; flag này bị bỏ từ JDK 24) hoặc JFR event jdk.VirtualThreadPinned.
- Java trước 24: thay synchronized bằng ReentrantLock ở vùng block IO là biện pháp số một.

### Nên / không nên
- **Nên**: server nhiều concurrent connection với blocking IO; migrate code blocking cũ không đổi sang reactive; fan-out gọi hàng trăm call mỗi request.
- **Không nên**: CPU-bound (thread cheap không giúp gì cho số core); code reactive đã chạy tốt; task cần state lớn qua ThreadLocal mà chưa chuyển ScopedValue.
- Virtual thread "rẻ" nhưng vẫn giới hạn bị tài nguyên dưới đó (DB pool, file descriptor) — đó là chỗ cần semaphore + rate limit.

### ThreadLocal & pool tài nguyên
- KHÔNG pool virtual thread → ThreadLocal mỗi task một bản mới: MDC, security context tạo mới mỗi request, GC pressure tăng; Object lớn giữ trong ThreadLocal + hàng triệu task = OOM dễ.
- Bottleneck thường chuyển sang pool JDBC: 10 connection = 10 task chạy song song, phần còn lại chờ. Điều đó là ĐÚNG — nhưng bạn phải tune pool JDBC và xem chiều chi tiết chứ không phải "tăng pool vô hạn" là xong.

> Senior tip: benchmark trước khi tin virtual threads: test tăng concurrent từ 100 lên 10k, đo p99 và connection pool; thường p99 còn phụ thuộc pool JDBC nhiều hơn số thread — tăng pool JDBC mới là đòn chỉnh đúng.`,
  follow: [
    'Phát hiện pinning của một service Java 21 trong production thế nào?',
    'Nên dùng virtual thread cho fan-out 1000 call mỗi request hay reactive stack?'
  ],
  tags: ['virtual threads', 'Java 21', 'pinning', 'ThreadLocal'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-008',
  topic: 'concurrency',
  level: 'mid',
  q: '{{ThreadLocal}} dùng khi nào? Vì sao nó gây memory leak trong thread pool và xử lý ra sao?',
  a: `**Tóm tắt:** {{ThreadLocal}} cho mỗi thread một bản dữ liệu riêng: user context, transaction context, trace id MDC... Trong thread pool, thread sống lâu nên giá trị set vào không được giải phóng nếu không gọi {{remove()}} — rò rỉ heap; tệ hơn, task sau có thể đọc nhầm giá trị của task trước (bảo mật).

### Cơ chế
- Mỗi Thread có một ThreadLocalMap: key là tham chiếu yếu tới ThreadLocal object, value là tham chiếu mạnh.
- {{set(v)}} gán entry vào map của thread hiện tại; {{get()}} dò trong map; khi ThreadLocal object thoát scope, key bị GC nhưng value vẫn ở lại cho tới khi stale được dọn lazily. {{remove()}} là cách dọn chủ động duy nhất đáng tin cậy.

### Leak trong pool
1. Task quên remove: giá trị nằm trong thread nữa ngày, chiếm Old Gen.
2. **Leak dữ liệu giữa request**: task sau đọc nhầm MDC requestId/userId của task trước — issue bảo mật nghiêm trọng và không debug được qua stack trace.
3. Giá trị tham chiếu class của webapp (Tomcat) ⇒ WebappClassLoader không giải phóng khi redeploy → Metaspace leak.
4. Cache tĩnh + ThreadLocal = nhân đôi heap footprint.

### Cách làm đúng

~~~java
try {
    MDC.put("requestId", reqId);
    chain.doFilter(req, resp);
} finally {
    MDC.clear();          // luôn dọn ở finally
}
~~~

- Quy ước: set — try/finally — remove trong cùng call stack; đặt set/remove ở filter/interceptor, không để từng method tự set.
- SimpleDateFormat mutable: gói ThreadLocal.withInitial là cách tạm thời; Java 17/21 dùng DateTimeFormatter bất biến là xong — không cần ThreadLocal nữa.
- Java 21/22 preview: ScopedValue thay ThreadLocal trong code virtual-thread; giá gắn scope nên tự chết, không cần quên remove.

> Senior tip: một vụ "user A thấy data user B" gây ấn tượng cho tôi: MDC có userId của request trước bị giữ lại trong thread, một filter sau đó đọc MDC mà không set — 1 trong 10k request rơi vào thể loại này. Sau đó team tôi review tìm dấu {{set(}} và {{remove}} phải đi cùng nhau trong cùng method.`,
  follow: [
    'ThreadLocalMap dùng WeakReference cho key — vì sao value vẫn leak?',
    'InheritableThreadLocal hành xử thế nào với virtual threads?'
  ],
  tags: ['ThreadLocal', 'memory leak', 'tomcat']
},
{
  id: 'concurrency-009',
  topic: 'concurrency',
  level: 'senior',
  q: 'CAS hoạt động thế nào, {{AtomicInteger}} dùng nó ra sao, vấn đề ABA là gì, và {{LongAdder}} khác {{AtomicLong}} ở điểm nào?',
  a: `**Tóm tắt:** CAS là phép "so sánh rồi hoán đổi" nguyên tử của CPU: ghi giá trị mới chỉ khi giá trị hiện tại đúng như thấy — nền của lock-free. {{AtomicInteger}} dùng CAS loop cho getAndIncrement. ABA: giá trị đi A → B → A khiến CAS nghĩ không đổi; fix bằng {{AtomicStampedReference}} (kèm stamp). {{LongAdder}} chống hot-spot: tách counter vào nhiều cell, sum khi đọc — throughput cao hơn dưới conflict, đánh đổi độ chính xác lúc đọc.

### CAS trong JVM

~~~java
public final int incrementAndGet() {
    int cur;
    do {
        cur = get();                            // đọc hiện tại
    } while (!compareAndSet(cur, cur + 1));     // fail => thử lại
    return cur + 1;
}
~~~

- CAS compile thành lệnh {{lock cmpxchg}} trên x86 hoặc ldxr/stxr trên ARM — nguyên tử phần cứng, không cần mutex.
- Nhiều cấu trúc JDK xây trên CAS: AtomicXxx, AQS (nền ReentrantLock/Semaphore), ConcurrentHashMap node insert...

### Vấn đề ABA
CAS chỉ kiểm "bằng hay khác", không biết lịch sử biến đổi. Lỗi kinh điển trên lock-free  stack:

~~~text
Thread 1: đọc head = A, định CAS A -> next
Thread 2: pop A, pop B, push lại node A  (A B A)
Thread 1: CAS thành công — NHƯNG stack đã đổi thật
~~~

Fix:
- {{AtomicStampedReference}}: CAS trên cặp (reference, stamp); stamp tăng mỗi lần đổi.
- Trong Java object có GC tham chiếu sống nên ít bị; ABA chủ yếu ở off-heap/direct buffer, object pool, node reuse.
- Cách khác: gắn version number vào record, hoặc quay lại lock phần phức tạp.

### LongAdder vs AtomicLong

| | AtomicLong | LongAdder |
|---|---|---|
| Cơ chế | 1 volatile long + CAS | base + mảng Cell theo hash thread |
| Conflict cao | CAS liên tục fail, CPU đốt | mỗi thread CAS cell riêng, ít fail |
| sum() | chính xác tại một điểm | xấp xỉ khi khác thread đang update |
| Dùng khi | cần giá trị chuẩn từng thời điểm | đếm cho metrics, throughput cao |

LongAdder thắng hot-key bằng cách chia cache line: tránh nhiều core CAS trên cùng một cache line (cache line bouncing).

> Senior tip: rule code review: counter cho metrics → LongAdder; giá trị chuẩn từng thời điểm (token bucket rate limiter) → AtomicLong. Trong async-profiler, nếu thấy CAS fail spin loop của AtomicLong chiếm CPU khi conflict cao — đó là chỗ LongAdder thoải mái thay.`,
  follow: [
    'CAS + volatility: vì sao field của {{AtomicInteger}} phải volatile?',
    'ABA trên máy có GC tham chiếu sống: vẫn là vấn đề thật?'
  ],
  tags: ['CAS', 'AtomicInteger', 'ABA', 'LongAdder'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
}
,
{
  id: 'concurrency-010',
  topic: 'concurrency',
  level: 'mid',
  q: 'Double-checked locking cho singleton: viết code đúng và giải thích vì sao bắt buộc phải có {{volatile}}.',
  a: `**Tóm tắt:** DCL chỉ vào {{synchronized}} ở lần gọi đầu. Nếu instance không {{volatile}}, JIT/CPU có thể gán tham chiếu vào field trước khi constructor chạy xong; thread khác thấy tham chiếu khác null nhưng dùng object "nửa xây" (field chưa init). {{volatile}} cấm việc xếp lại này nhờ happens-before.

### Code đúng

~~~java
public class Db {
    private static volatile Db instance;   // volatile BẮT BUỘC

    public static Db getInstance() {
        Db r = instance;                   // đọc 1 lần cho đường nóng
        if (r == null) {
            synchronized (Db.class) {
                r = instance;              // đọc lại trong lock
                if (r == null) instance = r = new Db();
            }
        }
        return r;
    }
}
~~~

### Vì sao thiếu volatile là sai
- {{new Db()}} gồm: cấp phát memory, chạy constructor, gán tham chiếu vào field. JIT chỉ bảo đảm thứ tự nhìn từ bên trong khối synchronized; thread B ở ngoài có thể thấy gán-ref trước khi constructor kết thúc.
- Thread B vào nhánh đầu (không lock), thấy instance != null, trả về object chưa init — bug phụ thuộc CPU/JIT/scheduler, khó tái hiện.
- {{volatile}} tạo happens-before giữa ghi tham chiếu và đọc sau; mọi field init của constructor nhìn thấy được cho thread B.

### Phương án thay thế (khuyên dùng hơn)
- **Holder idiom** — tận dụng JVM lock cho class initializer, không cần volatile:

~~~java
private static class Holder { static final Db INSTANCE = new Db(); }
public static Db getInstance() { return Holder.INSTANCE; }  // lazy + thread-safe
~~~

- **{{enum}} singleton**: chống reflection + serialization miễn phí (Effective Java khuyên).
- Trong Spring app: bean singleton của container đã có lifecycle/scope đúng — đừng viết tay.

> Senior tip: tôi coi "singleton tự viết bằng DCL" là code legacy cần review kỹ: 2 nhóm bug thường gặp là (1) quên volatile — bug "object nửa xây" rơi vào production không repro được, (2) holder nhưng class được load bởi 2 classloader khác nhau trong app server.`,
  follow: [
    'Ba bước của {{new Foo()}} được JIT xếp lại thế nào?',
    'Holder idiom chạy thế nào khi class được load 2 lần bởi 2 classloader?'
  ],
  tags: ['singleton', 'double-checked locking', 'volatile']
},
{
  id: 'concurrency-011',
  topic: 'concurrency',
  level: 'senior',
  q: 'So sánh use case của {{CountDownLatch}}, {{CyclicBarrier}}, {{Semaphore}} và {{Phaser}}: khi nào chọn cái nào?',
  a: `**Tóm tắt:** {{CountDownLatch}} = chờ N việc xong (một lần). {{CyclicBarrier}} = N worker chờ nhau tới điểm đồng bộ, dùng lại được. {{Semaphore}} = giới hạn số thread vào đồng thời (giới hạn concurrency / tài nguyên — không phải rate limit theo thời gian). {{Phaser}} = barrier nhiều pha với số party linh hoạt.

### Code mẫu từng loại

~~~java
// CountDownLatch: fan-out, chờ tất cả xong rồi tổng hợp
CountDownLatch done = new CountDownLatch(tasks.size());
for (var t : tasks) executor.submit(() -> {
    try { process(t); } finally { done.countDown(); }   // nhớ finally
});
done.await(30, TimeUnit.SECONDS);

// CyclicBarrier: các worker chờ nhau mỗi pha, có barrier action
CyclicBarrier barrier = new CyclicBarrier(N, () -> flushStage());

// Semaphore: tối đa 5 call song song tới API ngoài
Semaphore gate = new Semaphore(5);
gate.acquire();
try { api.call(); } finally { gate.release(); }
~~~

### Khi nào chọn cái nào

| Tình huống | Lựa chọn |
|---|---|
| Đợi N tác vụ kết thúc rồi tổng hợp | CountDownLatch |
| Worker chờ nhau ở pha, lặp nhiều pha | CyclicBarrier |
| Giới hạn tài nguyên bên ngoài | Semaphore |
| Số party thay đổi giữa các pha | Phaser |
| Fan-out/fan-in async có data flow | CompletableFuture.allOf |

### Pitfall
- Quên countDown trong đường lỗi → await treo mãi: đặt trong finally, luôn dùng await có timeout.
- Semaphore: số release phải bằng acquire; release nằm ở finally; với semaphore, một thread khác release được (khác lock).
- CyclicBarrier: một thread ném lỗi làm barrier "broken" (BrokenBarrierException cho tất cả đang chờ); cần thiết kế reset/retry.
- CountDownLatch không reset; muốn tái dùng đổi CyclicBarrier.

> Senior tip: 90% nhu cầu fan-out thực chiến chỉ là "đợi N việc xong" — CountDownLatch + await timeout là mẫu gọn nhất. Tôi có một lần duy nhất phải dùng Phaser: pipeline nhiều stage số worker thay đổi khi kết thúc từng stage — mạnh nhưng không đáng dùng mặc định.`,
  follow: [
    'CyclicBarrier "broken" xảy ra thế nào, xử lý ra sao?',
    'Khi nào CompletableFuture.allOf thay thế được CountDownLatch?'
  ],
  tags: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-012',
  topic: 'concurrency',
  level: 'lead',
  q: 'Thiết kế hệ thống xử lý song song 1 triệu record với giới hạn tốc độ (rate limit của API bên ngoài) và yêu cầu không mất dữ liệu. Bạn dựng kiến trúc thế nào?',
  a: `**Tóm tắt:** tách bài thành 3 lớp: (1) nguồn có checkpoint (Kafka hoặc cursor trên bảng) để crash vẫn resume được; (2) fan-out có kiểm soát: queue bounded + rate limiter đúng theo quota API ngoài; (3) ghi idempotent + DLQ để đạt at-least-once mà hiệu ứng là exactly-once. Không dùng queue vô hạn; không suy ra quota từ số worker.

### Kiến trúc tổng thể

~~~text
Kafka topic (hoặc bảng job có cursor)
  -> Ingest worker: fetch batch nhỏ (vd 500), advance checkpoint sau khi batch được sink ack
  -> BoundedQueue (cap ~ 2x concurrency)
  -> Worker pool (virtual threads): mỗi worker 1 record
  -> Rate limiter (token bucket theo quota API) trước mỗi call ngoài
  -> Sink ghi idempotent theo key; lỗi đi DLQ
  -> Checkpoint store: advance sau khi cả batch commit
~~~

### 1) Nguồn — checkpoint bền vững
- Kafka: offset do broker quản lý, replay được; crash giữa chừng thì re-consume từ offset chưa commit — không mất dữ liệu.
- Batch job tự viết: lưu cursor (id cuối) trong bảng; commit checkpoint sau khi sink ack cả batch, không phải ngay khi đọc.

### 2) Concurrency + rate limit
- Đo quota thật của API ngoài (429 header, document); không guess. Dùng token bucket (Resilience4j/Guava RateLimiter).
- Concurrency cap theo Little's law: concurrency ≈ quota (rps) × latency dự kiến. Ví dụ 100 rps × 200 ms = 20 đang bay ⇒ semaphore 20.
- 429/Retry-After: worker tôn trọng Retry-After, thêm jitter để tránh stampede khi cả cụm retry cùng lúc; sau 3 lần retry thì đẩy record sang topic retry/DLQ.

~~~text
// Ví dụ: 10 nghìn record, quota 100 rps, latency 200 ms
// => 20 worker song song; rate limiter 100 rps chặn burst
// record gặp 429: chờ Retry-After + jitter, max 3 lần rồi vào DLQ
~~~

### 3) Không mất dữ liệu
- Sink idempotent theo key nghiệp vụ (upsert / unique constraint / event id) — retry an toàn.
- DLQ cho record fail sau N lần retry, kèm alert; không có DLQ là cách âm thầm mất data.
- Outbox pattern khi cần atomic giữa DB và hệ thống ngoài: ghi bảng outbox cùng transaction nghiệp vụ, relay background gửi đi; crash thì replay outbox.
- Shutdown có kế hoạch: dừng submit mới, chờ queue drain (có timeout), flush batch cuối, advance checkpoint, rồi mới tắt process.

### 4) Vận hành
- Metric: queue depth, in-flight count, rps thực tế vs quota, DLQ count, batch latency p99; alert khi DLQ > 0 liên tục.
- Load test phá: burst 10x quota, kill -9 giữa batch — checkpoint phải nhảy lại đúng chỗ.
- Bài toán quota làm trần cứng: chuyển sang batching — 1 call 500 record thay vì 500 call riêng lẻ.

> Senior tip: sai lầm đắt tôi từng thấy: "mỗi worker sleep 100 ms" với 250 worker mà nghĩ đã rate limit — kết quả 2.500 rps, API bắn 429 dồn dập, checkpoint không advance, mất 8 tiếng replay một batch. Rate limit phải đo được (rps thực tế vs quota trên dashboard), không đánh chặn bằng sleep trong code.`,
  follow: [
    'Vì sao checkpoint sau toàn batch chứ không sau từng record?',
    '429/Retry-After: worker retry cùng luồng hay đẩy sang topic riêng? Vì sao?'
  ],
  tags: ['rate limit', 'backpressure', 'idempotency', 'DLQ'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Package Documentation', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ],
}
,
{
  id: 'concurrency-013',
  topic: 'concurrency',
  level: 'senior',
  q: 'Structured concurrency (Java 21 preview): ý tưởng chính là gì, giải quyết vấn đề gì của CompletableFuture, và ScopedValues thay thế ThreadLocal chỗ nào?',
  a: `**Tóm tắt:** JEP 453 (preview từ Java 21) coi nhóm task song song là một khối có ranh giới: ra khỏi khối thì mọi subtask phải kết thúc; một con fail thì cha hủy các con còn lại rồi ném lỗi. ScopedValue (JEP 446, preview) là dữ liệu chia sẻ bất biến gắn với khối code thay cho ThreadLocal — tự hết hạn, không leak khi pool reuse, kế thừa rẻ cho virtual threads.

### Vấn đề của CompletableFuture
- Callback chạy trên thread không kiểm soát (executor/callback thread) — stack trace khó đọc.
- Không có hủy cascade: 1 task fail, các task còn lại vẫn chạy ngốn tài nguyên; phải tự viết logic hủy.
- Task "orphan" sống lâu hơn request (không giới hạn lifetime) — khó suy luận.
- Không có khối scope — không có điểm "tất cả phải xong".

### StructuredTaskScope

~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var u = scope.fork(() -> findUser(id));
    var o = scope.fork(() -> fetchOrder(id));

    scope.join().throwIfFailed();   // 1 con fail => hủy con còn lại
    return new Profile(u.get(), o.get());
}   // ra khỏi khối: không còn subtask nào sống
~~~

- Lifetime rõ: con không sống ngoài khối đã spawn nó; cancel lan truyền tự động.
- Hai policy có sẵn: ShutdownOnFailure (1 fail hủy tất cả) và ShutdownOnSuccess (1 thành công là đủ, hủy còn lại — hợp "race lấy nhanh nhất").

### ScopedValues

~~~java
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

ScopedValue.where(CURRENT_USER, user)
           .run(() -> handleRequest(request));   // gán chỉ trong run()
~~~

- Không có set/remove để quên: giá trị sống đúng trong scope rồi tự biến mất; không leak giữa các task trong pool.
- Bất biến; chỉ rebind cho scope nhỏ hơn.
- Với virtual thread, subtask fork trong StructuredTaskScope kế thừa binding rẻ (chia sẻ, không copy), không tạo entry per-thread như ThreadLocal.
- ScopedValue preview 21-24, final ở JDK 25 (JEP 506); structured concurrency vẫn preview ở JDK 25 và API đổi (StructuredTaskScope.open() + Joiner thay ShutdownOnFailure/ShutdownOnSuccess). Trên JDK 21 production: ThreadLocal.remove() trong filter vẫn là chuẩn an toàn.

> Senior tip: cách chia nhanh: CompletableFuture hợp với data flow compose nhiều bước; StructuredTaskScope hợp với mẫu "gọi N call, 1 fail hủy còn lại, tổng hợp". Tôi áp nó cho fan-out 3-5 call: code giảm từ 40 dòng (CompletableFuture + AtomicBoolean hủy tay) xuống 10 dòng, stack trace đọc dễ hẳn.`,
  follow: [
    'ShutdownOnFailure khác ShutdownOnSuccess ở use case nào?',
    'Vì sao ScopedValue khó leak hơn ThreadLocal trong thread pool?'
  ],
  tags: ['structured concurrency', 'ScopedValue', 'Java 21'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-014',
  topic: 'concurrency',
  level: 'senior',
  q: 'ForkJoinPool và work stealing: cơ chế hoạt động, vì sao parallel stream dùng chung commonPool là nguy hiểm trên server?',
  a: `**Tóm tắt:** ForkJoinPool cho mỗi worker một deque riêng: worker push/pop task của mình ở một đầu (LIFO), worker rảnh thì "trộm" ở đầu còn lại của deque người khác (FIFO). Nhờ vậy gần như không có lock chung, rất hợp với bài toán chia để trị. {{ForkJoinPool.commonPool()}} là pool tĩnh dùng chung cả JVM, parallelism mặc định = số core − 1. Parallel stream và các hàm {{*Async}} của CompletableFuture không truyền executor đều chạy trên pool này, nên chỉ một đoạn code blocking (JDBC, HTTP) cũng đủ chiếm hết vài worker và làm chậm mọi tính năng khác đang dùng chung.

### Work stealing hoạt động thế nào
1. Task gọi {{fork()}}: task con được push vào deque của chính worker đang chạy.
2. Worker lấy việc từ deque của mình theo LIFO: task vừa fork là task nhỏ nhất, dữ liệu còn nóng trong cache.
3. Worker hết việc chọn ngẫu nhiên một deque khác và steal ở đầu bên kia (FIFO). Task lâu đời nhất thường là task lớn nhất, trộm một lần được nhiều việc nên số lần phải trộm giảm.
4. {{join()}} không ngồi chờ suông: worker đang join sẽ chạy task khác (thường chính task con đó, hoặc task trộm được). Nhờ vậy pool nhỏ vẫn chạy được đệ quy sâu.

Vì sao chủ và kẻ trộm dùng hai đầu khác nhau? Hai bên chỉ đụng nhau khi deque gần rỗng, và chỗ đó được xử lý bằng CAS thay vì lock.

~~~java
class SumTask extends RecursiveTask<Long> {
    final long[] a; final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }
    protected Long compute() {
        if (hi - lo <= 10_000) {                    // đủ nhỏ thì tính tuần tự
            long s = 0; for (int i = lo; i < hi; i++) s += a[i]; return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();                                 // nửa trái vào deque, có thể bị trộm
        long right = new SumTask(a, mid, hi).compute(); // tự làm nửa phải
        return right + left.join();
    }
}
~~~

### Vì sao commonPool nguy hiểm trên server
- **Dùng chung cả JVM**: parallel stream, {{CompletableFuture.supplyAsync(fn)}} không có executor, {{Arrays.parallelSort}}, cả code trong thư viện bên thứ ba đều tranh nhau vài worker.
- **Rất nhỏ**: pod 4 vCPU chỉ có 3 worker. Pod ≤ 2 vCPU thì parallelism = 1; khi đó CompletableFuture async không có executor sẽ tạo một thread mới cho mỗi task (không giới hạn), còn parallel stream gần như không còn song song.
- **Không dành cho blocking**: worker bị chặn bởi JDBC/HTTP thì không làm được việc khác. ForkJoinPool chỉ bù thêm thread khi code báo trước qua {{ForkJoinPool.managedBlock}}, mà JDBC driver hay HTTP client không làm vậy.
- Kịch bản điển hình: một API gọi {{parallelStream()}} rồi trong lambda gọi HTTP sang core banking. Lúc tải cao các worker kẹt chờ I/O, mọi CompletableFuture async khác trong service phải xếp hàng, và các endpoint không liên quan cũng timeout dây chuyền.

### Làm đúng
| Tình huống | Cách làm |
|---|---|
| Gọi nhiều API song song (I/O) | {{supplyAsync(task, ioExecutor)}} với ThreadPoolExecutor bounded riêng, hoặc virtual thread (Java 21) |
| CPU-bound chia để trị | ForkJoinPool riêng, parallelism cố định |
| Parallel stream | Chỉ cho CPU-bound trên dữ liệu lớn, không I/O trong lambda; đo trước khi dùng |

- Parallel stream không nhận executor. Mẹo chạy nó bên trong {{customPool.submit(...)}} hoạt động được nhờ chi tiết cài đặt (task đang chạy trong pool nào thì fork vào pool đó), không phải hành vi được đặc tả. Tránh dùng mẹo này cho code quan trọng.
- Có thể chỉnh commonPool bằng system property {{java.util.concurrent.ForkJoinPool.common.parallelism}}, nhưng đó là núm vặn toàn cục, không thay được việc tách pool.
- Virtual thread dùng một ForkJoinPool **riêng** làm scheduler, không phải commonPool. Tuy vậy, nếu virtual thread bị pin (ví dụ I/O bên trong synchronized trên Java 21) thì carrier thread cũng bị giữ y như trên.

### Câu trả lời sai phổ biến
- "Parallel stream luôn nhanh hơn": với vài nghìn phần tử, chi phí chia và gộp lớn hơn lợi ích. Nguồn như {{LinkedList}} hay {{Stream.iterate}} lại chia rất kém.
- "commonPool có số thread bằng số core": thực tế là core − 1, vì thread gọi cũng tham gia làm việc.

> Senior tip: khi review code, tôi grep {{parallelStream}} và các lời gọi {{supplyAsync}} không truyền executor, vì đây là hai đường phổ biến nhất khiến việc rò vào commonPool. Hãy expose {{getActiveThreadCount()}} và {{getQueuedSubmissionCount()}} của commonPool thành metric: queue tăng dần trong giờ cao điểm là dấu hiệu có ai đó đang block trong pool.`,
  follow: [
    'Vì sao worker trộm task ở đầu FIFO của deque chứ không ở đầu LIFO?',
    'Bạn chọn ngưỡng tách task (threshold) cho RecursiveTask thế nào?',
    'ForkJoinPool.managedBlock dùng khi nào?'
  ],
  tags: ['ForkJoinPool', 'work stealing', 'commonPool', 'parallel stream'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-015',
  topic: 'concurrency',
  level: 'senior',
  q: 'Producer–consumer với {{BlockingQueue}}: backpressure, chọn bounded queue và chính sách khi queue đầy (reject, block, drop) — bạn quyết định thế nào?',
  a: `**Tóm tắt:** Producer–consumer phải dùng queue **có giới hạn**, vì queue không giới hạn chỉ đổi vấn đề "chậm" thành "OOM". Khi queue đầy có bốn lựa chọn: block producer ({{put}}), chờ có hạn ({{offer}} kèm timeout), từ chối ngay ({{offer}} trả false, trả 429/503 hoặc chuyển sang nơi lưu bền) và drop (chỉ cho dữ liệu được phép mất như metric). Cách chọn dựa trên hai câu hỏi: producer có được phép chậm lại không, và dữ liệu có được phép mất không.

### Vì sao bắt buộc bounded
- {{LinkedBlockingQueue}} tạo không truyền capacity thì capacity = {{Integer.MAX_VALUE}}; {{Executors.newFixedThreadPool}} dùng đúng loại này.
- Khi producer nhanh hơn consumer trong thời gian dài, queue phình ra: heap tăng, GC dày hơn, mỗi task chờ trong queue lâu hơn. Latency hỏng trước, OOM tới sau. Lúc đó client thường đã timeout từ lâu, nên phần lớn task trong queue là việc vô ích.
- Queue bounded biến quá tải thành một tín hiệu rõ ràng ngay tại biên hệ thống. Đó chính là **backpressure**.

### API khi queue đầy
| API | Khi đầy | Dùng khi |
|---|---|---|
| {{put(e)}} | Block vô hạn | Batch/ETL, producer là thread nội bộ, chờ được |
| {{offer(e, timeout, unit)}} | Chờ tối đa timeout rồi trả false | Request online: chờ ngắn rồi fail |
| {{offer(e)}} | Trả false ngay | Fail-fast, load shedding |
| {{add(e)}} | Ném IllegalStateException | Queue đầy được coi là bug |

Phía consumer cũng vậy: {{take()}} block, {{poll(timeout, unit)}} chờ có hạn (tiện để consumer định kỳ kiểm tra cờ shutdown).

### Chọn chính sách theo ngữ cảnh
- **API online (chuyển tiền, đặt hàng)**: queue nhỏ, {{offer}} với timeout vài chục ms; hết chỗ thì trả 429/503 kèm Retry-After. Queue sâu chỉ làm p99 xấu đi, không tăng throughput.
- **Batch/ETL đọc file đối soát**: dùng {{put()}}, producer đọc file chậm lại đúng bằng tốc độ ghi DB, bộ nhớ ổn định.
- **Dữ liệu không được mất (giao dịch, sự kiện thanh toán)**: không drop trong bộ nhớ. Ghi vào nơi bền vững trước (outbox table, Kafka) rồi mới xử lý, vì queue trong RAM mất sạch khi pod restart.
- **Metric, log, tracing**: {{offer()}} thất bại thì drop và đếm số bản bị drop.

### Với ThreadPoolExecutor
Không tự {{offer}} thẳng vào queue của executor, vì làm vậy bỏ qua logic tạo thread của pool. Hãy gọi {{execute}}/{{submit}} và chọn RejectedExecutionHandler:

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 8, 0, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),                  // tối đa 200 task chờ
    Thread.ofPlatform().name("stmt-", 0).factory(), // Java 21: đặt tên để đọc thread dump
    new ThreadPoolExecutor.AbortPolicy());          // đầy -> RejectedExecutionException

try {
    pool.execute(() -> process(stmt));
} catch (RejectedExecutionException e) {
    metrics.counter("stmt.rejected").increment();
    return ResponseEntity.status(503).build();      // báo client thử lại sau
}
~~~

| Policy | Hành vi | Hệ quả |
|---|---|---|
| AbortPolicy (mặc định) | Ném exception | Rõ ràng, caller tự xử lý |
| CallerRunsPolicy | Thread gọi tự chạy task | Backpressure tự nhiên; nhưng nếu caller là thread HTTP thì chính request đó chậm hẳn |
| DiscardPolicy | Bỏ im lặng | Nguy hiểm: mất task không dấu vết |
| DiscardOldestPolicy | Bỏ task cũ nhất rồi thử lại | Hợp với dữ liệu "chỉ cần bản mới nhất" |

### Chọn kích thước
Dùng Little's Law: số task trong hệ thống = throughput × thời gian chờ. Consumer xử lý 400 task/s và chỉ chấp nhận chờ tối đa 0,5 s thì queue khoảng 200; lớn hơn nữa chỉ khiến task chờ quá ngưỡng.

### Sai lầm thường gặp
- {{ArrayBlockingQueue}} dùng một lock cho cả put và take; {{LinkedBlockingQueue}} tách hai lock nên thường cho throughput cao hơn khi có nhiều producer và consumer, đổi lại mỗi phần tử phải cấp phát một node.
- Quên cách dừng consumer: cần poison pill hoặc interrupt, nếu không consumer kẹt mãi ở {{take()}}.

> Senior tip: kích thước queue là tham số SLA, không phải tham số hiệu năng. Tôi tính nó từ thời gian chờ tối đa chấp nhận được, rồi expose {{queue.size()}} và số lần reject thành metric. Alert khi queue liên tục trên 80%: đó là lúc phải scale consumer, không phải tăng queue.`,
  follow: [
    'Poison pill và interrupt: cách nào dừng consumer an toàn hơn?',
    'CallerRunsPolicy gây vấn đề gì khi caller là thread của Tomcat?',
    'Khi nào dùng SynchronousQueue thay vì queue có dung lượng?'
  ],
  tags: ['BlockingQueue', 'backpressure', 'bounded queue', 'producer-consumer'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-016',
  topic: 'concurrency',
  level: 'senior',
  q: 'Interrupt: {{InterruptedException}} xử lý đúng (khôi phục cờ), huỷ task, {{Future.cancel}} — bạn implement thế nào?',
  a: `**Tóm tắt:** Interrupt là cơ chế **hợp tác**: {{t.interrupt()}} chỉ bật một cờ. Thread đang bị chặn ở {{sleep}}, {{wait}}, {{join}}, {{BlockingQueue.take}}, {{Lock.lockInterruptibly}}... sẽ thoát ra bằng {{InterruptedException}}, và cờ bị xoá. Khi bắt được exception này chỉ có hai cách đúng: ném tiếp lên (khai báo throws), hoặc nếu không ném được thì gọi {{Thread.currentThread().interrupt()}} để khôi phục cờ rồi kết thúc công việc. {{Future.cancel(true)}} thực chất chỉ gửi interrupt tới thread đang chạy task; task không kiểm tra cờ thì vẫn chạy đến hết.

### Cơ chế
- Mỗi thread có một cờ interrupt. {{interrupt()}} bật cờ, và nếu thread đang ở một điểm chặn "interruptible" thì đánh thức nó.
- Các điểm chặn ném InterruptedException: {{Thread.sleep}}, {{Object.wait}}, {{Thread.join}}, {{BlockingQueue.put/take}}, {{Future.get}}, {{CountDownLatch.await}}, {{Lock.lockInterruptibly}}. Khi ném exception, JVM **xoá cờ**.

Không phải blocking nào cũng phản ứng với interrupt:

| Đang chặn ở | Khi bị interrupt |
|---|---|
| Chờ vào {{synchronized}}, {{Lock.lock()}} | Không bị ngắt, vẫn chờ tiếp |
| Socket I/O kiểu cũ ({{InputStream.read}}) | Thường không ngắt được; phải đóng socket hoặc đặt timeout |
| {{InterruptibleChannel}} của NIO | Channel bị đóng, ném {{ClosedByInterruptException}} |
| {{Selector.select()}} | Trả về sớm, không ném exception |

- Code thuần CPU phải tự kiểm tra {{Thread.currentThread().isInterrupted()}}. Lưu ý {{Thread.interrupted()}} (static) vừa đọc vừa **xoá** cờ.

### Hai cách xử lý đúng
~~~java
// 1. Không xử lý được thì khai báo throws, để caller quyết định
public Payment next() throws InterruptedException {
    return queue.take();
}

// 2. Runnable không ném được checked exception: khôi phục cờ rồi dừng
public void run() {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            process(queue.take());
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // để executor/framework phía trên biết
    } finally {
        releaseResources();
    }
}
~~~
Vì sao phải khôi phục cờ? Exception đã xoá cờ. Nếu bạn nuốt nó, executor hay framework phía trên không còn cách nào biết thread đã được yêu cầu dừng, và {{shutdownNow()}} sẽ "không ăn".

Không cần vừa gọi {{interrupt()}} vừa ném lại InterruptedException: ném lại là đã đủ để báo tin.

### Future.cancel
| Lời gọi | Task chưa chạy | Task đang chạy |
|---|---|---|
| {{cancel(false)}} | Không bao giờ chạy | Vẫn chạy tiếp, kết quả bị bỏ |
| {{cancel(true)}} | Không bao giờ chạy | Thread đang chạy task bị interrupt |

- Trong cả hai trường hợp, {{isCancelled()}} = true và {{get()}} ném {{CancellationException}} ngay.
- {{cancel}} trả về false nếu task đã xong hoặc đã bị huỷ trước đó.
- {{CompletableFuture.cancel(true)}}: tham số {{mayInterruptIfRunning}} **không có tác dụng**, vì CompletableFuture không biết thread nào đang tính nó. Muốn dừng thật thì phải tự truyền cờ huỷ vào task, hoặc dùng {{orTimeout}} kèm kiểm tra trong task.

### Huỷ task CPU-bound chạy lâu
Đặt điểm kiểm tra sau mỗi vòng hoặc mỗi lô, ví dụ {{if (Thread.currentThread().isInterrupted()) throw new CancellationException()}}. Commit theo lô để dừng giữa chừng mà dữ liệu vẫn nhất quán.

### Câu trả lời sai phổ biến
- Khối catch chỉ log rồi chạy tiếp: nuốt yêu cầu dừng, graceful shutdown treo cho tới khi pod bị kill.
- Bọc vào RuntimeException mà không khôi phục cờ.
- Nghĩ tới {{Thread.stop()}}: nó deprecated vì giết thread giữa chừng, để lại object hỏng và lock dở dang; từ JDK 20, gọi nó ném {{UnsupportedOperationException}}.
- "interrupt() dừng thread ngay lập tức": không, nó chỉ là yêu cầu.

> Senior tip: trong code review tôi grep {{catch (InterruptedException}}: mọi chỗ phải ném lại hoặc có {{Thread.currentThread().interrupt()}}. Với job đối soát chạy hàng giờ, tôi kiểm tra cờ interrupt sau mỗi batch 1.000 bản ghi và commit theo batch. Nhờ vậy khi deploy, {{shutdownNow()}} dừng được job trong vài giây mà dữ liệu vẫn nhất quán.`,
  follow: [
    'Task đang đọc socket bằng InputStream không phản ứng với interrupt — bạn dừng nó thế nào?',
    'Vì sao CompletableFuture.cancel(true) không interrupt được task?',
    'Thread.interrupted() khác isInterrupted() ở điểm nào?'
  ],
  tags: ['interrupt', 'InterruptedException', 'Future.cancel', 'shutdown'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-017',
  topic: 'concurrency',
  level: 'mid',
  q: '{{wait/notify}} vs {{Condition}}: spurious wakeup là gì, vì sao luôn kiểm tra điều kiện trong vòng lặp?',
  a: `**Tóm tắt:** {{wait}}/{{notify}} gắn với monitor của một object và chỉ gọi được khi đang giữ {{synchronized}} trên chính object đó; mỗi monitor chỉ có **một** wait set. {{Condition}} (lấy từ {{Lock.newCondition()}}) cho phép một lock có nhiều hàng chờ riêng (notFull, notEmpty), và có thêm {{awaitUninterruptibly}}, {{awaitNanos}}, {{awaitUntil}}. Luôn chờ trong {{while}}, vì thread có thể thức dậy khi điều kiện chưa đúng: spurious wakeup (đặc tả cho phép), {{notifyAll}} đánh thức nhiều thread cùng lúc, hoặc một thread khác chen vào lấy mất trạng thái trước khi bạn giành lại được lock.

### Cơ chế wait/notify
1. Thread A giữ monitor và gọi {{lock.wait()}}: A nhả monitor rồi vào wait set.
2. Thread B vào synchronized, đổi trạng thái, gọi {{notify()}}: một thread được chuyển từ wait set sang hàng chờ monitor. B vẫn giữ lock tới khi ra khỏi khối.
3. A phải giành lại monitor rồi mới chạy tiếp từ sau {{wait()}}. Trong khoảng giữa lúc được notify và lúc giành lại lock, thread C có thể đã vào lấy mất phần tử.
- Gọi wait/notify khi không giữ monitor sẽ ném {{IllegalMonitorStateException}}.
- {{wait()}} ném {{InterruptedException}} nếu bị interrupt trong lúc chờ. Cả hai cơ chế đều interruptible.

### So sánh
| | wait/notify | Condition |
|---|---|---|
| Đi với | synchronized | Lock (ReentrantLock...) |
| Số hàng chờ | 1 cho mỗi monitor | Nhiều cho mỗi lock |
| Chờ không bị ngắt | Không có | {{awaitUninterruptibly()}} |
| Timeout | {{wait(ms)}}, không cho biết còn lại bao lâu | {{awaitNanos}} trả về thời gian còn lại; {{awaitUntil(deadline)}} |
| Đánh thức | notify / notifyAll | signal / signalAll |

### Vì sao luôn dùng while
~~~java
// SAI: thức dậy là tin rằng điều kiện đã đúng
synchronized (lock) {
    if (queue.isEmpty()) lock.wait();
    return queue.remove();          // có thể NoSuchElementException
}
// ĐÚNG: thức dậy thì kiểm tra lại
synchronized (lock) {
    while (queue.isEmpty()) lock.wait();
    return queue.remove();
}
~~~
Kịch bản lỗi khi dùng {{if}}: hai consumer cùng chờ, producer thêm một phần tử rồi gọi {{notifyAll()}}. Consumer 1 lấy phần tử; consumer 2 giành được lock sau, không kiểm tra lại, gọi {{remove()}} trên queue rỗng. Spurious wakeup cho ra kết quả tương tự dù không ai notify. Javadoc của {{Object.wait}} yêu cầu luôn đặt wait trong vòng lặp.

### Bounded buffer bằng Condition
~~~java
final ReentrantLock lock = new ReentrantLock();
final Condition notFull = lock.newCondition();
final Condition notEmpty = lock.newCondition();

void put(T x) throws InterruptedException {
    lock.lock();
    try {
        while (count == items.length) notFull.await(); // chỉ producer chờ ở đây
        enqueue(x);
        notEmpty.signal();          // chỉ đánh thức consumer, không đánh thức producer
    } finally {
        lock.unlock();
    }
}
~~~
Khi chỉ có một wait set, {{notify()}} có thể đánh thức nhầm một producer khác thay vì consumer. Thread bị đánh thức nhầm lại đi ngủ, tín hiệu coi như "mất", và hệ thống có thể treo. Vì vậy code synchronized thường phải dùng {{notifyAll()}} (an toàn nhưng đánh thức thừa). Condition tách hàng chờ riêng nên {{signal()}} là đủ.

### Khi nào dùng
- Hầu hết trường hợp không nên tự viết: dùng {{BlockingQueue}}, {{CountDownLatch}}, {{Semaphore}}.
- Nếu phải tự viết, ưu tiên Lock + Condition khi có nhiều điều kiện chờ hoặc cần timeout chính xác.

### Câu trả lời sai phổ biến
- "Spurious wakeup hiếm nên dùng if cũng được": lý do chính để dùng while là notifyAll và việc bị chen trạng thái, những chuyện xảy ra thường xuyên.
- "notify() chạy thread được đánh thức ngay": thread đó còn phải chờ giành lại monitor.

> Senior tip: khi gặp bug "thỉnh thoảng treo" trong code wait/notify cũ, tôi kiểm tra ba thứ theo thứ tự: có {{if}} thay vì {{while}} không; có {{notify()}} trên monitor có nhiều loại waiter không; trạng thái có bị sửa ở ngoài khối synchronized không. Gần như mọi bug loại này rơi vào một trong ba chỗ đó.`,
  follow: [
    'notify() vs notifyAll(): khi nào notify() là đủ an toàn?',
    'Lost wakeup là gì và vì sao trạng thái phải được kiểm tra trong cùng lock?'
  ],
  tags: ['wait', 'notify', 'Condition', 'spurious wakeup', 'ReentrantLock']
},
{
  id: 'concurrency-018',
  topic: 'concurrency',
  level: 'senior',
  q: 'Safe publication và immutability: vì sao object không được publish an toàn có thể bị thấy "nửa vời"; {{final}} field semantics hoạt động ra sao?',
  a: `**Tóm tắt:** Publish nghĩa là làm cho reference tới một object nhìn thấy được từ thread khác. Nếu publish qua một field thường (data race), JMM không có quan hệ happens-before giữa các lệnh ghi trong constructor và lệnh đọc ở thread khác. Thread đọc có thể thấy reference khác null nhưng field bên trong vẫn là 0/null. Các cách publish an toàn: static initializer, field {{volatile}}/Atomic, ghi và đọc dưới cùng một lock, hoặc chuyển qua concurrent collection/BlockingQueue. Riêng field {{final}} có đảm bảo đặc biệt: nếu {{this}} không bị lộ ra trong constructor, mọi thread thấy object đều thấy giá trị final (và những gì đến được qua nó) đúng như lúc constructor kết thúc, kể cả khi publish qua data race.

### Vì sao thấy object "nửa vời"
~~~java
class Rate { int bps; Rate(int bps) { this.bps = bps; } }
static Rate current;                          // field thường, không volatile

// Thread A
current = new Rate(150);
// Thread B
Rate r = current;
if (r != null) System.out.println(r.bps);     // JMM cho phép in ra 0
~~~
- {{new Rate(150)}} gồm: cấp phát (field = 0), chạy constructor (bps = 150), gán reference vào current. Không có happens-before, JIT và CPU được phép làm cho thread B thấy lệnh gán reference trước lệnh ghi bps.
- Trên x86 hiện tượng này hiếm vì phần cứng gần như không đảo thứ tự các lệnh store, nhưng JIT vẫn có quyền sắp xếp lại. ARM (Graviton, Apple M) thì đảo thật, nên code "chạy ổn trên máy dev" có thể hỏng khi chuyển sang Graviton.

### Các cách publish an toàn
1. Khởi tạo trong static initializer, ví dụ {{static final Rate DEFAULT = new Rate(150);}}: JVM khoá trong lúc khởi tạo class.
2. Lưu vào field {{volatile}} hoặc {{AtomicReference}}.
3. Lưu vào field {{final}} của một object được tạo đúng cách.
4. Ghi và đọc trong cùng một lock.
5. Chuyển qua collection thread-safe: {{ConcurrentHashMap}}, {{BlockingQueue}}, {{CopyOnWriteArrayList}}.

### Ngữ nghĩa của final (JSR-133, Java 5+)
- Cuối constructor có một bước "freeze" cho các field final. Thread nào có reference tới object (sau khi constructor xong) đều thấy giá trị của field final, **và** thấy trạng thái của object được trỏ tới qua field final như tại thời điểm freeze (ví dụ các phần tử của một mảng final được gán trong constructor).
- Không được bảo đảm: các thay đổi sau constructor (thêm vào list final sau đó vẫn cần đồng bộ) và các field không final.
- Điều kiện bắt buộc: không để {{this}} lộ ra trong constructor (đăng ký listener, start thread, gán vào biến static). Nếu lộ ra, thread khác có thể thấy object trước khi freeze và mất luôn đảm bảo.

~~~java
public final class FxQuote {                  // immutable: publish kiểu nào cũng an toàn
    private final String pair;
    private final BigDecimal rate;
    private final List<String> sources;
    public FxQuote(String pair, BigDecimal rate, List<String> sources) {
        this.pair = pair;
        this.rate = rate;
        this.sources = List.copyOf(sources);   // copy phòng thủ, và bản copy là bất biến
    }
}
~~~

### Immutable object
- Mọi field {{private final}}, không setter, class {{final}}, copy phòng thủ với input/output mutable, không để lộ {{this}}.
- {{record}} cho field final nhưng chỉ bất biến **nông**: record chứa một {{List}} mutable vẫn bị sửa được từ bên ngoài, nên hãy copy trong compact constructor.
- Immutable không có nghĩa là không cần gì khi thay bản mới: {{volatile FxQuote latest}} vẫn cần volatile để thread khác thấy reference mới. Nội dung bên trong mỗi bản thì an toàn.

### Câu trả lời sai phổ biến
- "Constructor chạy xong rồi mới gán reference nên không có vấn đề": đó là thứ tự bên trong một thread, không phải thứ tự mà thread khác nhìn thấy.
- "final chỉ có nghĩa là không gán lại được": bỏ sót đảm bảo initialization safety.
- "Field final trỏ tới object mutable thì không có đảm bảo gì": có, trạng thái tại thời điểm freeze vẫn được nhìn thấy; chỉ các thay đổi về sau là không.

> Senior tip: pattern tôi hay dùng cho config hay bảng tỷ giá đổi định kỳ là object immutable cộng một field {{volatile}} (hoặc AtomicReference) giữ bản hiện tại. Thread cập nhật tạo object mới rồi gán một lần. Reader không cần lock và không bao giờ thấy trạng thái lẫn giữa bản cũ và bản mới, vừa rẻ vừa đúng hơn nhiều so với đặt lock quanh một object mutable.`,
  follow: [
    'Để lộ this trong constructor: cho ví dụ thực tế và hậu quả?',
    'Vì sao lỗi publish không an toàn hiếm gặp trên x86 nhưng xuất hiện trên ARM?',
    'record có thực sự immutable không?'
  ],
  tags: ['safe publication', 'immutability', 'final', 'JMM'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-019',
  topic: 'concurrency',
  level: 'lead',
  q: 'False sharing, cache line, {{@Contended}}: hiện tượng, phát hiện, khắc phục — đo bằng JMH thế nào?',
  a: `**Tóm tắt:** CPU đồng bộ cache theo đơn vị **cache line** (64 byte trên x86 và phần lớn ARM server). Khi hai thread ghi vào hai biến **khác nhau** nhưng nằm chung một line, mỗi lần ghi giao thức coherence (MESI) phải giành quyền sở hữu độc quyền line đó và vô hiệu hoá bản ở core kia. Line bị "chuyền qua lại" giữa các core, throughput giảm mạnh dù không có lock hay data race. Cách sửa là tách các biến ra những line khác nhau: {{@Contended}} (code ứng dụng phải chạy với {{-XX:-RestrictContended}}), padding, hoặc thiết kế để mỗi thread ghi vào vùng riêng như {{LongAdder}}. Đo bằng JMH với benchmark nhóm nhiều thread, kèm profiler {{perfnorm}} hoặc {{perf c2c}}.

### Cơ chế
1. Core 1 ghi {{a}}: line chứa a và b chuyển sang Modified ở core 1; bản ở core 2 thành Invalid.
2. Core 2 ghi {{b}} (cùng line): phải kéo line về từ core 1, tốn hàng chục tới hàng trăm chu kỳ (nhiều hơn nếu khác socket), và core 1 lại bị Invalid.
3. Lặp lại ở mỗi lần ghi: nút thắt nằm ở băng thông coherence chứ không phải phép tính.

Vì sao gọi là "false"? Hai thread không chia sẻ dữ liệu logic nào, chúng chỉ chia sẻ đơn vị đồng bộ của phần cứng.

### Hay gặp ở đâu trong Java
- Các field cạnh nhau trong một object, ví dụ counter request và counter error cùng class, mỗi cái do một thread ghi.
- Các phần tử liền kề của mảng: {{long[] perThread}} mà mỗi thread ghi vào ô của mình, trong khi 8 ô long nằm chung một line.
- Phần đầu của queue: con trỏ head (consumer ghi) và tail (producer ghi) nằm cạnh nhau.

### Cách khắc phục
~~~java
// JDK 9+: annotation nằm trong package nội bộ
// Biên dịch cần: --add-exports java.base/jdk.internal.vm.annotation=ALL-UNNAMED
// Chạy cần: -XX:-RestrictContended (không có thì JVM bỏ qua annotation ở class ngoài JDK)
import jdk.internal.vm.annotation.Contended;

class Stats {
    @Contended volatile long requests;   // mỗi field được đệm sang vùng riêng
    @Contended volatile long errors;
}
~~~
- JDK 8 dùng {{sun.misc.Contended}}; từ JDK 9 chuyển sang {{jdk.internal.vm.annotation.Contended}}. Mặc định JVM đệm 128 byte ({{-XX:ContendedPaddingWidth}}) để phòng CPU prefetch theo cặp line.
- Padding thủ công bằng các field long thừa trong cùng class không chắc chắn, vì HotSpot tự sắp xếp thứ tự field. Kỹ thuật bền hơn (JCTools, Disruptor dùng) là padding qua **kế thừa** nhiều tầng class, vì field của class cha luôn được đặt trước field của class con.
- Cách tốt nhất thường là đổi thiết kế: {{LongAdder}} (mảng Cell, và lớp Cell trong JDK được đánh dấu @Contended), hoặc counter cục bộ theo thread rồi gộp lại.

### Đo bằng JMH
~~~java
@State(Scope.Group)
public class FalseSharingBench {
    volatile long a, b;                       // cạnh nhau, rất có thể cùng line

    @Benchmark @Group("shared") @GroupThreads(1)
    public void writeA() { a++; }

    @Benchmark @Group("shared") @GroupThreads(1)
    public void writeB() { b++; }
}
// So sánh với biến thể đặt a và b ở hai object khác nhau, hoặc dùng @Contended
// Chạy thêm -prof perfnorm (Linux) để xem cache miss và số chu kỳ trên mỗi thao tác
~~~
- Benchmark phải chạy trên máy có ít nhất 2 core thật. Kết quả khác nhau giữa x86 và ARM, nên chỉ so sánh tương đối giữa các biến thể.
- Trên production Linux, {{perf c2c}} chỉ thẳng ra cache line bị tranh chấp và offset bên trong line.

### Câu trả lời sai phổ biến
- "False sharing là data race": không, dữ liệu vẫn đúng, chỉ có hiệu năng bị ảnh hưởng.
- "Thêm volatile hoặc synchronized là hết": cả hai không đổi bố cục bộ nhớ, thậm chí volatile còn làm hiện tượng rõ hơn.

> Senior tip: false sharing hiếm khi là nguyên nhân trong service CRUD, vì I/O và lock tốn hơn nhiều bậc. Tôi chỉ nghĩ tới nó khi thêm thread mà throughput không tăng (thậm chí giảm), CPU vẫn cao và profiler không thấy lock contention. Trước khi dùng @Contended (phụ thuộc API nội bộ, tốn bộ nhớ), hãy thử LongAdder hoặc thiết kế lại để mỗi thread chỉ ghi dữ liệu của riêng nó.`,
  follow: [
    'Vì sao padding bằng field thừa trong cùng một class không đáng tin, còn padding qua kế thừa thì có?',
    'LongAdder tránh false sharing và contention thế nào, đánh đổi gì so với AtomicLong?'
  ],
  tags: ['false sharing', 'cache line', '@Contended', 'JMH'],
  refs: [
    { type: 'doc', title: 'JEP 142: Reduce Cache Contention on Modern Hardware', url: 'https://openjdk.org/jeps/142' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ],
},
{
  id: 'concurrency-020',
  topic: 'concurrency',
  level: 'senior',
  q: 'Graceful shutdown executor: {{shutdown}} vs {{shutdownNow}}, {{awaitTermination}}; {{ScheduledExecutorService}} nuốt exception làm job ngừng chạy — xử lý thế nào?',
  a: `**Tóm tắt:** {{shutdown()}} ngừng nhận task mới nhưng vẫn chạy hết task đang chạy và task trong queue. {{shutdownNow()}} ngừng nhận, lấy các task còn trong queue ra trả về (không chạy chúng) và **interrupt** mọi worker; task nào không phản ứng với interrupt thì vẫn chạy tiếp. Cả hai đều không chờ, muốn chờ phải gọi {{awaitTermination(timeout)}}. Với {{ScheduledExecutorService}}, nếu một lần chạy của {{scheduleAtFixedRate}} ném exception thì mọi lần chạy sau **bị huỷ âm thầm**: exception nằm trong ScheduledFuture và không ai log. Thread không chết, chỉ có job ngừng. Cách sửa: bắt mọi exception trong thân job, log và đẩy metric.

### So sánh
| | Task mới | Task trong queue | Task đang chạy | Trả về |
|---|---|---|---|---|
| {{shutdown()}} | Bị reject | Vẫn được chạy | Chạy tiếp | void |
| {{shutdownNow()}} | Bị reject | Lấy ra, không chạy | Bị interrupt | List task chưa chạy |
| {{awaitTermination(t, unit)}} | Không đổi | Không đổi | Block tới khi pool kết thúc hoặc hết t | true nếu đã kết thúc |

### Quy trình chuẩn hai pha
~~~java
void stop(ExecutorService pool) {
    pool.shutdown();                                    // 1. ngừng nhận việc mới
    try {
        if (!pool.awaitTermination(20, TimeUnit.SECONDS)) {
            List<Runnable> dropped = pool.shutdownNow(); // 2. hết kiên nhẫn: interrupt
            log.warn("Bỏ {} task chưa chạy", dropped.size());
            if (!pool.awaitTermination(5, TimeUnit.SECONDS))
                log.error("Pool chưa dừng: có task bỏ qua interrupt");
        }
    } catch (InterruptedException e) {                  // chính thread này bị interrupt khi chờ
        pool.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
~~~
- Từ Java 19, {{ExecutorService}} là {{AutoCloseable}}: {{close()}} gọi shutdown rồi chờ tới khi mọi task xong (nếu thread gọi bị interrupt thì chuyển sang shutdownNow). Tiện cho pool ngắn hạn trong try-with-resources, nhưng thời gian chờ không có giới hạn.
- Tổng thời gian chờ phải nhỏ hơn {{terminationGracePeriodSeconds}} của pod (mặc định 30 giây), nếu không kubelet gửi SIGKILL giữa chừng.

### Bẫy của ScheduledExecutorService
~~~java
scheduler.scheduleAtFixedRate(() -> {
    syncFxRates();      // chỉ cần MỘT lần ném exception là mọi lần chạy sau bị huỷ
}, 0, 1, TimeUnit.MINUTES);
~~~
- Task được bọc trong {{ScheduledFutureTask}} (một dạng FutureTask). Exception bị bắt và lưu vào future, future chuyển sang trạng thái hoàn tất bất thường nên không được lên lịch lại. Worker thread **không chết**, UncaughtExceptionHandler **không** được gọi, không có dòng log nào.
- Chỉ ai gọi {{future.get()}} mới thấy exception (bọc trong ExecutionException), mà với job định kỳ thì hầu như không ai gọi.
- Với executor thường cũng vậy: task gửi bằng {{submit()}} giữ exception trong Future. Chỉ {{execute()}} mới để exception đi tới UncaughtExceptionHandler.
- Nếu một lần chạy lâu hơn chu kỳ, lần kế tiếp bắt đầu trễ chứ không chạy chồng lên nhau.

~~~java
scheduler.scheduleAtFixedRate(() -> {
    try {
        syncFxRates();
    } catch (Exception e) {                 // lưu ý: Error (vd OOM) lọt ra vẫn huỷ lịch
        log.error("syncFxRates failed", e);
        metrics.counter("job.fx.error").increment();
    }
}, 0, 1, TimeUnit.MINUTES);
~~~

### Trong Spring Boot
- {{server.shutdown=graceful}} (mặc định từ Spring Boot 3.4, các bản trước phải tự bật) cùng {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30s): web server ngừng nhận request mới và chờ các request đang chạy.
- Executor do Spring quản lý ({{ThreadPoolTaskExecutor}}, {{ThreadPoolTaskScheduler}}): cấu hình {{spring.task.execution.shutdown.await-termination=true}} và {{await-termination-period}}; nếu không, khi context đóng Spring chỉ gọi shutdown mà không chờ task xong.
- {{@Scheduled}} của Spring khác với ScheduledExecutorService trần: với task lặp lại, ErrorHandler mặc định log lỗi rồi để lịch chạy tiếp. Nhưng lỗi chỉ nằm trong log, vẫn cần metric để biết.

### Câu trả lời sai phổ biến
- "shutdownNow() dừng ngay mọi task": nó chỉ interrupt; task phải hợp tác.
- "Job định kỳ ném exception thì thread chết và pool tạo thread mới chạy tiếp": thread không chết, nhưng job thì dừng hẳn.

> Senior tip: kiểu incident hay gặp: job đồng bộ tỷ giá chạy mỗi phút, một lần API đối tác trả JSON lỗi gây NullPointerException, job ngừng chạy cả tuần cho tới khi khách khiếu nại tỷ giá cũ. Từ đó tôi bắt buộc mọi job định kỳ có try/catch bao ngoài và metric "lần chạy thành công gần nhất", alert khi quá 3 chu kỳ không cập nhật. Alert dựa trên "không có lần thành công" bắt được cả job chết lẫn job treo.`,
  follow: [
    'Task bỏ qua interrupt khi shutdownNow — bạn làm gì để pod vẫn tắt đúng hạn?',
    'scheduleAtFixedRate và scheduleWithFixedDelay khác nhau thế nào khi một lần chạy bị chậm?'
  ],
  tags: ['shutdown', 'shutdownNow', 'awaitTermination', 'ScheduledExecutorService'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-001',
  topic: 'jvm',
  level: 'senior',
  q: 'Liệt kê các vùng nhớ JVM (heap young/old, metaspace, stack, code cache, direct memory) và cho biết vấn đề ở vùng nào sinh ra triệu chứng gì.',
  a: `**Tóm tắt:** Heap (young Eden/Survivor + old) chứa object của code; metaspace là native memory cho metadata class; mỗi thread một stack; code cache chứa JIT code; direct memory cho NIO ByteBuffer ngoài heap. Triệu chứng nhanh: OOM "Java heap space" = heap; OOM "Metaspace" = nhiều class/classloader leak; "unable to create native thread" = stack/native; RSS cao hơn Xmx = native (direct/cache).

### Bảng tổng hợp

| Vùng | Chứa gì | Triệu chứng khi vấn đề |
|---|---|---|
| Heap: young (Eden + 2 Survivor) / old | object java | OOM Java heap space; Full GC thường xuyên |
| Metaspace | metadata class/method | OOM Metaspace; tăng dần mỗi redeploy |
| Stack mỗi thread | frame method | StackOverflowError; "unable to create native thread" |
| Code cache | JIT code đã compile | "CodeCache is full" — JIT ngừng compile, CPU tăng |
| Direct memory | ByteBuffer.allocateDirect, Netty | OOM direct buffer memory; RSS cao hơn Xmx |

### Điểm cần nhớ
- Young GC (minor) chạy nhanh, object sống qua vài minor GC được promote lên old; old chạy major/mixed GC chậm hơn — tỉ lệ young/old ảnh hưởng rõ throughput.
- Metaspace giới hạn bằng MaxMetaspaceSize; không đặt thì chỉ có RAM là trần — classloader leak có thể ăn hết container.
- Mỗi thread một stack (Xss mặc định ~512 KB–1 MB): 10k OS thread = chục GB reserve — lý do virtual thread dùng stack trên heap.
- Code cache bounded ({{-XX:ReservedCodeCacheSize}} ~240 MB); full làm JIT ngừng, hiệu năng rơi dần — service chạy lâu dễ gặp.
- Direct memory trần mặc định = Xmx (MaxDirectMemorySize); Netty/HTTP client dùng nhiều buffer direct — RSS nhìn luôn cao hơn Xmx một chút là bình thường.

### Cách phân khi có vấn đề
- OOM heap / RSS cao: bật HeapDumpOnOutOfMemoryError + NativeMemoryTracking cho 2 hướng.
- Metaspace tăng dần theo redeploy: gần như chắc chắn classloader leak; kiểm Dominator Tree của dump tìm WebappClassLoader.
- "unable to create native thread": không phải thiếu heap — đếm số thread, kiểm stack size và ulimit.

> Senior tip: luôn bật {{-XX:NativeMemoryTracking=summary}} ở môi trường quan trọng; so sánh jcmd VM.native_memory baseline rồi diff.summary trước khi kết luận "leak heap" — nhiều lần RSS tăng là native (direct buffer, metaspace) chứ heap trong sạch.`,
  follow: [
    'Metaspace khác PermGen (trước Java 8) thế nào, vì sao đổi?',
    'RSS lớn hơn Xmx — bạn điều tra bằng tool nào trước?'
  ],
  tags: ['heap', 'metaspace', 'direct memory', 'code cache'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-002',
  topic: 'jvm',
  level: 'senior',
  q: 'So sánh các GC: Serial, Parallel, G1, ZGC, Shenandoah — cơ chế và tiêu chí chọn; G1 hoạt động ra sao (region, mixed GC)?',
  a: `**Tóm tắt:** Serial và Parallel = stop-the-world, chọn theo throughput vs RAM nhỏ; G1 (mặc định từ Java 9) = region-based, incremental từng phần, cân bằng latency; ZGC (kể cả Generational) và Shenandoah = concurrent, pause dưới 1 ms cho heap lớn. Chọn theo mục tiêu: throughput → Parallel; cân bằng → G1; latency p99 thấp + heap to → ZGC.

### Bảng so sánh

| GC | Cơ chế | Phù hợp heap | Mục tiêu |
|---|---|---|---|
| Serial | STW đầy đủ, 1 thread | nhỏ (<100 MB) | app đơn giản/CLI |
| Parallel | STW, threads song song | vừa tới lớn | throughput tối đa |
| G1 | STW từng pha (ngắn) | trung – lớn (4–32 GB) | cân bằng latency |
| ZGC | concurrent, STW rất ngắn | lớn tới TB | pause < 1 ms |
| Shenandoah | concurrent | lớn | pause thấp |

### G1 hoạt động ra sao
- Heap chia đều thành region (1–32 MB); mỗi region gán định danh Eden / Survivor / Old / Humongous (object ≥ nửa region).
- Young GC: thuần Eden/Survivor region, STW parallel — nhanh vì ít region.
- Concurrent marking tính liveness per region (SATB), rồi old/mixed GC chọn region có liveness thấp (rác nhiều nhất, garbage-first) để dọn — đó là "mixed GC".
- IHOP (InitiatingHeapOccupancyPercent, mặc định 45): khi old chiếm mức đó của heap thì bắt đầu concurrent marking.

~~~bash
java -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -Xlog:gc* ...   # Java 9+
# G1 tự điều chỉnh số region mỗi lần GC để ăn vào mục tiêu pause
# MaxGCPauseMillis là mục tiêu hướng dẫn, không phải cam kết cứng
~~~

### ZGC / Shenandoah
- ZGC: con trỏ có bit màu (colored pointers) + load/store barrier; hầu hết giai đoạn chạy concurrent không STW; Java 21 có Generational ZGC (-XX:+ZGenerational) — tách young/old, throughput tốt hơn hẳn ZGC cũ; JDK 23 thành mặc định, JDK 24 bỏ hẳn ZGC non-generational (flag ZGenerational lỗi thời).
- Shenandoah: forwarding pointer + concurrent compaction; pause rất thấp.
- Giá chung: overhead CPU concurrent (cái này đấu với core của app), có chút barrier cost.

### Khi nào chọn
- **Parallel**: batch job, throughput ưu tiên, pause vài trăm ms chấp nhận được.
- **G1**: default đa số web/app heap trung tới lớn.
- **ZGC**: service latency nhạy (p99 < 10 ms), heap 4 GB tới TB, Java 21+.
- **Serial**: container nhỏ (~512 MB), ít core.

> Senior tip: nhảy ZGC vì "pause thấp" chưa chắc đúng: ZGC có overhead CPU concurrent và throughput có thể giảm so với G1 cùng heap; đo p99 tổng throughput 24h cho cả hai collector trước khi quyết — latency và throughput là bài toán đổi chỗ, chọn trên số liệu.`,
  follow: [
    'mixed GC của G1 chọn region thế nào?',
    'Generational ZGC khác ZGC non-generation thế nào?'
  ],
  tags: ['G1', 'ZGC', 'Shenandoah', 'Parallel GC'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
}
,
{
  id: 'jvm-003',
  topic: 'jvm',
  level: 'senior',
  q: 'Tuning heap cho JVM chạy trong container (Kubernetes): vì sao không nên đặt Xmx bằng RAM limit của pod? {{-XX:MaxRAMPercentage}} hoạt động thế nào?',
  a: `**Tóm tắt:** RSS của JVM = heap + metaspace + stack mỗi thread + code cache + direct memory + native khác. Đặt Xmx = RAM limit là lấy hết chỗ cho heap, không chừa native — container bị OOMKilled (exit 137) dù heap chưa OOM. {{-XX:MaxRAMPercentage}} (mặc định 25%) cho heap % RAM limit, phần còn lại dành native; thực tế nên 50–75% tùy profile.

### Vì sao Xmx = RAM limit là bẫy

~~~text
RAM limit 2 GB, Xmx = 2 GB
heap dùng 1.7 GB (chưa OOM heap)
RSS = heap 1.7 GB + metaspace 150 MB
     + thread stacks + code cache + direct buffers
     => ~2.1 GB > limit => kernel OOMKill pod (exit 137)
~~~

OOMKilled khác OOM "Java heap space": không exception trong log JVM, chỉ kube event "OOMKilled". HeapDumpOnOutOfMemoryError vô dụng cho native OOM.

### MaxRAMPercentage
- Java 10+ bật {{UseContainerSupport}} mặc định: JVM đọc cgroup limit và tính heap theo %.
- Mặc định 25% khá dè sẻn với service nặng; thực hành: 50–75%, nhớ heap % + native dự đoán < 100%.
- {{-XX:MaxDirectMemorySize}} cap direct buffer; {{-XX:MaxMetaspaceSize}} cap metaspace — hai mục native hay "ăn chừa" nhất phải có cap.
- {{-Xss256k}} nếu có ngàn thread — tiết kiệm GB native reserve cho stack.

### Pitfall production
- Kube event OOMKilled lặp lại là dấu đầu tiên; đừng chỉ đọc log JVM.
- Heap nằm dưới limit không đồng nghĩa an toàn: RSS vẫn tăng theo native; alert theo RSS (host metrics) chứ không chỉ heap.
- Heap 65% thường là mức an toàn cho app Spring Boot/Netty vốn ngốn native đáng kể.

> Senior tip: template tôi chia trong team: heap 65%, native 35% trong pod — chưa bị OOMKilled trong 2 năm. Tăng heap theo bước 50 → 60 → 65% sau khi đo RSS thật, không nhảy 75% ngay từ đầu.`,
  follow: [
    'OOMKilled (exit 137) khác OOM Java heap space thế nào?',
    'MaxRAMPercentage = 25% với pod 1 GB RAM là bao nhiêu MB heap?'
  ],
  tags: ['Kubernetes', 'MaxRAMPercentage', 'OOMKilled', 'container'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-004',
  topic: 'jvm',
  level: 'senior',
  q: 'Các loại OutOfMemoryError và cách chẩn đoán từng loại (heap dump, MAT) như thế nào?',
  a: `**Tóm tắt:** OOME hay gặp: {{Java heap space}}, {{GC overhead limit exceeded}}, {{Metaspace}}, {{unable to create native thread}}, {{Direct buffer memory}}. Mỗi loại dùng công cụ khác: heap dump + MAT cho heap; NMT cho native; đếm thread + ulimit cho native thread. Bật HeapDumpOnOutOfMemoryError từ đầu là bắt buộc.

### Bảng tổng hợp

| Error | Ý nghĩa | Công cụ |
|---|---|---|
| Java heap space | hết chỗ cấp phát object | heap dump → MAT (Leak Suspects, Dominator Tree) |
| GC overhead limit exceeded | GC ~98% thời gian, giải phóng < 2% heap | GC log + heap dump |
| Metaspace | metadata class vượt MaxMetaspaceSize | dump + đếm classloader; tăng theo redeploy = classloader leak |
| Unable to create native thread | OS từ chối tạo thread (ulimit, cgroup pids) | jstack đếm thread; ulimit -u; cgroup pids |
| Direct buffer memory | allocateDirect vượt MaxDirectMemorySize | NMT; kiểm Netty pool; tăng/tinh chỉnh cap |

### Làm việc với MAT
~~~bash
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dumps ...
jmap -dump:live,format=b,file=heap.hprof <pid>   # dump chủ động
~~~

- **Leak Suspects**: báo cáo nghi vấn tự động — bắt đầu từ đây.
- **Dominator Tree**: object giữ nhiều heap nhất; Path to GC Roots chỉ ra chain nào bám giữ.
- Retained size khác shallow size: bám theo retained mới tìm đúng gốc.

### Pitfall
- OOM heap nhưng dump không thấy object to: heap phân mảnh — cần cấp khối lớn liền kề mà không đủ (stream file, buffer lớn); tìm qua GC log.
- "Unable to create native thread" thường do leak executor tạo thread unbounded (newCachedThreadPool) — trace xem executor nào tạo thread không giới hạn.
- Về "Direct buffer": giảm pool direct của Netty hoặc tăng MaxDirectMemorySize theo đo của NMT.

> Senior tip: bật HeapDumpOnOutOfMemoryError ngay khi boot với Path đủ disk; dump có thể dừng JVM vài giây, nhưng đó là dump duy nhất đáng tin vì ở đúng trạng thái OOM — dump sau restart không có giá trị điều tra như vậy.`,
  follow: [
    'OOM "Java heap space" mà dump không thấy object to — bước tiếp theo?',
    'Vì sao JVM có message riêng "GC overhead limit exceeded"?'
  ],
  tags: ['OutOfMemoryError', 'MAT', 'heap dump'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-005',
  topic: 'jvm',
  level: 'senior',
  q: 'Memory leak trong Java: ví dụ thực tế thường gặp và cách tìm ra (heap dump, MAT)?',
  a: `**Tóm tắt:** Java có GC không nghĩa không leak: leak = object không còn dùng nhưng vẫn được tham chiếu từ GC Roots. Dạng phổ biến: cache static không eviction, listener không unregister, ThreadLocal trong pool, classloader leak khi redeploy, mutable key trong HashMap. Quy trình tiêu chuẩn: xem trend heap, dump 2 lần cách nhau, MAT Dominator Tree + Path to GC Roots.

### Dạng thực tế thường gặp
- **Static cache unbounded**: Map static put liên tục, không TTL/LRU — old gen tăng đều. Fix: Caffeine với maximumSize + expireAfter.
- **Listener không unregister**: register vào EventBus/cache nhưng khi service đóng không bỏ — mỗi lần khởi động lại heap tăng thêm một tầng.
- **ThreadLocal trong pool**: set không remove — context (user/MDC) sống mãi trong thread.
- **ClassLoader leak (Tomcat redeploy)**: JDBC driver register ở app lần 1 không unregister; ThreadLocal value tham chiếu webapp ⇒ WebappClassLoader không giải phóng sau redeploy.
- **Mutable key trong HashMap**: key bị mutate sau put ⇒ entry không tìm lại được (leak logic).
- **Resource không close**: Connection/InputStream trong exception path không finally — pool cạn connection, socket kẹt CLOSE_WAIT.

### Quy trình tìm
1. **Xem trend heap**: metrics old gen sau full GC tăng đều dần tới OOM sau vài giờ/ngày — leak chậm; biến động nhanh chỉ là burst.
2. **Heap dump 2 lần** cách nhau 30 phút đến 1 giờ; diff class histogram (MAT Compare hay jmap -histo) — class tăng đều là nghi phạm.
3. **MAT Dominator Tree**: object có retained heap lớn nhất — 90% bắt được static Map, cache, ThreadLocal map, classloader.
4. **Path to GC Roots** (exclude weak/soft): tìm chain giữ object; định ra chỗ code nào giữ.

~~~bash
jmap -dump:live,format=b,file=dump-1.hprof <pid>
jmap -histo <pid> | head -30
~~~

> Senior tip: thiết lập alarm trend (so sánh heap sau full GC giữa hai thời điểm cách nhau 1 giờ) bắt được leak sớm hơn alert mốc fixed rất nhiều; cột "Largest Objects" trong MAT là nơi tôi mở đầu luôn luôn khi điều tra dump.`,
  follow: [
    'Path to GC Roots — exclude weak/soft references nghĩa gì, vì sao?',
    'Chụp heap dump trong production có rủi ro gì (pause, disk)?'
  ],
  tags: ['memory leak', 'MAT', 'heap dump'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
}
,
{
  id: 'jvm-006',
  topic: 'jvm',
  level: 'lead',
  q: 'CPU 100% trên production: quy trình điều tra của bạn (top -H, jstack, async-profiler, JFR) như thế nào?',
  a: `**Tóm tắt:** tìm thread đốt CPU: top -H -p PID lấy thread id nóng nhất → grep nid trong jstack (JDK 18+ in nid thập phân; JDK 8–17 phải đổi sang hex trước), đọc frame đầu (hàm nóng). Cần phân sâu hơn thì dùng async-profiler/flame graph hoặc JFR. Phải trả lời được: đốt CPU vì code nghiệp vụ, JIT compiler, GC thread, hay native (TLS/deflate).

### Quy trình tiêu chuẩn
1. Xác định process đốt CPU nhất (top/htop).
2. Lấy thread nóng nhất của process đó:

~~~bash
top -H -p <pid>                          # threads, xem %CPU; giả sử TID nóng nhất là 4321
jstack <pid> | grep -A 12 "nid=4321"     # JDK 18+: nid in dạng thập phân (kèm [4321] sau #N)
printf %x 4321                           # JDK 8–17: nid là hex → 10e1
jstack <pid> | grep -A 12 "nid=0x10e1"
~~~

Frame đầu cùng thread RUNNABLE thường chỉ ra method đang đốt CPU.

3. Phân loại nguyên nhân: GC thread (kiểm jstat -gc và GC log), JIT compiler thread (-Xlog:jit + PrintCompilation), code business, native.
4. Flame graph khi stack không đủ:

~~~bash
./profiler.sh -d 30 -e cpu -f flame.html <pid>   # async-profiler 3.x: asprof
# frame rộng nhất (nhiều sample nhất) = chỗ đốt CPU nhiều nhất
# mặc định đã gồm cả native và kernel frame
~~~

5. JFR luôn bật cho service nhạy prod: jcmd <pid> JFR.start duration=60s filename=cpu.jfr; phân tích bằng JDK Mission Control (hotspot view, allocation call tree).

### Nguyên nhân thường gặp
- GC thread nóng → nhiều full GC: chuyển sang heap tuning, không phải fix code.
- JIT compiler thread nóng: hot path churn (lambda, polymorphic megamorphism).
- Busy-wait trong code: spin-loop wait, poll 0 ms, retry vòng không backoff.
- Native: TLS handshake, compress/deflate, bitmap — jstack không hiện native frame; async-profiler bắt được (hiện native frame mặc định).

> Senior tip: tôi bắt đầu bằng async-profiler (sampler-based, không STW — an toàn trong prod) trước khi soi jstack tỉ mỉ; CPU 100% mà GC và JIT đều an toàn thì 90% là busy-wait — tìm vòng while thiếu sleep trong review code.`,
  follow: [
    'CPU 100% mà hot thread nằm ở native — xác định thế nào?',
    'async-profiler khác JFR như thế nào, chọn cái nào?'
  ],
  tags: ['CPU', 'jstack', 'async-profiler', 'JFR'],
  refs: [
    { type: 'doc', title: 'Java Flight Recorder Runtime Guide', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html' },
    { type: 'doc', title: 'Java ThreadMXBean API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/ThreadMXBean.html' },
  ],
},
{
  id: 'jvm-007',
  topic: 'jvm',
  level: 'mid',
  q: 'Class loading: parent delegation model hoạt động thế nào và vì sao? ClassLoader leak khi redeploy webapp xảy ra ở đâu?',
  a: `**Tóm tắt:** parent delegation: class loader hỏi parent trước (bootstrap → platform → application) để load; không có mới tự load. Mục đích: java.* chỉ load 1 lần và không cho code bên ngoài giả mạo class hệ thống. ClassLoader leak: class của webapp bị giữ bởi tham chiếu static/ThreadLocal/driver không unregister ⇒ WebappClassLoader không GC, metaspace phình mỗi redeploy.

### Parent delegation
- Thứ tự: Bootstrap (java.base, java.*) → Platform (JDK modules) → Application (classpath) → WebAppClassLoader của mỗi webapp (Tomcat — loader này đảo thứ tự: tìm WEB-INF trước, trừ class java.* / JDK).

~~~text
loadClass(name):
  1. hỏi parent.loadClass(name); nếu parent tìm thấy => dùng của parent
  2. parent không có => tự findClass(name)
~~~

- Vì sao: an toàn (app không được inject java.lang.String giả) và nhất quán (một copy java.base dùng chung toàn JVM).
- JVM xác định "cùng class" theo (tên class, classloader id) nên class có thể load nhiều lần nếu app server chưa reuse.
- Java 9 module rewrite loader nhưng vẫn giữ logic delegate.

### ClassLoader leak khi redeploy
1. JDBC driver register vào DriverManager (static) mà app không deregister khi undeploy.
2. ThreadLocal value nằm trong thread pool của Tomcat, tham chiếu class webapp.
3. Static field/singleton của webapp giữ classloader.
~~~text
WebappClassLoader bị câu bởi chain static field -> class của webapp
=> Metaspace phình dần mỗi redeploy
=> vài lần redeploy gặp OOM Metaspace
Tomcat thường log: "The web application [app] appears to have started a thread named ..."
~~~

Fix tiêu chuẩn:
- Đăng ký lifecycle: Spring context close, JDBC driver deregister, ThreadLocal clear trong ServletContextListener.
- Tomcat có "leak prevention" built-in: bắt được nhiều nguồn phổ biến; vẫn phải theo dõi log "appears to have started a thread" khi redeploy.
- Tránh mutable static trong webapp; các cache dùng contract lifecycle của container.

> Senior tip: so sánh jcmd <pid> GC.class_histogram trước và sau redeploy là dấu hiệu sớm của loader leak: số class của webapp tăng dần sau mỗi lần redeploy — phát hiện trước OOM Metaspace nhiều ngày.`,
  follow: [
    'Vì sao một class có thể được load nhiều lần qua classloader khác nhau?',
    'Tomcat warn "appears to have started a thread" nghĩa là gì?'
  ],
  tags: ['classloader', 'parent delegation', 'tomcat']
}

,
{
  id: 'jvm-008',
  topic: 'jvm',
  level: 'senior',
  q: 'JIT compiler: C1/C2, tiered compilation, escape analysis, warm-up — và trade-off của GraalVM native image so với JVM?',
  a: `**Tóm tắt:** HotSpot compile theo tier: interpreter → C1 (nhanh, thu profile) → C2 (tối ưu mạnh). Escape analysis cho phép object không thoát khỏi method được scalar replacement (không cấp trên heap) và lock elision. Warm-up: perf đạt tối đa sau vài nghìn invocation; GraalVM native image là AOT: khởi động ~100 ms + RSS thấp, nhưng peak perf thường kém hơn JIT cho workload chạy dài.

### Tiered compilation
- C1 compile nhanh, ít tối ưu, kèm thu profile; C2 dùng profile đó để inline, escape analysis trong tối ưu mạnh.
- Method cấp mức "hot" được đẩy từ interpreter lên C1 rồi C2 (threshold ~10k invocation).
- Code cache là nơi chứa code đã compile — hãy reserve đủ (mặc định ~240 MB); đầy thì JIT ngừng, hiệu năng rơi dần theo thời gian chạy dài.

~~~bash
-XX:+PrintCompilation -Xlog:jit*   # xem method nào được compile, tier mấy
-XX:ReservedCodeCacheSize=512m      # nếu service chạy dài dễ đầy cache
~~~

### Escape analysis (C2)
~~~java
// object chỉ sống trong method — không escaping
int sum() {
    Point p = new Point();      // JIT scalar replacement: không cấp trên heap
    p.x = 1; p.y = 2;
    return p.x + p.y;
}
~~~
- Scalar replacement: object không escaping trở thành tập các biến local — giảm allocation, giảm GC work.
- Lock elision: synchronize trên object không escaping bị JIT bỏ đi.
- Cần method đủ để giữ và profile; thường người dùng trong hot loop.

### Warm-up
- Khi mới start, code chạy interpreter/C1 — perf thấp rõ rệt cho tới khi C2 compile xong hot path.
- Đo benchmark ngay sau restart cho ra số "nghèo" — phải warm-up vài nghìn request trước khi đo.
- Chỉnh được: threshold compile (thấp hơn → compile sớm hơn); JFR event Compilation để profiling hoạt động compile.

### GraalVM native image: trade-off

| Thang đo | JVM JIT | Native image |
|---|---|---|
| Start-up | vài giây (Spring Boot 2–10 s) | dưới 100 ms |
| RSS | cao hơn | thấp hơn nhiều |
| Peak perf | cao nhất cho hot path tốt | thường thấp hơn |
| Reflection/Proxy | bỏ qua | cần config rõ ràng (closed-world) |
| Debug/profiler | đầy đủ | hạn chế hơn |

- Native image dùng cho serverless/cron job/edge nơi startup + memory là điểm yếu; giữ JVM cho service chạy dài có warm-up đủ.
- Spring Boot 3 AOT + GraalVM đã khả thi cho app nhỏ; integration library native cần config reflection/proxy rõ ràng.

> Senior tip: rule của tôi: workload chạy dài (hàng giờ) giữ JVM — peak perf tốt sau warm-up; serverless/cron burst giữ native image. Benchmark riêng cho workload của mình trước khi quyết — startup nhanh và peak throughput cao là bài toán đổi chỗ, không phải win-win.`,
  follow: [
    'Object "escaping" nghĩa là gì, điều kiện nào để escape analysis dùng được?',
    'Native image đánh mất gì so với JIT hot path?'
  ],
  tags: ['JIT', 'C2', 'escape analysis', 'GraalVM'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
}
,
{
  id: 'jvm-009',
  topic: 'jvm',
  level: 'mid',
  q: 'Stop-the-world, safepoint là gì, và cách đọc GC log để phát hiện vấn đề?',
  a: `**Tóm tắt:** STW là giai đoạn mọi thread application phải dừng tại safepoint để JVM làm việc toàn cục (GC, deopt, thread dump; biased locking revocation trước JDK 15). Đọc GC log để theo pause của young/mixed có vượt mục tiêu không, allocation rate, promotion rate, và dấu hiệu full GC (trên G1 là warning lớn nhất).

### Safepoint
- Mọi thread phải tới "safepoint" — vị trí có full pointer state — trước GC/deopt/heap dump.
- Một thread chạy loop dài không safepoint (counted loop lớn) sẽ kéo dài time-to-safepoint; pause hiển thị gồm cả thời gian chờ cộng dồn.
- Log {{-Xlog:safepoint}} cho thấy reached/wait time; wait cao nghĩa là có thread chậm tới safepoint.

### Đọc GC log G1

~~~text
[gc] Pause Young (Normal) 512M->128M(1024M) 14.2ms   # dưới MaxGCPauseMillis: OK
[gc] Pause Young (Mixed) 300M->150M(1024M) 60ms      # mixed dọn old region
[gc] Pause Full (G1 Compaction Pause) 800M->600M(1024M) 800ms  # CẢNH BÁO lớn trên G1
[gc] to-space exhausted                               # thường trước Full GC
~~~

### Điều nhìn trong log
- **Pause vượt MaxGCPauseMillis thường xuyên**: xem young size, humongous allocation.
- **Full GC xuất hiện**: G1 không đủ chỗ (to-space exhausted) — tăng heap hoặc giảm humongous.
- **Allocation rate (MB/young GC)**: cao — nhìn lại code tạo rác (String concat, DTO copy).
- **Promotion rate lên old**: cao bất thường — object sống lâu hơn dự định; old đầy nhanh, phải xem mixed GC có theo kịp không.
- **Metaspace tăng theo deploy** — classloader leak.

~~~bash
# Java 9+
-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags
~~~

Phân tích tổng: GCeasy / GCViewer để nhìn biểu đồ pause, throughput GC, heap usage sau GC.

> Senior tip: rule của tôi: Full GC trên G1 (ngoài System.gc() thủ công) là dấu hiệu capacity failing — kéo 24h GC log trước mọi tuning, đo trước rồi tinh chỉnh; bước cuối cùng là tăng heap, không phải tune tham số mù.`,
  follow: [
    'GC pause ngắn mà app vẫn có spike latency — kiểm chứng thế nào?',
    'Mixed GC và Full GC của G1 khác gì?'
  ],
  tags: ['GC log', 'safepoint', 'G1']
}
,
{
  id: 'jvm-010',
  topic: 'jvm',
  level: 'senior',
  q: 'String deduplication, compressed oops, và object header layout — ước lượng size của object như thế nào?',
  a: `**Tóm tắt:** Compressed oops nén con trỏ 64-bit thành 4 bytes khi heap ≤ 32 GB (mặc định bật) — vượt 32 GB thì JVM tắt, reference 8 bytes làm heap cần thêm ~20%. Object header gồm mark word (8 B) + klass pointer (4 B với compression) ≈ 12 B + padding 8 B. Công cụ chuẩn: JOL (Java Object Layout). String deduplication (G1) chia sẻ backing array giữa các String cùng nội dung.

### Compressed oops
- Với heap ≤ 32 GB: pointer encode 4 bytes; vượt 32 GB tắt tự động ⇒ mỗi field reference phình 8 bytes.
- Bẫy kinh điển: tăng heap từ 31 GB lên 33 GB — chỉ vì bỏ compressed oops mà heap thực dùng tăng ~20–30%; nhiều case heap 31 GB có compression chứa được nhiều data hơn heap 33–40 GB không compression.
- Heap > 32 GB: cân nhắc sharding (nhiều instance nhỏ) hoặc chấp nhận chi phí.

### Object header + ước lượng
~~~text
compressed refs: mark word 8 B + klass 4 B = 12 B
data fields + padding tới bội 8 B
Integer: 12 + 4 = 16 B
class có long: 12 + 8 (long) + 4 padding = 24 B (không phải 8)
byte[100]: 12 + 4 (length) + 100 = 116 -> 120 B
~~~

- JOL (Java Object Layout) là công cụ chính — {{org.openjdk.jol:jol}} — in layout chính xác từng trường, padding.
- HashMap entry ~ 44-56 bytes mỗi entry — HashMap<Long, Object> 1 triệu entry ≈ 50+ MB, không phải 8 bytes/entry như tưởng.

### String deduplication (G1; từ JDK 18 mọi GC)
- {{-XX:+UseStringDeduplication}}: concurrent thread xử lý String sống qua age threshold, cho các String cùng nội dung chia sẻ backing byte[]/Latin-1 encoding.
- Giảm được 20–40% heap trong app có nhiều URL/config/token trùng lặp; bật theo age threshold (mặc định 3) và đo memory trước/sau.
- Java 9+ String dùng byte[] nội bộ (compact strings): String Latin-1 mỗi ký tự 1 byte — "1 tỷ ký tự ASCII ~ 1 GB" chứ không 2 GB.

> Senior tip: đo bằng công cụ (JOL + heap dump), đừng ước bằng trí nhớ: HashMap 1 triệu entry thường đòi 60–100 MB heap trước cả phần data — heap 2 GB có thể cạn chỉ với vài cache không eviction; tính theo header + ref + padding là skill ghi điểm của phỏng vấn JVM.`,
  refs: [
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 450: Compact Object Headers', url: 'https://openjdk.org/jeps/450' },
    { type: 'doc', title: 'JOL Java Object Layout', url: 'https://openjdk.org/projects/code-tools/jol/' }
  ],
  follow: [
    'Heap 31 GB vs 33 GB — vì sao 31 GB có khi tốt hơn?'
    ,
    'Compact strings (Java 9) đỡ heap bao nhiêu với text ASCII?'
  ],
  tags: ['compressed oops', 'String', 'JOL', 'object header']
}
,
{
  id: 'jvm-011',
  topic: 'jvm',
  level: 'lead',
  q: 'Service latency nhạy (p99 < 10 ms) trên JVM: chiến lược GC và tuning của bạn là gì (ZGC generational, heap layout, các nguồn STW ngoài GC)?',
  a: `**Tóm tắt:** với target p99 < 10 ms: chọn ZGC generational (Java 21+, pause dưới 1 ms gần như độc lập heap size); heap ~1.5–2× live set để tần suất concurrent mark thấp; kiểm soát cả các nguồn STW ngoài GC (safepoint lâu, code cache full, System.gc() trong library); đo bằng GC log + JFR + load test trước khi chuyển production.

### Quyết định chính

| Yếu tố | Chọn | Lý do |
|---|---|---|
| GC | ZGC generational (-XX:+UseZGC -XX:+ZGenerational) | pause < 1 ms, gần như không phụ thuộc heap size |
| Heap size | 1.5–2x live set | giảm tần suất concurrent mark cycle |
| young size | để ZGC gen tự điều chỉnh | gen ZGC tự quản young |
| Allocation rate | đo từng request, giảm String concat/DTO copy | concurrent GC vẫn tốn CPU khi alloc cao |

### Triển khai từng bước
1. Java 21+ + flag trên; pause thường 0.1–0.5 ms; cần đủ core vì ZGC dùng CPU concurrent (thuộc cùng máy với app).
2. Heap: không max trần theo RAM; 1.5–2× live set đủ trong đa số case (đo live set qua JFR/MAT).
3. Trừ các nguồn STW ngoài GC:
   - Safepoint: {{-Xlog:safepoint}} — kiểm counted loop dài gây TTSP tăng.
   - Code cache full: JIT ngừng compile, code chạy chậm dần — reserve đủ.
   - System.gc() từ third-party: với ZGC, System.gc() chạy một chu kỳ concurrent (chỉ thread gọi phải chờ); với G1 dùng {{-XX:+ExplicitGCInvokesConcurrent}} để tránh Full GC STW, hoặc {{-XX:+DisableExplicitGC}}.
   - HeapDumpOnOutOfMemoryError: dump có thể pause hàng chục giây — nhớ khi gặp.
4. Đo: GC log (pause p99), JFR allocation profile và Safepoint events; load test sinh burst 2× peak trước khi chuyển production.

~~~bash
-XX:+UseZGC -XX:+ZGenerational -Xlog:gc*,safepoint:file=gc.log:time
# JDK 23+: chỉ cần -XX:+UseZGC (generational là mặc định, JDK 24 bỏ flag ZGenerational)
~~~

### Khi không nên ZGC
- Heap nhỏ (< 4 GB) và ưu tiên throughput: G1 đủ tốt, ZGC tốn thêm CPU cho concurrent threads.
- Batch job (không quan tâm latency): Parallel GC cho throughput cao hơn.

> Senior tip: target p99 < 10 ms cần đo cả 3 tầng: GC pause (GC log), runtime event (JFR), scheduling/network (tracing ở tầng APM). ZGC giảm pause GC nhưng spike vẫn có thể đến từ safepoint, deopt, thread scheduling — đo từng tầng để không gán sai nguyên nhân cho GC.`,
  follow: [
    'ZGC generational khác ZGC non-generation thế nào, vì sao thêm?',
    'Các nguồn STW ngoài GC bạn đã gặp trong production?'
  ],
  tags: ['ZGC', 'latency', 'p99', 'safepoint'],
  refs: [
    { type: 'doc', title: 'JEP 439: Generational ZGC', url: 'https://openjdk.org/jeps/439' },
    { type: 'doc', title: 'JEP 333: ZGC', url: 'https://openjdk.org/jeps/333' },
  ],
},
{
  id: 'jvm-012',
  topic: 'jvm',
  level: 'senior',
  q: 'JFR + JMC: bật continuous profiling trên production, overhead, các event quan trọng cần theo dõi?',
  a: `**Tóm tắt:** JFR (Java Flight Recorder) là bộ ghi sự kiện tích hợp sẵn trong HotSpot, miễn phí từ JDK 11 (và đã backport về 8u262). Nó ghi vào buffer vòng trong bộ nhớ và đĩa với overhead rất thấp: cấu hình {{default}} được thiết kế ở mức khoảng 1%, đủ để chạy liên tục 24/7; cấu hình {{profile}} chi tiết hơn (khoảng 2%) dành cho các đợt điều tra ngắn. Bật bằng {{-XX:StartFlightRecording}} kèm {{maxage}}/{{maxsize}} để luôn có "hộp đen" vài giờ gần nhất. Khi có sự cố, dùng {{jcmd <pid> JFR.dump}} lấy dữ liệu ra rồi mở bằng JMC hoặc công cụ dòng lệnh {{jfr}}.

### Bật trên production
~~~bash
# Hộp đen chạy liên tục: giữ tối đa 6 giờ hoặc 1 GB
java -XX:StartFlightRecording=name=bb,settings=default,maxage=6h,maxsize=1g,dumponexit=true,filename=/data/jfr/exit.jfr -jar app.jar

# Có sự cố: dump phần dữ liệu đang có
jcmd <pid> JFR.dump name=bb filename=/data/jfr/incident.jfr

# Điều tra 2 phút với cấu hình chi tiết hơn
jcmd <pid> JFR.start name=probe settings=profile duration=2m filename=/data/jfr/probe.jfr
~~~
- {{maxage}}/{{maxsize}} chỉ có tác dụng khi recording ghi xuống đĩa ({{disk=true}}, mặc định là true).
- Trên Kubernetes: thư mục JFR nằm trên volume đủ dung lượng. Dump chủ động bằng jcmd khi alert bắn, hoặc dựa vào {{dumponexit=true}} nhưng phải copy file ra trước khi volume bị xoá.
- Lập trình: {{jdk.jfr.Recording}} (ví dụ {{new Recording(Configuration.getConfiguration("default"))}}), và từ JDK 14 có {{RecordingStream}} để đọc event theo thời gian thực (JFR Event Streaming), chẳng hạn đẩy GC pause sang Micrometer.

### Overhead đến từ đâu
- Phần lớn event là thông tin JVM vốn đã có (GC, safepoint, class load), gần như miễn phí.
- Phần tốn là **lấy stack trace** cho các event tần suất cao: execution sample, allocation sample, lock. Cấu hình default lấy mẫu thưa hơn và có ngưỡng (ví dụ chỉ ghi lần chờ lock hay socket I/O kéo dài trên 20 ms); profile lấy mẫu dày hơn và ngưỡng thấp hơn.
- Từ JDK 16, allocation dùng event {{jdk.ObjectAllocationSample}} có throttle (giới hạn số event mỗi giây) nên bật liên tục được. Hai event cũ {{jdk.ObjectAllocationInNewTLAB}} và {{jdk.ObjectAllocationOutsideTLAB}} tắt sẵn vì tốn.

### Event nên xem đầu tiên
| Vấn đề | Event |
|---|---|
| CPU cao, method nóng | {{jdk.ExecutionSample}}, {{jdk.CPULoad}}, {{jdk.ThreadCPULoad}} |
| GC | {{jdk.GarbageCollection}}, {{jdk.GCPhasePause}}, {{jdk.GCHeapSummary}} |
| Allocation | {{jdk.ObjectAllocationSample}} |
| Lock, chờ | {{jdk.JavaMonitorEnter}}, {{jdk.JavaMonitorWait}}, {{jdk.ThreadPark}} |
| I/O chậm | {{jdk.SocketRead}}, {{jdk.SocketWrite}}, {{jdk.FileRead}} |
| Pause ngoài GC | {{jdk.SafepointBegin}}, {{jdk.ExecuteVMOperation}} |
| Rò rỉ bộ nhớ | {{jdk.OldObjectSample}} (dump với {{path-to-gc-roots=true}}) |
| Virtual thread (JDK 21) | {{jdk.VirtualThreadPinned}}, {{jdk.VirtualThreadSubmitFailed}} |
| JIT | {{jdk.Compilation}}, {{jdk.Deoptimization}}, {{jdk.CodeCacheFull}} |

### Phân tích
- **JMC**: trang Automated Analysis tự chấm điểm các vấn đề phổ biến; Method Profiling và Flame Graph cho CPU; Memory cho allocation; các trang Lock Instances, Socket I/O, Garbage Collections; Threads cho thấy thread nào bị chặn vào lúc nào.
- **Không có GUI**: {{jfr summary file.jfr}}, {{jfr print --events jdk.GCPhasePause file.jfr}}. JDK 21 có thêm {{jfr view hot-methods file.jfr}} và {{jcmd <pid> JFR.view}} để xem bảng tổng hợp ngay trên server.

### Pitfall
- Quên {{maxage}}/{{maxsize}} cho recording dài, đĩa đầy.
- Chỉ bật khi đã có sự cố thì quá muộn: sự cố thoáng qua không tái hiện lại được. Giá trị lớn nhất của JFR là hộp đen chạy sẵn.
- File JFR chứa system property, biến môi trường và tham số dòng lệnh. Secret truyền qua biến môi trường sẽ nằm trong file, nên phải xử lý file như dữ liệu nhạy cảm.

> Senior tip: tôi bật JFR default với {{maxage=6h}} trên mọi pod và nối với alerting: khi p99 vượt ngưỡng, một job tự gọi {{JFR.dump}} trên đúng pod đó. Nhờ vậy những spike 30 giây lúc 2 giờ sáng vẫn có dữ liệu để đọc vào sáng hôm sau, thường lộ ra là safepoint dài, lock trên connection pool, hoặc một đợt allocation lớn do batch.`,
  follow: [
    'JFR và async-profiler khác nhau thế nào, khi nào dùng cái nào?',
    'Dùng JFR Event Streaming để đẩy số liệu GC pause sang Prometheus thế nào?',
    'Không có GUI trên server, bạn phân tích file .jfr bằng cách nào?'
  ],
  tags: ['JFR', 'JMC', 'profiling', 'production'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-013',
  topic: 'jvm',
  level: 'senior',
  q: 'Đọc heap dump: dominator tree, shallow vs retained size, GC roots path — quy trình tìm leak bằng MAT?',
  a: `**Tóm tắt:** Shallow size là kích thước của riêng object (header + field). Retained size là lượng bộ nhớ được giải phóng nếu object đó bị thu hồi: chính nó cộng với mọi object chỉ đến được qua nó. Dominator tree sắp xếp object theo quan hệ "mọi đường từ GC root tới B đều đi qua A", nên object đứng đầu một nhánh có retained size lớn chính là thứ đang giữ bộ nhớ. Quy trình: lấy dump đúng lúc → Leak Suspects → Dominator Tree sắp theo retained → Path to GC Roots (loại weak/soft) để biết **ai** đang giữ → đối chiếu với code. Leak tăng chậm thì so sánh hai dump cách nhau vài giờ.

### Lấy heap dump
~~~bash
# Tự động khi OOM (nên luôn bật)
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/

# Chủ động
jcmd <pid> GC.heap_dump /dumps/heap.hprof        # mặc định chỉ object live: chạy full GC trước khi dump
jcmd <pid> GC.heap_dump -all /dumps/heap.hprof   # gồm cả object không còn reachable
~~~
- Dump là **stop-the-world**: heap 8 GB có thể dừng từ vài giây tới hàng chục giây, và file lớn cỡ phần heap đang dùng. Trên production nên rút pod khỏi load balancer trước và chắc chắn volume đủ chỗ.
- Dump chứa dữ liệu thật (số tài khoản, token, thông tin khách hàng). Hãy áp dụng quy trình dữ liệu nhạy cảm khi copy ra máy phân tích.

### Shallow và retained
~~~text
GC root (static field CACHE)
  -> HashMap (shallow 48 B)
       -> Node[] (shallow 512 KB)
            -> 100.000 entry -> Session (shallow 32 B) -> byte[] 4 KB
Retained của HashMap: khoảng 400 MB   <- nghi phạm
Retained của một Session: khoảng 4 KB
~~~
- Leak hiếm khi là một object to. Thường đó là một collection có shallow nhỏ nhưng retained khổng lồ.
- Nếu một object được giữ qua hai đường khác nhau thì nó không thuộc retained của đường nào. Đó là lý do retained của từng nhánh có thể nhỏ trong khi heap vẫn đầy; khi đó hãy tìm dominator chung ở tầng trên.

### Quy trình trong MAT
1. **Leak Suspects report**: điểm khởi đầu nhanh, chỉ ra nhóm object chiếm phần lớn heap và đường tích tụ.
2. **Dominator Tree**, sắp theo Retained Heap; dùng "Group by class" hoặc "Group by class loader" khi app server chạy nhiều webapp.
3. **Path to GC Roots** với tuỳ chọn loại bỏ các reference phantom/weak/soft: chỉ giữ đường strong, vì weak/soft không ngăn GC nên không phải nguyên nhân leak.
4. **Merge Shortest Paths to GC Roots** trên một tập object (ví dụ toàn bộ {{Session}}) để thấy chúng bị giữ chung bởi đâu.
5. Histogram và **OQL** để đếm, lọc, ví dụ {{SELECT * FROM java.util.HashMap s WHERE s.size > 10000}}.
6. Leak tăng chậm: lấy hai dump cách nhau vài giờ, so sánh histogram để thấy class nào tăng đều.

### Hiểu đúng
- Khi parse dump, MAT **bỏ các object không reachable** (vẫn xem được ở Unreachable Objects Histogram), nên retained size không bị phình vì rác, kể cả khi dump bằng {{-all}}. Tác dụng thật của dump "live" là chạy GC trước khi dump, đổi lại thêm một lần STW.
- GC roots trong MAT gồm: biến local và tham số trên stack của thread đang chạy, static field (qua class và class loader), JNI reference, monitor đang bị giữ, class hệ thống.
- Thủ phạm hay gặp: static Map dùng làm cache không giới hạn, ThreadLocal trong thread pool, listener đăng ký mà không gỡ, persistence context của Hibernate trong batch dài, class loader cũ sau redeploy.

### Pitfall
- Dump 20 GB không mở được trên laptop: chạy MAT headless ({{ParseHeapDump.sh}}) trên máy RAM lớn, tăng {{-Xmx}} trong MemoryAnalyzer.ini, tạo index và report trước rồi mới mở GUI.
- Dump nằm trên filesystem của container sẽ mất khi pod restart. {{HeapDumpPath}} phải trỏ vào volume còn tồn tại sau restart.

> Senior tip: với leak tăng chậm, tôi không dump liên tục trên production vì mỗi lần là một lần STW. Tôi theo dõi xu hướng old gen sau GC qua metric, rồi chỉ chụp hai dump trên một pod đã rút khỏi traffic, cách nhau vài giờ. So sánh histogram giữa hai dump gần như luôn chỉ thẳng vào class đang tích tụ, sau đó Path to GC Roots cho biết đoạn code nào giữ nó.`,
  follow: [
    'Khi nào bạn dùng Unreachable Objects Histogram?',
    'Heap dump 20 GB, bạn phân tích bằng cách nào mà không làm treo máy?',
    'Retained size của các object cộng lại không bằng heap đang dùng — vì sao?'
  ],
  tags: ['heap dump', 'MAT', 'dominator tree', 'retained size', 'GC roots'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-014',
  topic: 'jvm',
  level: 'senior',
  q: 'Native Memory Tracking: RSS cao hơn heap nhiều — metaspace, thread stack, direct buffer, code cache, glibc malloc arenas. Phân tích như thế nào?',
  a: `**Tóm tắt:** RSS của process Java gồm heap, cộng native memory do JVM cấp phát (metaspace, code cache, thread stack, cấu trúc dữ liệu của GC, symbol, direct buffer...), cộng phần native mà JVM không theo dõi (thư viện JNI, overhead và phân mảnh của malloc). NMT ({{-XX:NativeMemoryTracking=summary}}) chỉ thấy phần JVM tự cấp phát. Quy trình: bật NMT, lấy baseline, sau vài giờ xem {{summary.diff}} để biết hạng mục nào tăng. Nếu tổng committed của NMT ổn định mà RSS vẫn tăng, hãy nghi phần nằm ngoài NMT, thường là glibc malloc arena hoặc thư viện native.

### Các hạng mục chính trong NMT
| Hạng mục | Nội dung | Tăng bất thường khi |
|---|---|---|
| Java Heap | Heap | Committed lên tới Xmx là bình thường |
| Class | Metaspace + compressed class space | Class loader leak, sinh class động (proxy, script engine) |
| Thread | Stack của platform thread | Số thread tăng (pool không giới hạn, thread không bao giờ kết thúc) |
| Code | Code cache của JIT | Thường ổn định; mặc định giới hạn 240 MB khi bật tiered compilation |
| GC | Card table, remembered set, mark bitmap | Heap lớn, remembered set của G1 lớn |
| Other (JDK 11+) | Direct ByteBuffer, Unsafe.allocateMemory | NIO/Netty không release buffer |
| Arena Chunk | Arena nội bộ của HotSpot (compiler...) | Tăng vọt lúc JIT biên dịch method lớn |

Lưu ý: "Arena Chunk" là arena của chính HotSpot, **không phải** malloc arena của glibc. Phần overhead của glibc không xuất hiện trong NMT.

### Thao tác
~~~bash
# Chỉ bật được lúc khởi động, không bật khi đang chạy
java -XX:NativeMemoryTracking=summary -jar app.jar

jcmd <pid> VM.native_memory baseline
# ... vài giờ sau
jcmd <pid> VM.native_memory summary.diff

# So sánh với RSS thực tế: các vùng lớn nhất
pmap -x <pid> | sort -k3 -n | tail -20
~~~
- summary có overhead nhỏ; detail ghi lại call stack cấp phát nên tốn hơn, chỉ dùng khi cần biết ai cấp phát.
- Đối chiếu: RSS xấp xỉ committed của NMT cộng phần ngoài NMT. Chênh lệch lớn và tăng dần thì vấn đề nằm ngoài JVM.

### Từng nguyên nhân
1. **Thread tăng**: đếm thread bằng {{jcmd <pid> Thread.print}} hoặc metric {{jvm.threads.live}}. Mỗi platform thread reserve {{-Xss}} (mặc định 1 MB trên Linux x64) nhưng chỉ commit các trang thực sự dùng.
2. **Class tăng**: class loader leak, CGLIB/ByteBuddy sinh class liên tục; xem chi tiết bằng {{jcmd <pid> VM.metaspace}}. Đặt {{-XX:MaxMetaspaceSize}} giúp lỗi lộ ra sớm, nhưng vẫn phải sửa nguyên nhân.
3. **Other tăng**: direct buffer. {{-XX:MaxDirectMemorySize}} mặc định bằng max heap. Netty có bộ đếm và giới hạn riêng ({{io.netty.maxDirectMemory}}) và có thể cấp phát ngoài bộ đếm của JDK; bật leak detector của Netty ({{-Dio.netty.leakDetection.level=paranoid}}) ở môi trường test.
4. **NMT ổn định mà RSS vẫn tăng**: phân mảnh và arena của glibc malloc. Các thread cấp phát nhiều có thể được gán arena riêng (giới hạn mặc định 8 × số core trên 64-bit), mỗi arena giữ lại bộ nhớ đã free. Thử {{MALLOC_ARENA_MAX=2}} hoặc đổi allocator (jemalloc) rồi so sánh. Thư viện native cũng thuộc nhóm này, ví dụ {{Inflater}}/{{GZIPInputStream}} không được close sẽ giữ bộ nhớ zlib.

### Container
Trên Kubernetes, pod bị OOMKilled (exit 137) khi RSS vượt memory limit, và lúc đó JVM không ném OutOfMemoryError nào. Vì vậy heap chỉ nên chiếm một phần của limit, phần còn lại để dành cho các hạng mục trên.

> Senior tip: công thức tôi dùng là RSS = heap + phần NMT ngoài heap + phần ngoài NMT, và luôn tính đủ ba con số trước khi kết luận. Case hay gặp: pod 4 GB bị OOMKilled dù heap chỉ 2,5 GB, NMT cho thấy Thread chiếm vài trăm MB vì một HTTP client tạo thread mới cho mỗi request. Trường hợp đó phải sửa code, tăng memory limit chỉ làm lỗi xảy ra chậm hơn.`,
  follow: [
    'Vì sao glibc malloc arena làm RSS phình, MALLOC_ARENA_MAX đánh đổi gì?',
    'NMT summary và detail khác nhau thế nào, khi nào cần detail?',
    'Pod bị OOMKilled nhưng log không có OutOfMemoryError — bạn điều tra thế nào?'
  ],
  tags: ['NMT', 'native memory', 'RSS', 'metaspace', 'malloc arena'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-015',
  topic: 'jvm',
  level: 'lead',
  q: 'Bộ JVM flags baseline cho service Spring Boot trên container: heap %, GC, OOM dump, GC log, exit on OOM — lý do từng flag?',
  a: `**Tóm tắt:** Baseline của tôi cho Spring Boot 3 trên Java 21 trong container: để JVM tự đọc memory limit của cgroup và đặt heap theo phần trăm ({{-XX:MaxRAMPercentage}} khoảng 60–75), chọn GC một cách tường minh (G1, hoặc Generational ZGC khi cần latency thấp), bật GC log có xoay vòng, heap dump khi OOM vào volume bền, {{-XX:+ExitOnOutOfMemoryError}} để process chết hẳn thay vì sống dở, và JFR chạy nền. Không thêm flag nào mà không đo được tác dụng của nó.

### Bộ flags
~~~bash
-XX:MaxRAMPercentage=70
-XX:InitialRAMPercentage=70
-XX:+UseG1GC
-Xlog:gc*:file=/logs/gc-%p.log:time,uptime,level,tags:filecount=5,filesize=20m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/dumps/
-XX:+ExitOnOutOfMemoryError
-XX:StartFlightRecording=settings=default,maxage=6h,maxsize=512m
-XX:NativeMemoryTracking=summary
~~~
Thường truyền qua biến môi trường {{JAVA_TOOL_OPTIONS}} hoặc ENTRYPOINT của image.

### Lý do từng flag
| Flag | Vì sao |
|---|---|
| MaxRAMPercentage=70 | Heap = 70% memory limit của container (JVM đọc cgroup v1/v2). Phần còn lại cho metaspace, thread stack, code cache, direct buffer, cấu trúc GC. Mặc định chỉ 25%, quá phí cho pod chỉ chạy một JVM |
| InitialRAMPercentage = Max | Không phải nới heap dần; nếu limit không đủ thì lộ ra ngay lúc khởi động |
| UseG1GC | Ghi rõ GC. JVM tự chọn SerialGC khi máy không phải "server class" (ít hơn 2 CPU hoặc dưới khoảng 1792 MB RAM), nên pod 1 vCPU sẽ âm thầm chạy Serial |
| Xlog:gc* | Unified logging (JDK 9+), xoay vòng 5 file × 20 MB, %p là pid |
| HeapDumpOnOutOfMemoryError + HeapDumpPath | Bằng chứng duy nhất cho OOM heap. Thư mục phải nằm trên volume còn tồn tại sau restart và đủ chỗ cho cỡ heap |
| ExitOnOutOfMemoryError | Sau OOM, trạng thái app không còn đáng tin (thread chết giữa chừng, thao tác dở dang). JVM thoát với exit code 3, container dừng và kubelet khởi động lại theo restartPolicy. Heap dump vẫn được ghi trước khi thoát |
| StartFlightRecording | Hộp đen overhead khoảng 1%, có dữ liệu ngay khi sự cố xảy ra |
| NativeMemoryTracking=summary | Chỉ bật được lúc khởi động; giúp điều tra khi RSS cao, overhead nhỏ |

### Generational ZGC
- Java 21: {{-XX:+UseZGC -XX:+ZGenerational}}. Từ JDK 23, chế độ generational là mặc định; JDK 24 bỏ hẳn chế độ không generational, nên khi nâng version thì bỏ flag ZGenerational.
- Chọn khi p99 latency bị GC pause chi phối và heap đủ lớn; đổi lại tốn thêm CPU và bộ nhớ so với G1.

### Những flag tôi KHÔNG đặt mặc định
- {{-Xss256k}}: stack nhỏ dễ gây StackOverflowError với call stack sâu của Spring/Hibernate. Nó cũng không liên quan tới virtual thread, vì stack của virtual thread nằm trên heap.
- {{-XX:MaxGCPauseMillis}} quá nhỏ (mặc định 200): G1 thu nhỏ young gen để đạt mục tiêu, GC dày hơn và throughput giảm.
- {{-XX:MaxDirectMemorySize}}, {{-XX:MaxMetaspaceSize}}: mặc định direct memory bằng max heap, metaspace không giới hạn. Chỉ đặt sau khi đã đo, với mục đích để lỗi lộ ra sớm dưới dạng OOM có thông báo rõ thay vì OOMKilled.
- Hàng loạt flag copy từ blog thời Java 8 (CMS, PermSize...): có flag JVM chỉ cảnh báo rồi bỏ qua, có flag khiến JVM từ chối khởi động.

### Ngoài JVM
- Spring Boot: {{server.shutdown=graceful}}, probe liveness/readiness của actuator. Những thứ này đặt trong application.yml, không phải flag JVM.
- Kubernetes: memory request = limit cho service quan trọng; {{terminationGracePeriodSeconds}} lớn hơn thời gian graceful shutdown.
- Kiểm tra JVM thực sự thấy gì: {{java -XX:+PrintFlagsFinal -version}} trong image, hoặc {{jcmd <pid> VM.flags}} khi đang chạy.

> Senior tip: con số 70% không phải chân lý. Tôi chạy load test với NMT bật, đo RSS lúc cao điểm rồi mới chỉnh: service nhiều thread hoặc dùng Netty cần chừa nhiều hơn (khoảng 60%), service ít thread với heap lớn có thể lên 75–80%. Và tôi luôn đọc log khởi động để xem JVM thực sự chọn GC nào và heap bao nhiêu, vì đã nhiều lần gặp pod 1 vCPU âm thầm chạy SerialGC.`,
  follow: [
    'ExitOnOutOfMemoryError và CrashOnOutOfMemoryError khác nhau thế nào?',
    'Pod bị OOMKilled (exit 137) trong khi heap chưa đầy — bạn điều tra thế nào?',
    'Vì sao JVM trong pod 1 vCPU lại chạy SerialGC?'
  ],
  tags: ['JVM flags', 'container', 'Spring Boot', 'GC log', 'OOM'],
  refs: [
    { type: 'doc', title: 'Java Launcher Command Reference', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
    { type: 'doc', title: 'Java Garbage Collection Tuning Guide', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' },
  ],
},
{
  id: 'jvm-016',
  topic: 'jvm',
  level: 'mid',
  q: 'Reference types: Soft/Weak/Phantom, {{ReferenceQueue}}, vì sao SoftReference cache là ý tồi?',
  a: `**Tóm tắt:** Strong reference giữ object sống. SoftReference chỉ bị GC dọn khi bộ nhớ căng, và JVM đảm bảo đã dọn hết soft reference trước khi ném OutOfMemoryError. WeakReference bị dọn ở lần GC đầu tiên thấy object chỉ còn weak reference. PhantomReference có {{get()}} luôn trả null, chỉ dùng để biết "object đã chết" qua {{ReferenceQueue}} và dọn tài nguyên ngoài heap; từ JDK 9 nên dùng {{java.lang.ref.Cleaner}} thay vì tự viết. Dùng SoftReference làm cache là ý tồi vì việc evict do GC quyết định theo áp lực heap, không theo kích thước hay giá trị của entry: cache luôn lấp đầy heap, rồi bị xả hàng loạt đúng lúc hệ thống căng nhất.

### So sánh
| Loại | Khi nào bị dọn | get() | Dùng cho |
|---|---|---|---|
| Strong | Khi không còn reference | object | Mặc định |
| Soft | Khi heap căng; chắc chắn trước OOM | object hoặc null | Hầu như không nên dùng |
| Weak | Lần GC kế tiếp khi chỉ còn weak | object hoặc null | {{WeakHashMap}}, gắn metadata vào object do người khác quản lý |
| Phantom | Sau khi object không còn reachable | luôn null | Dọn tài nguyên native |

### ReferenceQueue
Khi tạo reference kèm queue, sau khi referent bị dọn GC sẽ đưa chính **object Reference** (không phải referent) vào queue. Một thread dọn dẹp gọi {{poll()}} hoặc {{remove()}} trên queue để xoá entry hay giải phóng tài nguyên. {{WeakHashMap}} dùng đúng cơ chế này để xoá các entry có key đã chết.

### Cleaner thay cho PhantomReference tự viết (JDK 9+)
~~~java
public final class NativeBuffer implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();
    private final Cleaner.Cleanable cleanable;

    public NativeBuffer(long size) {
        long addr = allocate(size);
        // Action KHÔNG được tham chiếu tới this, nếu không object không bao giờ chết
        this.cleanable = CLEANER.register(this, new Free(addr));
    }
    private record Free(long addr) implements Runnable {
        public void run() { release(addr); }   // chạy khi object chết hoặc khi close()
    }
    @Override public void close() { cleanable.clean(); } // đường chính: đóng chủ động
}
~~~
- {{DirectByteBuffer}} trong JDK dùng cơ chế Cleaner (dựa trên PhantomReference) để trả lại bộ nhớ native.
- Bẫy khi tự viết: object PhantomReference phải được giữ strong ở đâu đó, nếu không chính nó bị GC và không bao giờ vào queue. Cleaner đã lo việc này.
- Cleaner chỉ là lưới an toàn. Tài nguyên vẫn phải được đóng chủ động bằng try-with-resources.

### Vì sao SoftReference cache là ý tồi
1. **Không giới hạn theo kích thước**: cache phình tới khi heap căng, nghĩa là heap luôn gần đầy, GC chạy dày hơn và old gen đầy object cache.
2. **Evict theo GC chứ không theo giá trị**: HotSpot giữ một soft reference dựa trên thời gian kể từ lần truy cập cuối so với lượng heap còn trống ({{-XX:SoftRefLRUPolicyMSPerMB}}, mặc định 1000 ms cho mỗi MB trống). Khi heap căng, rất nhiều entry bị xoá cùng lúc, cache miss hàng loạt và request dồn xuống DB đúng lúc tải cao.
3. **Tăng chi phí GC**: mỗi chu kỳ GC phải xử lý thêm hàng chục nghìn Reference object.
4. **Không quan sát được**: không có hit rate, không biết vì sao entry biến mất, hành vi lại khác nhau giữa các GC và cấu hình heap.

Thay bằng Caffeine với {{maximumSize}} hoặc {{maximumWeight}}, {{expireAfterWrite}}, {{recordStats()}}: kích thước dự đoán được, chính sách evict (W-TinyLFU) theo tần suất truy cập, có metric.

### Câu trả lời sai phổ biến
- "Weak reference bị dọn khi thiếu bộ nhớ": nhầm với soft.
- "WeakHashMap là cache tốt": nó weak ở **key**, không phải value. Key là String literal (được intern) sẽ không bao giờ bị dọn, còn key vừa tạo mới có thể mất ngay sau lần GC kế tiếp.
- "PhantomReference.get() trả object để dọn": luôn trả null; dữ liệu cần để dọn phải lưu riêng.

> Senior tip: khi review thấy {{SoftReference}} trong code cache, tôi yêu cầu chuyển sang Caffeine có giới hạn. Một thay đổi giải quyết được cả chuyện GC dày lẫn hiện tượng "cache tự nhiên trống trơn lúc 9 giờ sáng". Weak reference thì giữ đúng chỗ của nó: gắn metadata vào object có vòng đời do code khác quản lý.`,
  follow: [
    'WeakHashMap hoạt động thế nào và khi nào dùng nó an toàn?',
    'Vì sao action của Cleaner không được tham chiếu tới object đang được theo dõi?'
  ],
  tags: ['SoftReference', 'WeakReference', 'PhantomReference', 'ReferenceQueue', 'cache']
},
{
  id: 'jvm-017',
  topic: 'jvm',
  level: 'senior',
  q: 'Startup time: CDS/AppCDS, Spring AOT, CRaC, GraalVM native — so sánh và khi nào đáng làm?',
  a: `**Tóm tắt:** Có bốn hướng, đánh đổi tăng dần. (1) **CDS/AppCDS** lưu sẵn class đã parse vào một archive, giảm thời gian load class, gần như không phải đổi code. (2) **Spring AOT** sinh sẵn bean definition lúc build để bớt reflection lúc khởi động, đổi lại cấu hình bị "đóng băng" theo bản build. (3) **CRaC** chụp snapshot một JVM đã warm-up rồi restore trong khoảng vài chục tới vài trăm ms; cần JDK có hỗ trợ CRaC (Azul Zulu, BellSoft Liberica) và code phải đóng/mở lại kết nối. (4) **GraalVM native image** biên dịch AOT thành binary: khởi động tính bằng ms, RAM thấp, nhưng closed-world, build lâu và peak throughput thường thấp hơn JIT. Service chạy lâu dài: CDS là đủ (thêm AOT nếu cần). Scale-to-zero, serverless, CLI mới đáng đầu tư CRaC hoặc native.

### Thời gian khởi động đi đâu
Load và verify hàng chục nghìn class; Spring quét classpath và tạo bean bằng reflection; JIT chưa warm nên code chạy bằng interpreter. CDS và AOT nhắm vào hai phần đầu. Chỉ CRaC và native image giải quyết được cả warm-up.

### CDS / AppCDS
- Từ JDK 12 đã có sẵn archive cho class của JDK, bật mặc định. AppCDS (mở cho mọi người từ JDK 10) thêm class của ứng dụng vào archive.
- Cách đơn giản (JDK 13+): chạy thử một lần với {{-XX:ArchiveClassesAtExit=app.jsa}}, các lần sau chạy với {{-XX:SharedArchiveFile=app.jsa}}. Từ JDK 19 có {{-XX:+AutoCreateSharedArchive}} để tự tạo và tự tạo lại archive.
- Spring Boot 3.3+ hỗ trợ sẵn: giải nén jar ({{java -Djarmode=tools -jar app.jar extract}}), chạy training với {{-Dspring.context.exit=onRefresh}} để app khởi động xong thì thoát và ghi archive.
- Archive chỉ dùng được với **đúng** bản JDK và classpath lúc tạo; lệch thì JVM bỏ qua archive (chỉ cảnh báo). Vì vậy phải tạo archive ngay trong lúc build Docker image.
- CDS không lưu code đã JIT. Mức cải thiện thường vào khoảng vài chục phần trăm thời gian khởi động. JDK 24 (JEP 483) mở rộng thành AOT cache, lưu cả class đã được load và link sẵn.

### Spring AOT
- Goal {{process-aot}} của {{spring-boot-maven-plugin}} (hoặc plugin Gradle tương ứng) sinh code Java cho bean definition lúc build. Trên JVM, bật bằng {{-Dspring.aot.enabled=true}}; với native image thì AOT là bắt buộc.
- Đánh đổi: các điều kiện như {{@Profile}}, {{@ConditionalOnProperty}} được đánh giá lúc build, nên không thể đổi profile hay tập bean lúc chạy như trước. Lợi ích trên JVM thường ở mức vừa phải; giá trị chính của nó là làm nền cho native image.

### CRaC
- Không có trong OpenJDK chính thức. Cần bản JDK có CRaC, chỉ chạy trên Linux, dựa trên CRIU.
- Quy trình: chạy {{java -XX:CRaCCheckpointTo=/cr -jar app.jar}}, warm-up, rồi {{jcmd app.jar JDK.checkpoint}}. Lần sau khởi động bằng {{java -XX:CRaCRestoreFrom=/cr}}.
- Spring Framework 6.1 / Boot 3.2 tích hợp sẵn: các bean có lifecycle được stop trước checkpoint và start lại sau restore; có chế độ tự checkpoint khi context refresh xong ({{-Dspring.context.checkpoint=onRefresh}}).
- Code tự viết phải implement {{org.crac.Resource}} ({{beforeCheckpoint}} / {{afterRestore}}) để đóng socket, file, connection pool trước khi chụp và mở lại sau khi restore.
- Snapshot chứa toàn bộ heap, kể cả secret và token, nên phải bảo vệ như dữ liệu nhạy cảm. Cẩn thận với giá trị sinh ra lúc khởi động (seed random, instance id) vì nó bị trùng giữa mọi bản restore.
- AWS Lambda SnapStart là cơ chế snapshot riêng của Lambda (microVM Firecracker), chỉ dùng chung API hook {{org.crac}}; nó không phải là chạy JDK CRaC.

### GraalVM Native Image
- Phân tích tĩnh từ hàm main và chỉ đưa code reachable vào binary (closed-world). Reflection, dynamic proxy, resource, serialization phải được khai báo trong reachability metadata. Spring AOT và GraalVM Reachability Metadata Repository lo phần lớn; thư viện ít phổ biến thì phải tự khai báo.
- Lợi: khởi động hàng chục ms, RSS thấp, image nhỏ. Hại: build mất vài phút và tốn nhiều RAM, debug và profiling khác hẳn JVM, peak throughput thường thấp hơn JIT (Oracle GraalVM có PGO để thu hẹp khoảng cách), ít lựa chọn GC hơn.

### Khi nào đáng làm
| Bối cảnh | Lựa chọn |
|---|---|
| Service chạy lâu trên K8s, rolling deploy | CDS là đủ; đầu tư vào readiness probe và warm-up |
| Cần autoscale gấp khi spike (flash sale) | CDS và giữ min replicas đủ; CRaC nếu đã kiểm soát được snapshot |
| Lambda, scale-to-zero | SnapStart hoặc native image |
| CLI, job ngắn, sidecar | Native image |

> Senior tip: trước khi tối ưu startup, hãy hỏi "ai đang chờ startup?". Với service K8s rolling update, 20 giây khởi động thường không ai thấy; thứ gây sự cố là pod nhận traffic khi JIT chưa warm, khiến p99 tăng vọt trong vài phút đầu. Hãy đo bằng {{BufferingApplicationStartup}} kèm endpoint startup của actuator để xem bean nào chậm: nhiều khi chỉ một bean gọi mạng lúc khởi động đã chiếm nửa thời gian.`,
  follow: [
    'AppCDS archive bị vô hiệu khi nào, và bạn tích hợp nó vào Docker build thế nào?',
    'CRaC snapshot chứa những gì, xử lý connection pool và secret thế nào khi restore?',
    'Spring AOT ràng buộc gì với @Profile và @ConditionalOnProperty?'
  ],
  tags: ['CDS', 'AppCDS', 'Spring AOT', 'CRaC', 'GraalVM', 'startup'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-018',
  topic: 'jvm',
  level: 'senior',
  q: 'async-profiler: CPU vs wall-clock vs alloc vs lock mode, đọc flame graph để tìm hot path như thế nào?',
  a: `**Tóm tắt:** async-profiler là profiler lấy mẫu cho HotSpot. Nó lấy stack trace mà không cần chờ safepoint, nên không bị safepoint bias như các profiler JVMTI cổ điển, và thấy được cả frame native lẫn kernel. Chọn mode theo câu hỏi cần trả lời: **cpu** — ai đang đốt CPU; **wall** — thread đang ở đâu theo thời gian thực, kể cả lúc chờ I/O hay lock (dùng để tìm latency); **alloc** — ai cấp phát nhiều (nguồn áp lực GC); **lock** — ai chờ lock lâu. Trên flame graph, chiều rộng là tỷ lệ sample chứ trục X không phải thời gian; hãy tìm frame rộng, đặc biệt là các "đỉnh phẳng" (self time) ở trên cùng.

### Bốn mode
| Mode | Lấy mẫu thế nào | Trả lời câu hỏi |
|---|---|---|
| {{cpu}} | perf_events (chu kỳ CPU); chuyển sang {{itimer}}/{{ctimer}} khi không có quyền | Hot method: serialize JSON, regex, crypto |
| {{wall}} | Timer, lấy mẫu mọi thread bất kể trạng thái | Request chậm vì chờ DB, HTTP, lock |
| {{alloc}} | Lấy mẫu theo TLAB (JDK 11+ qua JVMTI SampledObjectAlloc) | Ai sinh rác, vì sao GC dày |
| {{lock}} | Monitor bị tranh chấp và LockSupport.park | synchronized hoặc ReentrantLock tranh chấp |

### Lệnh hay dùng
~~~bash
asprof -d 30 -e cpu -f /tmp/cpu.html <pid>
asprof -d 30 -e wall -t -f /tmp/wall.html <pid>     # -t: tách flame graph theo thread
asprof -d 30 -e alloc -f /tmp/alloc.html <pid>
asprof -d 30 -e lock -f /tmp/lock.html <pid>
# Nhiều event cùng lúc: chỉ với output JFR
asprof -d 60 -e cpu,alloc,lock -f /tmp/profile.jfr <pid>
~~~
- {{asprof}} là tên launcher từ bản 3.0 (trước đó là {{profiler.sh}}). Cũng có thể nạp như agent lúc khởi động: {{-agentpath:/opt/ap/lib/libasyncProfiler.so=start,event=cpu,file=cpu.html}}.

### Đọc flame graph
- Mỗi hình chữ nhật là một frame; frame bên dưới gọi frame bên trên. Chiều rộng là phần trăm số sample có chứa frame đó (inclusive).
- Phần một frame rộng hơn tổng các frame con phía trên nó là **self time**: code thực sự tiêu tốn tài nguyên ngay tại method đó.
- Thứ tự trái phải xếp theo tên, không theo thời gian. Click để zoom; tính năng tìm kiếm tô sáng mọi frame khớp tên và cho biết tổng phần trăm.
- Màu theo palette mặc định (có thể khác chút giữa các phiên bản): xanh lá là Java đã JIT, xanh ngọc là method được inline, vàng là C++ của JVM (GC, JIT compiler), đỏ là native của thư viện, cam là kernel.
- Cách đọc: đi từ dưới lên, tìm nhánh code của mình chiếm phần lớn bề rộng, rồi nhìn các đỉnh phẳng phía trên nhánh đó.

### Ví dụ tình huống
- CPU 90%: flame graph cpu cho thấy 40% nằm trong {{ObjectMapper.writeValueAsString}}, được gọi từ một dòng log in nguyên object ở mức INFO. Sửa bằng cách bỏ log đó hoặc chỉ log id.
- p99 cao nhưng CPU chỉ 20%: flame graph cpu không có gì nổi bật; wall với {{-t}} cho thấy thread HTTP đứng ở {{HikariPool.getConnection}}. Pool cạn chứ không phải code chậm.
- GC dày: alloc chỉ ra {{String.format}} và boxing trong vòng lặp tính phí.
- Thêm thread mà throughput không tăng: lock chỉ ra một khối {{synchronized}} bao quanh cache.
- Lưu ý: từ JDK 13, socket I/O cổ điển chạy qua {{NioSocketImpl}}, nên frame chờ đọc socket thường nằm trong package {{sun.nio.ch}}.

### Trên production
- Overhead thấp ở interval mặc định (cpu 10 ms), chạy được trên production cho các phiên vài chục giây.
- Trong container, perf_events thường bị chặn ({{perf_event_paranoid}}, seccomp): dùng {{-e itimer}} hoặc {{ctimer}}, hoặc cấp quyền phù hợp. Nên thêm {{-XX:+UnlockDiagnosticVMOptions -XX:+DebugNonSafepoints}} lúc khởi động để stack trace của code được inline chính xác hơn.
- So với JFR: JFR luôn chạy sẵn và có nhiều loại event (GC, I/O, safepoint); async-profiler mạnh hơn khi cần frame native/kernel, wall-clock rõ ràng và flame graph nhanh.

> Senior tip: khi điều tra latency, tôi chạy wall với {{-t}} trước cpu. CPU profile chỉ thấy phần thời gian thread thực sự chạy; nếu 80% thời gian của request là chờ connection pool thì tối ưu hot method trên flame graph cpu chỉ cải thiện phần nhỏ còn lại. Và luôn chụp flame graph trước và sau khi sửa để chứng minh tác động bằng số.`,
  follow: [
    'async-profiler và JFR: khi nào bạn chọn cái nào?',
    'Safepoint bias là gì và vì sao nó làm profiler cổ điển chỉ sai chỗ?',
    'Flame graph có nhiều frame màu vàng (C++ của JVM) — bạn hiểu điều đó thế nào?'
  ],
  tags: ['async-profiler', 'flame graph', 'profiling', 'CPU', 'wall-clock', 'alloc', 'lock'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-021',
  topic: 'concurrency',
  level: 'mid',
  q: 'Một thread Java có những trạng thái nào (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)? Chuyển trạng thái xảy ra khi nào, và khi đọc thread dump bạn suy ra được gì từ trạng thái?',
  a: `**Tóm tắt:** {{Thread.State}} có 6 giá trị: NEW (đã tạo, chưa start), RUNNABLE (đang chạy hoặc sẵn sàng chạy, kể cả khi đang chờ I/O ở tầng OS), BLOCKED (chờ vào monitor của {{synchronized}}), WAITING (chờ không thời hạn: {{wait()}}, {{join()}}, {{LockSupport.park()}}), TIMED_WAITING (chờ có thời hạn: {{sleep}}, {{wait(ms)}}, {{parkNanos}}), TERMINATED (run đã kết thúc). Các điểm interviewer hay vặn: Java không có trạng thái "RUNNING" riêng; thread đang đọc socket vẫn là RUNNABLE; thread chờ {{ReentrantLock}} là WAITING chứ không phải BLOCKED.

### Sơ đồ chuyển trạng thái
~~~text
          start()                      run() kết thúc hoặc ném exception
  NEW  ----------->  RUNNABLE  ------------------------------------>  TERMINATED
                      |    ^
   vào synchronized   |    |  giành được monitor
   mà đang bị giữ     v    |
                     BLOCKED

  RUNNABLE  -- wait() / join() / park() ------------->  WAITING
  RUNNABLE  -- sleep(ms) / wait(ms) / parkNanos() --->  TIMED_WAITING
  WAITING, TIMED_WAITING -- notify, unpark, hết giờ, interrupt -->  RUNNABLE
       (riêng wait(): phải giành lại monitor nên đi qua BLOCKED trước)
~~~

### Từng trạng thái
| State | Vào khi | Ra khi |
|---|---|---|
| NEW | {{new Thread(r)}} | {{start()}} |
| RUNNABLE | Sau start, hoặc hết chờ | OS có thể đang cho chạy hoặc chưa; JVM không phân biệt |
| BLOCKED | Vào khối/method synchronized mà monitor đang bị giữ; hoặc thức dậy sau {{wait()}} và chờ giành lại monitor | Giành được monitor |
| WAITING | {{Object.wait()}}, {{Thread.join()}}, {{LockSupport.park()}} (nền của ReentrantLock, BlockingQueue, Future.get) | notify/notifyAll, thread kia kết thúc, unpark, interrupt |
| TIMED_WAITING | {{Thread.sleep(ms)}}, {{wait(ms)}}, {{join(ms)}}, {{parkNanos}}, {{poll(timeout, unit)}} | Hết giờ, hoặc các lý do như WAITING |
| TERMINATED | run() return hoặc ném exception | Không ra được: gọi start() lần nữa ném {{IllegalThreadStateException}} |

### Đoán output
~~~java
public static void main(String[] args) throws InterruptedException {
    Thread t = new Thread(() -> {
        try { Thread.sleep(500); } catch (InterruptedException e) { }
    });
    System.out.println(t.getState());   // NEW
    t.start();
    Thread.sleep(100);                  // để t kịp vào sleep(500)
    System.out.println(t.getState());   // TIMED_WAITING
    t.join();
    System.out.println(t.getState());   // TERMINATED
}
~~~

### Đọc thread dump
- Nhiều thread **BLOCKED** cùng "waiting to lock <0x...>": tranh chấp một monitor (hoặc deadlock nếu các thread chờ nhau thành vòng).
- Nhiều thread **WAITING (parking)** ở {{HikariPool.getConnection}}: thread HTTP đang chờ connection, pool đã cạn. Còn worker nằm WAITING ở {{LinkedBlockingQueue.take}} là worker rảnh, hoàn toàn bình thường.
- Thread **RUNNABLE** ở {{socketRead}} hoặc {{NioSocketImpl.read}}: đang chờ mạng nhưng vẫn hiện RUNNABLE, đừng kết luận là đang tốn CPU. Muốn biết thread nào đốt CPU, ghép {{top -H}} với nid trong dump (từ JDK 18 nid in ở dạng thập phân, trước đó là hex).
- Chụp 3 dump cách nhau vài giây: thread đứng yên một chỗ qua cả 3 lần mới là nghi phạm.

### Câu trả lời sai phổ biến
- "Có trạng thái RUNNING và READY": đó là trạng thái của OS; Java gộp cả hai thành RUNNABLE.
- "Thread chờ ReentrantLock là BLOCKED": sai, là WAITING (parking), vì Lock dùng {{LockSupport.park}}. BLOCKED chỉ dành cho monitor của synchronized.
- "sleep làm thread BLOCKED": sai, là TIMED_WAITING.

### Virtual thread (Java 21)
{{getState()}} vẫn trả về 6 trạng thái này. Virtual thread chờ I/O hay chờ lock thì được unmount khỏi carrier và nằm ở WAITING/TIMED_WAITING, không chiếm platform thread. Thread dump thường không liệt kê đủ virtual thread; dùng {{jcmd <pid> Thread.dump_to_file -format=json <file>}}.

> Senior tip: khi đọc dump, tôi không đếm trạng thái mà nhóm thread theo **stack trace giống nhau**. 180 thread HTTP cùng đứng ở một dòng {{getConnection}} kể câu chuyện rõ hơn mọi biểu đồ. Và nhớ rằng RUNNABLE trong dump không có nghĩa là đang dùng CPU: CPU phải đo bằng {{top -H}} hoặc profiler.`,
  follow: [
    'Thread vừa được notify() chuyển sang trạng thái nào trước khi chạy tiếp?',
    'Vì sao thread đang đọc socket lại hiện RUNNABLE, và nó có tốn CPU không?'
  ],
  tags: ['thread state', 'thread lifecycle', 'thread dump', 'BLOCKED', 'WAITING']
},
{
  id: 'concurrency-022',
  topic: 'concurrency',
  level: 'mid',
  q: 'Có những cách nào để chạy code trên thread khác: {{Thread}}, {{Runnable}}, {{Callable}}, {{ExecutorService}}, virtual thread? Vì sao gọi {{run()}} thay vì {{start()}} là bug, và trong service thật bạn chọn cách nào?',
  a: `**Tóm tắt:** Thread là "công nhân", còn Runnable và Callable là "việc". Runnable không trả kết quả và không ném được checked exception; Callable trả về giá trị và ném được exception, kết quả lấy qua {{Future}}. Trong code thật hầu như không ai tự {{new Thread()}}: việc được submit vào một {{ExecutorService}} có giới hạn (thread có tên, có giới hạn, có shutdown), hoặc với Java 21 thì dùng virtual thread cho tác vụ I/O. {{start()}} mới tạo thread mới và gọi run() trên thread đó; gọi thẳng {{run()}} chỉ là một lời gọi hàm bình thường trên thread hiện tại. Không có lỗi biên dịch, không có exception, chỉ là âm thầm mất tính song song.

### Các cách
~~~java
// 1. Kế thừa Thread: nên tránh (trộn "việc" với "công nhân", tốn lần extends duy nhất)
class Worker extends Thread { public void run() { work(); } }
new Worker().start();

// 2. Runnable: việc không có kết quả
Thread t = new Thread(() -> work(), "report-1");
t.start();

// 3. Callable + ExecutorService: có kết quả và exception
ExecutorService pool = Executors.newFixedThreadPool(4);  // demo; production dùng ThreadPoolExecutor bounded
Future<Integer> f = pool.submit(() -> countRows());      // Callable<Integer>
Integer rows = f.get(2, TimeUnit.SECONDS);               // exception trong task -> ExecutionException

// 4. Java 21: virtual thread
Thread.ofVirtual().name("vt-", 0).start(() -> callApi());
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    exec.submit(() -> callApi());
}   // close() chờ các task chạy xong
~~~

| Cách | Kết quả | Checked exception | Ai quản lý vòng đời | Dùng khi |
|---|---|---|---|---|
| extends Thread | Không | Không | Tự lo | Gần như không bao giờ |
| Runnable + new Thread | Không | Không | Tự lo | Thread nền đặc biệt, sống suốt đời app |
| Callable + ExecutorService | Future | Có | Pool | Mặc định cho task song song |
| CompletableFuture + executor | Chuỗi bất đồng bộ | Bọc trong CompletionException | Pool | Ghép nhiều lời gọi |
| Virtual thread | Như trên | Như trên | JVM, rất rẻ | Rất nhiều task chờ I/O (Java 21+) |

### start() vs run()
~~~java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()), "worker");
t.run();    // in "main": chạy ngay trên thread gọi, như gọi method thường
t.start();  // in "worker": JVM tạo thread mới rồi gọi run() trên thread đó
t.start();  // ném IllegalThreadStateException: mỗi Thread chỉ start được một lần
~~~
- {{start()}} làm gì: gọi native tạo thread của OS (stack riêng, mặc định reserve khoảng 1 MB trên Linux x64), đăng ký với JVM, chuyển trạng thái NEW sang RUNNABLE, rồi thread mới gọi run(). start() trả về ngay, không chờ.
- Vì sao bug gọi run() nguy hiểm: mọi thứ vẫn "chạy đúng", unit test vẫn pass, chỉ có thời gian xử lý tăng gấp N lần. Lỗi này thường chỉ lộ ra khi load test.

### Vì sao không new Thread() trong service
- Mỗi platform thread tốn bộ nhớ stack và chi phí tạo/huỷ. Spike 5.000 request thành 5.000 thread có thể làm cạn RAM hoặc chạm giới hạn thread của OS ("unable to create native thread").
- Không giới hạn, không tên, không có điểm shutdown; exception rơi vào UncaughtExceptionHandler mặc định, chỉ in ra stderr.
- Trong Spring: dùng {{ThreadPoolTaskExecutor}} hoặc {{@Async}} với executor tự cấu hình, hoặc bật {{spring.threads.virtual.enabled=true}} (Boot 3.2+, Java 21).

### Câu trả lời sai phổ biến
- "Có hai cách tạo thread: extends Thread và implements Runnable": không sai nhưng thiếu. Interviewer Senior chờ nghe ExecutorService, Callable/Future và virtual thread.
- "Callable chạy trên thread mới": Callable chỉ là việc; chạy ở đâu là do executor quyết định.
- "Exception trong task submit() sẽ được log": không, nó nằm im trong Future cho tới khi có người gọi get().

> Senior tip: quy tắc của tôi là mỗi loại việc một executor có tên rõ ràng ({{payment-io-}}, {{report-cpu-}}) để nhìn thread dump là biết pool nào đang nghẽn. Với Java 21 và tác vụ chủ yếu chờ I/O, virtual thread giúp bỏ được phần lớn việc tính kích thước pool; nhưng vẫn phải giới hạn tài nguyên phía sau (connection pool, rate limit của đối tác) bằng Semaphore, vì virtual thread không giới hạn gì cả.`,
  follow: [
    'execute() và submit() khác nhau thế nào khi task ném exception?',
    'Khi nào virtual thread không giúp được gì, thậm chí làm tệ hơn?'
  ],
  tags: ['Thread', 'Runnable', 'Callable', 'ExecutorService', 'virtual thread', 'start vs run']
},
{
  id: 'concurrency-023',
  topic: 'concurrency',
  level: 'mid',
  q: 'So sánh {{Thread.sleep}}, {{Object.wait}}, {{Thread.join}} và {{Thread.yield}}: cái nào nhả lock, cái nào phải gọi trong {{synchronized}}, và dùng sai thì gây bug gì?',
  a: `**Tóm tắt:** Chỉ {{wait()}} nhả monitor, và chỉ nhả monitor của chính object được gọi wait. Vì thế nó bắt buộc phải gọi khi đang giữ monitor đó, nếu không sẽ ném {{IllegalMonitorStateException}}. {{sleep()}} giữ nguyên mọi lock, chỉ tạm dừng thread hiện tại. {{join()}} chờ một thread khác kết thúc; với platform thread nó được cài đặt bằng {{wait()}} trên chính object Thread, nên chỉ "nhả" monitor của object Thread đó, mọi lock khác vẫn giữ. {{yield()}} chỉ là gợi ý cho scheduler: không nhả lock, không đảm bảo gì.

| | Thuộc | Nhả lock? | Phải giữ monitor? | Thức dậy khi | Trạng thái |
|---|---|---|---|---|---|
| sleep(ms) | static của Thread | Không | Không | Hết giờ, interrupt | TIMED_WAITING |
| wait() | Object | Nhả monitor của object đó | Bắt buộc | notify/notifyAll, interrupt, hết giờ, spurious | WAITING / TIMED_WAITING |
| join() | Thread instance | Không (trừ monitor của chính object Thread) | Không | Thread kia kết thúc, interrupt, hết giờ | WAITING / TIMED_WAITING |
| yield() | static của Thread | Không | Không | Gần như ngay lập tức | RUNNABLE |

### Vì sao wait() phải nằm trong synchronized
wait() dùng để chờ một **điều kiện trên trạng thái dùng chung**. Việc kiểm tra điều kiện và đi ngủ phải là một thao tác nguyên tử. Nếu không giữ lock, producer có thể thêm phần tử và gọi notify **giữa** lúc consumer vừa kiểm tra "queue rỗng" và lúc consumer gọi wait. Tín hiệu bị mất và consumer ngủ mãi (lost wakeup). JVM buộc bạn giữ monitor để không còn khe hở này, và wait() nhả monitor để producer vào được mà thay đổi trạng thái.

### Bug kinh điển: sleep trong synchronized
~~~java
synchronized (account) {
    account.debit(amount);
    Thread.sleep(2000);      // "chờ core banking cập nhật": giữ lock suốt 2 giây!
    account.audit();
}
// Mọi thread khác cần account đều BLOCKED 2 giây:
// tài khoản đó chỉ xử lý được khoảng 0,5 giao dịch mỗi giây
~~~
Gọi HTTP hay DB trong lúc giữ lock cũng gây hậu quả tương tự. Quy tắc: không làm việc blocking bên trong vùng khoá.

### join
~~~java
Thread t1 = new Thread(() -> loadCustomers());
Thread t2 = new Thread(() -> loadAccounts());
t1.start(); t2.start();
t1.join();                   // main chờ t1 kết thúc
t2.join(5_000);              // chờ tối đa 5 giây; hết giờ KHÔNG ném exception
if (t2.isAlive()) log.warn("loadAccounts quá hạn");   // phải tự kiểm tra
~~~
- Khi thread kết thúc, JVM gọi {{notifyAll()}} trên object Thread để đánh thức các thread đang join. Vì thế javadoc khuyên không dùng wait/notify trên instance Thread.
- Code mới nên dùng {{Future.get(timeout, unit)}}, {{CompletableFuture.allOf}} hoặc {{CountDownLatch}} thay cho join.

### yield
Chỉ là gợi ý "tôi sẵn sàng nhường CPU"; scheduler có thể bỏ qua. Không dùng nó để đồng bộ hay để ép test chạy "đúng thứ tự". Với vòng lặp spin trong code low-level, API phù hợp là {{Thread.onSpinWait()}} (Java 9+).

### Đoán kết quả
~~~java
Object lock = new Object();
synchronized (lock) {
    lock.notify();           // không ai đang chờ: notify bị bỏ qua, không lỗi
}
lock.wait();                 // ném IllegalMonitorStateException: không giữ monitor của lock
~~~

### Câu trả lời sai phổ biến
- "sleep nhả lock để thread khác chạy": sai, sleep giữ mọi lock.
- "wait nhả mọi lock thread đang giữ": sai, chỉ nhả monitor của object được gọi wait. Đang giữ lock A mà gọi {{b.wait()}} thì vẫn giữ A, và đó là một nguồn deadlock.
- "notify() làm thread được đánh thức chạy ngay": không, thread đó phải giành lại monitor (BLOCKED) sau khi bên notify ra khỏi synchronized.

> Senior tip: khi review, tôi coi {{Thread.sleep}} trong code production (trừ backoff có giới hạn khi retry) là dấu hiệu thiết kế cần xem lại. Chờ một điều kiện thì dùng cơ chế có tín hiệu (latch, future, queue); chờ theo thời gian thì dùng ScheduledExecutorService. Trong test, thay sleep bằng Awaitility để test vừa nhanh vừa không flaky.`,
  follow: [
    'Lost wakeup là gì và vì sao giữ monitor khi gọi wait() ngăn được nó?',
    'Thread.onSpinWait() khác yield() thế nào?'
  ],
  tags: ['sleep', 'wait', 'join', 'yield', 'monitor']
},
{
  id: 'concurrency-024',
  topic: 'concurrency',
  level: 'senior',
  q: '{{synchronized}} trên static method, instance method và block khác nhau thế nào (class lock vs object lock)? Hai thread cùng lúc gọi một static synchronized method và một instance synchronized method của cùng class thì có chặn nhau không?',
  a: `**Tóm tắt:** synchronized luôn khoá **một object cụ thể**. Instance method khoá {{this}}; static method khoá object {{Class}} ({{Foo.class}}); block khoá object bạn chỉ định. Lock khác nhau thì không chặn nhau: static synchronized và instance synchronized của cùng class chạy song song được. Đây thường chính là bug khi cả hai cùng sửa một field static. Tương tự, hai instance khác nhau gọi instance synchronized cũng không chặn nhau.

### Ma trận chặn nhau
| Thread A gọi | Thread B gọi | Chặn nhau? |
|---|---|---|
| a1.syncMethod() | a1.otherSyncMethod() | Có, cùng lock a1 |
| a1.syncMethod() | a2.syncMethod() | Không, hai object khác nhau |
| Foo.staticSync() | Foo.otherStaticSync() | Có, cùng lock Foo.class |
| Foo.staticSync() | a1.syncMethod() | Không, Foo.class và a1 là hai object khác nhau |
| a1.syncMethod() | a1.plainMethod() | Không, method không synchronized không cần lock |

### Bug thường gặp: sai phạm vi lock
~~~java
class SequenceService {
    private static long next = 0;            // dữ liệu static, dùng chung mọi instance

    public synchronized long nextId() {      // khoá THIS, không phải class
        return ++next;
    }
}
// Là Spring singleton (1 instance) thì tạm ổn.
// Nhưng ở đâu đó có new SequenceService() -> 2 lock khác nhau -> sinh trùng id.
~~~
Sửa: khoá đúng object bảo vệ dữ liệu, tức {{static synchronized}} hoặc {{synchronized (SequenceService.class)}}; tốt hơn nữa là dùng {{AtomicLong}}.

Quy tắc: **lock phải có cùng phạm vi với dữ liệu nó bảo vệ**. Dữ liệu instance thì lock instance, dữ liệu static thì lock static.

### Block synchronized và chọn lock object
~~~java
class AccountService {
    private final Object lock = new Object();   // lock riêng, private final

    public void transfer(long from, long to, long amount) {
        validate(from, to, amount);             // ngoài vùng khoá
        synchronized (lock) {                   // chỉ khoá đoạn thật sự cần
            debit(from, amount);
            credit(to, amount);
        }
        notifyCustomer(from);                   // I/O để ngoài vùng khoá
    }
}
~~~
- Lock private final giúp code bên ngoài (hay thư viện) không thể synchronized trên object của bạn và gây deadlock khó hiểu.
- Không khoá trên: String literal (được intern, dùng chung toàn JVM); {{Integer}}/{{Long}} giá trị nhỏ (được cache, dùng chung); field không final (gán lại là đổi lock); {{getClass()}} (lớp con có Class khác). Từ JDK 16, javac cảnh báo khi synchronized trên instance của value-based class như Integer.

### Bên trong JVM
- Method synchronized được đánh dấu cờ {{ACC_SYNCHRONIZED}} trong bytecode; block dùng cặp lệnh {{monitorenter}}/{{monitorexit}}, kèm một monitorexit trong nhánh exception để lock luôn được nhả.
- Reentrant: thread đang giữ lock có thể gọi tiếp một method synchronized khác trên cùng object mà không tự chặn mình.
- Biased locking bị tắt mặc định từ JDK 15 và bị gỡ bỏ ở JDK 18. JDK 21 dùng lock nhẹ khi không tranh chấp và chỉ inflate thành monitor đầy đủ khi có tranh chấp.

### Câu trả lời sai phổ biến
- "static synchronized và synchronized instance dùng chung một lock": sai, đó là hai object khác nhau.
- "synchronized method khoá cả object, nên mọi method của object đều bị chặn": chỉ các method/block synchronized trên cùng object mới chờ nhau.
- "synchronized trong service là đủ": nó chỉ có tác dụng trong **một JVM**. Service chạy 3 pod là 3 lock độc lập; khi đó phải khoá ở DB hoặc dùng thao tác nguyên tử ở kho dữ liệu.

> Senior tip: khi thấy synchronized trên method public của một Spring bean, tôi hỏi hai câu: dữ liệu được bảo vệ nằm ở đâu, và service chạy mấy instance? Nếu dữ liệu ở DB thì lock trong JVM vô nghĩa khi có nhiều pod; nếu dữ liệu là field static thì khoá this là sai phạm vi. Hai câu đó bắt được phần lớn bug đồng bộ trong code nghiệp vụ.`,
  follow: [
    'Vì sao không nên synchronized trên String literal hoặc Integer?',
    'synchronized có reentrant không, và điều đó quan trọng khi nào?'
  ],
  tags: ['synchronized', 'class lock', 'object lock', 'monitor'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-025',
  topic: 'concurrency',
  level: 'lead',
  q: '{{count++}} chạy từ nhiều thread cho kết quả sai: vì sao? Nêu các cách sửa trong một JVM, và khi service chạy nhiều instance (trừ tồn kho, đếm lượt dùng voucher) thì bạn làm thế nào với DB hoặc Redis?',
  a: `**Tóm tắt:** {{count++}} gồm ba bước đọc, cộng, ghi và không nguyên tử. Hai thread cùng đọc một giá trị cũ thì một lần cộng bị mất (lost update). {{volatile}} không sửa được vì nó chỉ đảm bảo visibility. Trong một JVM có thể dùng {{synchronized}}/Lock, {{AtomicInteger.incrementAndGet()}} (CAS), hoặc {{LongAdder}} khi ghi nhiều đọc ít. Khi chạy nhiều instance thì mọi lock trong JVM đều vô dụng: phải đưa phép kiểm tra và cập nhật về chính nơi lưu dữ liệu, như một câu {{UPDATE}} có điều kiện trong DB, optimistic locking bằng version, {{SELECT ... FOR UPDATE}}, hoặc {{DECR}}/Lua script trên Redis.

### Vì sao sai
~~~text
count = 5
Thread A: đọc 5            Thread B: đọc 5
Thread A: 5 + 1 = 6        Thread B: 5 + 1 = 6
Thread A: ghi 6            Thread B: ghi 6      -> mất một lần tăng
~~~
Với một field, bytecode là {{getfield}}, {{iconst_1}}, {{iadd}}, {{putfield}}; giữa các lệnh này thread khác có thể chen vào.

~~~java
static int count = 0;
public static void main(String[] args) throws InterruptedException {
    Runnable r = () -> { for (int i = 0; i < 100_000; i++) count++; };
    Thread a = new Thread(r), b = new Thread(r);
    a.start(); b.start(); a.join(); b.join();
    System.out.println(count);   // thường nhỏ hơn 200000, mỗi lần chạy một khác
}
~~~

### Sửa trong một JVM
| Cách | Cơ chế | Khi dùng |
|---|---|---|
| synchronized / ReentrantLock | Loại trừ lẫn nhau | Cập nhật nhiều biến cùng lúc, cần giữ ràng buộc giữa chúng |
| AtomicInteger / AtomicLong | CAS, thử lại khi xung đột | Một biến, cần giá trị chính xác ngay (sinh số thứ tự) |
| LongAdder | Mỗi thread cộng vào một cell riêng, sum() khi đọc | Counter metric ghi rất nhiều, đọc ít |
| Không chia sẻ | Mỗi thread đếm riêng rồi gộp | Xử lý batch song song |

Bẫy check-then-act: {{if (stock.get() > 0) stock.decrementAndGet()}} vẫn sai dù dùng Atomic, vì hai thread cùng thấy 1 rồi cùng trừ. Phải gộp kiểm tra và cập nhật thành một thao tác nguyên tử:
~~~java
boolean tryReserve(AtomicInteger stock) {
    while (true) {
        int cur = stock.get();
        if (cur <= 0) return false;                          // hết hàng
        if (stock.compareAndSet(cur, cur - 1)) return true;  // chỉ thành công nếu chưa ai đổi
    }
}
~~~

### Nhiều instance: đưa tính nguyên tử về kho dữ liệu
**1. UPDATE có điều kiện**, đơn giản và nhanh nhất:
~~~sql
UPDATE voucher
SET used = used + 1
WHERE code = 'TET2026' AND used < max_uses;
-- affected rows = 1: dùng thành công; = 0: đã hết lượt
~~~
DB khoá dòng trong lúc UPDATE. Ở READ COMMITTED (mặc định của PostgreSQL) và với InnoDB của MySQL, điều kiện WHERE được kiểm tra lại trên phiên bản mới nhất của dòng, nên không thể vượt max_uses. Ở REPEATABLE READ của PostgreSQL, transaction đến sau sẽ nhận lỗi serialization và phải retry.

**2. Optimistic locking**: {{@Version}} của JPA sinh câu {{UPDATE ... WHERE id = ? AND version = ?}}; xung đột thì ném {{OptimisticLockException}} và retry vài lần. Hợp khi xung đột hiếm; với flash sale, hàng nghìn request tranh một dòng sẽ retry dồn dập.

**3. Pessimistic lock**: {{SELECT ... FOR UPDATE}} trong transaction (JPA {{PESSIMISTIC_WRITE}}) khi cần đọc, tính toán phức tạp rồi mới ghi. Giữ transaction thật ngắn.

**4. Redis**, khi lượng ghi vượt sức DB:
- {{INCR}}/{{DECR}} nguyên tử vì Redis thực thi lệnh tuần tự.
- Kiểm tra cộng với trừ phải nằm trong một Lua script (cũng chạy nguyên tử). Đừng {{GET}} rồi {{DECR}} từ app, đó lại là check-then-act.
~~~text
-- KEYS[1] = stock:sku123
local s = tonumber(redis.call('GET', KEYS[1]) or '0')
if s > 0 then redis.call('DECR', KEYS[1]) return 1 end
return 0
~~~
- Redis chỉ là bộ đếm giữ chỗ; đơn hàng thật vẫn ghi vào DB (qua queue), và cần job đối soát vì Redis có thể mất dữ liệu khi failover.

**5. Distributed lock** (Redisson; ShedLock cho job định kỳ): chỉ dùng khi không diễn đạt được thành một thao tác nguyên tử. Lock có TTL có thể hết hạn trong lúc GC pause dài, nên vẫn cần fencing token hoặc điều kiện trong câu ghi DB.

### Câu trả lời sai phổ biến
- "Thêm volatile là xong": volatile không làm count++ nguyên tử.
- "Dùng synchronized trong service": chạy 3 pod là 3 lock độc lập.
- "Đọc tồn kho lên, kiểm tra trong Java, rồi UPDATE qty bằng giá trị mới": lost update giữa các instance.

> Senior tip: với bài toán trừ tồn kho hay voucher, tôi luôn bắt đầu bằng UPDATE có điều kiện và kiểm tra affected rows: một câu SQL, không cần lock phân tán, đúng tuyệt đối. Chỉ khi đo thấy một dòng "nóng" làm DB nghẽn (hàng nghìn request mỗi giây vào cùng một SKU) mới chuyển phần giữ chỗ lên Redis Lua, kèm job đối soát với DB.`,
  follow: [
    'Vì sao check-then-act vẫn sai kể cả khi dùng AtomicInteger?',
    'Optimistic locking và UPDATE có điều kiện: chọn cái nào cho flash sale?',
    'Distributed lock có TTL hết hạn giữa chừng vì GC pause — bạn phòng thế nào?'
  ],
  tags: ['race condition', 'AtomicInteger', 'LongAdder', 'optimistic locking', 'Redis', 'lost update'],
  refs: [
    { type: 'doc', title: 'AtomicInteger API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html' },
    { type: 'doc', title: 'LongAdder API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html' },
  ],
},
{
  id: 'concurrency-026',
  topic: 'concurrency',
  level: 'senior',
  q: 'Livelock và starvation khác deadlock thế nào? Cho ví dụ thực tế, cách phát hiện, và khi nào bạn dùng fair lock ({{new ReentrantLock(true)}}) — nó tốn gì?',
  a: `**Tóm tắt:** Deadlock: các thread **đứng im** chờ nhau mãi mãi, CPU gần như bằng 0. Livelock: các thread **vẫn chạy**, liên tục phản ứng với nhau (nhả ra rồi thử lại) nhưng không ai tiến được; CPU cao mà throughput bằng 0. Starvation: hệ thống vẫn tiến, nhưng **một số** thread mãi không được phục vụ vì luôn bị chen. Fair lock trao lock theo thứ tự chờ (FIFO) nên chống được starvation, nhưng throughput giảm đáng kể vì mất khả năng "chen ngang" và mỗi lần trao lock đều phải đánh thức một thread đang ngủ. Chỉ dùng khi đã đo thấy starvation thật.

| | Deadlock | Livelock | Starvation |
|---|---|---|---|
| Thread đang | BLOCKED/WAITING mãi | RUNNABLE, lặp đi lặp lại | Một số chờ rất lâu, số khác chạy bình thường |
| CPU | Thấp | Cao | Bình thường |
| Hệ thống tiến? | Không (với các thread liên quan) | Không | Có, nhưng không công bằng |
| Thread dump | JVM báo "Found one Java-level deadlock" | Stack đổi giữa các lần chụp nhưng quanh quẩn một vòng retry | Một thread chờ cùng một lock qua nhiều dump, thread khác vẫn lấy được |
| Cách sửa | Thứ tự lock cố định, tryLock có timeout | Backoff ngẫu nhiên, phân vai rõ ràng | Fair lock, giới hạn, tách hàng đợi |

### Livelock: ví dụ
~~~java
// Hai thread chuyển tiền ngược chiều, "lịch sự" nhả lock khi không lấy được lock thứ hai
while (true) {
    if (from.lock.tryLock()) {
        try {
            if (to.lock.tryLock()) {
                try { move(from, to, amt); return; }
                finally { to.lock.unlock(); }
            }
        } finally { from.lock.unlock(); }
    }
    // Không có backoff: hai thread có thể cứ lệch pha mãi, cùng lấy, cùng nhả, cùng thử lại
}
~~~
Sửa: thêm backoff ngẫu nhiên ({{Thread.sleep(ThreadLocalRandom.current().nextInt(1, 10))}}) để hai bên lệch nhịp và một bên lấy được cả hai lock; hoặc tốt hơn là luôn khoá theo thứ tự id cố định.

Trong hệ phân tán livelock còn phổ biến hơn: hai consumer cùng retry ngay một message bị xung đột optimistic lock; hàng nghìn client cùng retry sau timeout (retry storm) khiến hệ thống bận xử lý retry thay vì việc thật. Sửa bằng exponential backoff kèm jitter.

### Starvation
- {{ReentrantLock()}} mặc định **non-fair**: thread vừa tới có thể chen ngang lấy lock ngay khi lock vừa được nhả, trước cả thread đã xếp hàng, vì thread đang chạy sẵn trên CPU nhanh hơn nhiều so với đánh thức một thread đang ngủ. Throughput cao, nhưng về lý thuyết một thread có thể thua mãi.
- {{synchronized}} không có tuỳ chọn fair.
- ReadWriteLock: dòng reader liên tục có thể khiến writer chờ rất lâu. {{ReentrantReadWriteLock}} ở chế độ non-fair có cơ chế giảm việc này (reader mới phải nhường khi writer đứng đầu hàng đợi) nhưng không đảm bảo tuyệt đối.
- Thread priority ({{setPriority}}) gần như bị bỏ qua trên Linux, đừng dựa vào nó.
- Ngoài lock: thread pool bị các task dài chiếm hết khiến task ngắn chờ mãi; một tenant gửi lượng request lớn chiếm hết pool của các tenant khác. Cách sửa là tách pool (bulkhead) và giới hạn theo tenant.

### Fair lock
~~~java
ReentrantLock fair = new ReentrantLock(true);   // trao lock theo thứ tự hàng đợi
Semaphore permits = new Semaphore(10, true);     // semaphore fair
~~~
- Cái giá: mỗi lần nhả lock phải đánh thức đúng thread đầu hàng và chờ nó được lập lịch. Javadoc ghi rõ throughput tổng thể thường thấp hơn, có thể thấp hơn nhiều khi tranh chấp cao.
- Fairness chỉ áp dụng cho thứ tự lấy lock, không đảm bảo công bằng lập lịch CPU. {{tryLock()}} không timeout vẫn chen ngang kể cả với lock fair.
- Dùng khi thứ tự phục vụ có ý nghĩa nghiệp vụ, hoặc tail latency quan trọng hơn throughput, và số liệu đã cho thấy starvation.

### Câu trả lời sai phổ biến
- "Livelock là deadlock nhẹ": ngược lại, livelock đốt CPU và khó nhận ra hơn vì mọi thread trông như đang làm việc.
- "Cứ dùng fair lock cho an toàn": trả giá bằng throughput mà không giải quyết gốc rễ (giữ lock quá lâu).

> Senior tip: livelock tôi gặp nhiều nhất không nằm trong code Java mà ở chính sách retry: client timeout 1 giây và retry ngay 3 lần, service vốn đang chậm vì quá tải lại càng quá tải hơn. Exponential backoff có jitter và circuit breaker chính là "fair lock" của hệ phân tán. Còn starvation trong JVM thường lộ ra qua p99.9 của một nhóm request tăng vọt; lúc đó tôi thử giảm thời gian giữ lock trước, fair lock là lựa chọn sau cùng.`,
  follow: [
    'Vì sao lock non-fair lại cho throughput cao hơn fair lock?',
    'Retry storm có phải livelock không? Bạn thiết kế retry thế nào để tránh?'
  ],
  tags: ['livelock', 'starvation', 'fair lock', 'ReentrantLock', 'deadlock'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'concurrency-027',
  topic: 'concurrency',
  level: 'senior',
  q: 'Viết singleton thread-safe theo các cách eager, lazy holder và enum, rồi so sánh. Singleton có thể bị phá bằng reflection, serialization, clone hoặc nhiều class loader như thế nào, và cách nào chống được?',
  a: `**Tóm tắt:** Có ba cách đáng dùng: **eager** (field {{static final}} khởi tạo khi class được khởi tạo), **holder idiom** (lazy nhờ class lồng chỉ được khởi tạo khi truy cập lần đầu) và **enum** (JVM đảm bảo đúng một instance, chống reflection và serialization mà không phải làm gì thêm). Cả ba đều thread-safe nhờ JVM khoá trong lúc khởi tạo class (JLS 12.4.2), không cần volatile hay synchronized. Singleton bị phá bằng: reflection gọi constructor private, deserialization tạo object mới, {{clone()}} nếu class là Cloneable, và việc mỗi class loader có một bản class riêng. Enum chặn được reflection và serialization; còn class loader thì không có cách nào chặn trong code.

### Ba cách
~~~java
// 1. Eager: đơn giản nhất
public final class FeeTable {
    private static final FeeTable INSTANCE = new FeeTable();
    private FeeTable() { }
    public static FeeTable get() { return INSTANCE; }
}

// 2. Holder: chỉ tạo khi get() được gọi lần đầu
public final class CoreBankClient {
    private CoreBankClient() { }
    private static class Holder { static final CoreBankClient I = new CoreBankClient(); }
    public static CoreBankClient get() { return Holder.I; }
}

// 3. Enum
public enum IdGenerator {
    INSTANCE;
    private final AtomicLong seq = new AtomicLong();
    public long next() { return seq.incrementAndGet(); }
}
~~~

| | Lazy? | Thread-safe nhờ | Chống reflection | Chống serialization | Ghi chú |
|---|---|---|---|---|---|
| Eager | Theo lúc class được khởi tạo | Khoá khởi tạo class | Không (phải tự kiểm tra) | Cần readResolve | Đủ dùng trong đa số trường hợp |
| Holder | Có | Khoá khởi tạo class Holder | Không (phải tự kiểm tra) | Cần readResolve | Lazy mà không tốn synchronized |
| DCL + volatile | Có | volatile + synchronized | Không | Cần readResolve | Dài dòng, dễ viết sai |
| Enum | Theo lúc class được khởi tạo | Đặc tả enum | Có | Có | Không kế thừa được class khác |

"Eager" thực ra cũng lazy ở mức class: class chỉ được khởi tạo khi có truy cập đầu tiên (gọi get(), đọc một static field không phải hằng số). Nó chỉ thật sự "sớm" khi class có static method khác được gọi trước.

### Vì sao thread-safe mà không cần lock
JVM đảm bảo phần khởi tạo static của một class chạy **đúng một lần**; thread khác muốn dùng class phải chờ khởi tạo xong, và kết quả khởi tạo được publish an toàn cho mọi thread. Holder tận dụng việc class lồng {{Holder}} chỉ được khởi tạo khi {{Holder.I}} được đọc lần đầu.

Pitfall: nếu constructor ném exception, class rơi vào trạng thái lỗi. Lần đầu bạn thấy {{ExceptionInInitializerError}}, các lần sau là {{NoClassDefFoundError}}, và không tự thử lại được cho tới khi restart. Đừng gọi mạng hay DB trong constructor của singleton.

### Phá và chống
**Reflection**
~~~java
Constructor<FeeTable> c = FeeTable.class.getDeclaredConstructor();
c.setAccessible(true);
FeeTable other = c.newInstance();      // instance thứ hai
~~~
- Chống (một phần): trong constructor, nếu {{INSTANCE != null}} thì ném {{IllegalStateException}}.
- Enum: mọi cách tạo instance enum bằng reflection đều bị chặn, {{newInstance}} ném {{IllegalArgumentException}} ("Cannot reflectively create enum objects").
- Nếu class nằm trong một named module không mở package, {{setAccessible(true)}} ném {{InaccessibleObjectException}}.

**Serialization**
~~~java
public final class FeeTable implements Serializable {
    // ...
    private Object readResolve() { return INSTANCE; }  // thay object vừa deserialize bằng instance thật
}
~~~
Thiếu {{readResolve}} thì mỗi lần deserialize lại tạo một object mới. Enum được serialize theo tên và luôn trả về hằng có sẵn.

**Clone**: chỉ là vấn đề khi class (hoặc lớp cha) implements Cloneable. Đừng implement, hoặc override {{clone()}} để ném {{CloneNotSupportedException}}.

**Nhiều class loader**: "singleton" thực chất là một instance cho mỗi cặp (class, class loader). App server chạy nhiều webapp, hệ thống plugin, hoặc restart class loader của Spring Boot DevTools đều tạo ra nhiều bản. Không chặn được trong code; phải đặt class ở loader dùng chung hoặc bỏ singleton tĩnh.

### Trong ứng dụng Spring
Bean scope singleton nghĩa là "một instance cho mỗi ApplicationContext", do container quản lý: test được (mock, thay bean), không có trạng thái static toàn cục. Singleton tĩnh tự viết chỉ nên dành cho thứ thật sự không phụ thuộc container (bảng hằng số, utility).

> Senior tip: trong phỏng vấn, tôi trả lời gọn: "enum nếu cần chống reflection và serialization, holder nếu cần lazy, còn trong Spring thì không tự viết singleton". Interviewer thường vặn tiếp chuyện ExceptionInInitializerError; biết rằng class khởi tạo lỗi là "hỏng vĩnh viễn" tới khi restart cho thấy bạn đã thật sự debug chuyện này trên production.`,
  follow: [
    'Vì sao enum singleton không bị phá bằng reflection?',
    'Constructor của singleton ném exception thì những lần gọi sau chuyện gì xảy ra?',
    'Spring singleton bean khác singleton pattern thế nào?'
  ],
  tags: ['singleton', 'holder idiom', 'enum', 'reflection', 'serialization', 'class loader'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-019',
  topic: 'jvm',
  level: 'mid',
  q: 'JDK, JRE và JVM khác nhau thế nào? Mô tả đường đi từ file {{.java}} tới lúc code chạy ở tốc độ native: javac, bytecode, class loading, verify, interpreter, JIT.',
  a: `**Tóm tắt:** JVM là máy ảo thực thi bytecode (HotSpot là bản cài đặt phổ biến nhất). JRE = JVM + thư viện chuẩn, đủ để chạy chương trình. JDK = JRE + công cụ phát triển ({{javac}}, {{jar}}, {{jlink}}, {{jcmd}}, {{jfr}}...). Từ Java 11, Oracle không còn phát hành JRE riêng (một số vendor như Eclipse Temurin vẫn có gói JRE); thường ta dùng JDK hoặc tạo runtime tối giản bằng {{jlink}}. Đường đi: {{javac}} biên dịch .java thành bytecode (.class) độc lập nền tảng → class loader nạp, verify, link và khởi tạo class khi cần → interpreter chạy bytecode → method nóng được JIT (C1 rồi C2) biên dịch thành mã máy để thay thế.

### Ba khái niệm
| | Gồm | Dùng để |
|---|---|---|
| JVM | Class loader, execution engine (interpreter + JIT), GC, các vùng nhớ runtime | Chạy bytecode |
| JRE | JVM + thư viện chuẩn (java.base, java.sql...) | Chạy ứng dụng |
| JDK | JRE + javac, jar, javadoc, jlink, jcmd, jstack, jfr... | Phát triển, đóng gói, chẩn đoán |

"Java" là đặc tả (JLS cho ngôn ngữ, JVMS cho máy ảo). HotSpot và OpenJ9 là các bản cài đặt JVM; Temurin, Corretto, Zulu là các bản phân phối OpenJDK.

### Đường đi
~~~text
Fee.java --javac--> Fee.class (bytecode + constant pool)
   |
   v   lần đầu code cần tới class Fee
Loading        : class loader tìm và đọc bytes (ủy quyền: app -> platform -> boot)
Linking        : verify (bytecode hợp lệ, an toàn kiểu)
                 -> prepare (cấp vùng cho static, gán giá trị mặc định)
                 -> resolve (đổi tham chiếu dạng tên sang tham chiếu thật, thường lazy)
Initialization : chạy static initializer, đúng một lần
   |
   v
Interpreter chạy bytecode, đếm số lần gọi method và số vòng lặp
   |   method nóng
   v
C1 (biên dịch nhanh, kèm profiling) -> C2 (tối ưu mạnh dựa trên profile: inline, escape analysis)
   |   giả định bị sai (load class mới, nhánh "không bao giờ chạy" lại chạy)
   v
Deoptimization: quay về interpreter, sau đó biên dịch lại
~~~

### Vì sao thiết kế hai tầng
- Bytecode cho phép "write once, run anywhere": cùng file .class chạy trên Linux x64 lẫn ARM Graviton.
- Interpreter khởi động ngay, không phải biên dịch cả chương trình; JIT chỉ tốn công cho phần nhỏ code thật sự nóng.
- JIT biết **dữ liệu thật lúc chạy** (kiểu nào thực sự được truyền vào, nhánh nào hay chạy), nên trong nhiều trường hợp tối ưu mạnh hơn biên dịch tĩnh. Ví dụ: inline một lời gọi interface mà thực tế chỉ có một implementation.
- Cái giá là warm-up: vài phút đầu sau deploy latency cao hơn bình thường.

### javac làm ít hơn bạn nghĩ
javac gần như không tối ưu: chỉ gộp hằng số compile-time và bỏ những nhánh như {{if (false)}}. Generic bị erase; lambda được dịch thành {{invokedynamic}}; nối chuỗi từ Java 9 cũng dùng {{invokedynamic}} ({{StringConcatFactory}}). Tối ưu thật nằm ở JIT. Xem bytecode bằng {{javap -c -p Fee.class}}.

### Quan sát quá trình
~~~bash
java -Xlog:class+load=info -jar app.jar      # class nào được load, từ đâu
java -XX:+PrintCompilation -jar app.jar      # method nào được JIT, ở tier nào
jcmd <pid> Compiler.codecache                # dung lượng code cache đang dùng
~~~

### Câu trả lời sai phổ biến
- "Java là ngôn ngữ thông dịch": thực tế là kết hợp, thông dịch trước rồi JIT biên dịch phần nóng.
- "JIT biên dịch toàn bộ chương trình lúc khởi động": chỉ method vượt ngưỡng mới được biên dịch.
- "Mọi class được load hết lúc khởi động": class được load lazy, lúc lần đầu cần tới.
- "Server cần cài JRE": image hiện đại dùng JDK hoặc runtime tạo bằng jlink.

> Senior tip: hiểu đường đi này giải thích được nhiều hiện tượng trên production: p99 cao sau mỗi lần deploy (JIT chưa warm, nên warm-up trước khi nhận traffic); {{NoClassDefFoundError}} chỉ xuất hiện khi chạy vào nhánh hiếm (class được load lazy); và vì sao image dựng bằng {{jlink}} với đúng các module cần dùng nhỏ hơn đáng kể so với full JDK.`,
  follow: [
    'Deoptimization xảy ra khi nào và ảnh hưởng tới latency ra sao?',
    'ClassNotFoundException và NoClassDefFoundError khác nhau thế nào?',
    'jlink giúp gì khi đóng gói Docker image?'
  ],
  tags: ['JDK', 'JRE', 'JVM', 'bytecode', 'class loading', 'JIT']
},
{
  id: 'jvm-020',
  topic: 'jvm',
  level: 'senior',
  q: 'GC xác định một object là "rác" như thế nào? GC roots gồm những gì, vì sao JVM không dùng reference counting, và vì sao Java có GC mà vẫn bị memory leak?',
  a: `**Tóm tắt:** HotSpot dùng **reachability analysis** (tracing): bắt đầu từ tập GC roots, đi theo mọi reference strong để đánh dấu object còn sống. Object không đến được từ root nào là rác, kể cả khi các object đó vẫn trỏ lẫn nhau. GC roots gồm: biến local và tham số trong các frame của thread đang sống, static field của class đã load (thông qua class loader), JNI reference, monitor đang bị giữ, và các reference nội bộ của JVM. JVM không dùng reference counting vì nó không thu được vòng tham chiếu (A trỏ B, B trỏ A) và tốn chi phí cập nhật bộ đếm ở mỗi lần gán (lại phải atomic khi đa luồng). Leak trong Java nghĩa là object **vẫn reachable** nhưng không còn được dùng: GC không thể biết ý định của bạn.

### Reachability
~~~text
GC roots
 +-- stack của thread "http-nio-8080-exec-3": biến local order -> Order -> List<Item>
 +-- static field CustomerCache.MAP -> HashMap -> ... -> Customer      (còn sống)
 +-- ...

 Session A <--> Session B    (trỏ nhau nhưng không root nào tới được) => rác, bị thu
~~~
- Khái quát các bước: **mark** từ root, sau đó **sweep / compact / copy** tuỳ collector. Young GC chỉ quét young gen, nhưng phải coi các reference từ old gen sang young gen là root bổ sung. Những reference này được theo dõi bằng card table / remembered set, cập nhật qua write barrier.
- Collector chạy concurrent (marking của G1, ZGC) đánh dấu trong lúc ứng dụng vẫn chạy, nên cần barrier để không bỏ sót object vừa bị gán lại (SATB ở G1, load barrier ở ZGC).

### GC roots cụ thể
| Root | Ví dụ thường gặp trong leak |
|---|---|
| Biến local, tham số trên stack của thread đang sống | Worker giữ một list lớn trong vòng lặp vô hạn |
| Static field | static Map làm cache không giới hạn |
| Thread đang sống (kèm ThreadLocalMap của nó) | ThreadLocal không remove trong thread pool |
| Class loader và các class đã load | Class loader cũ còn bị giữ sau redeploy |
| JNI global reference | Thư viện native giữ object |
| Monitor đang bị giữ | Hiếm gặp |

### Vì sao không dùng reference counting
1. **Vòng tham chiếu**: Order và Customer trỏ lẫn nhau thì bộ đếm không bao giờ về 0, thành leak. CPython phải bổ sung một bộ thu vòng riêng vì lý do này.
2. **Chi phí trên mỗi lần gán**: phải tăng/giảm bộ đếm ở mọi phép gán và truyền tham số; đa luồng thì phải dùng atomic, vừa chậm vừa tranh chấp cache line.
3. **Giải phóng dây chuyền**: khi reference cuối cùng tới một cấu trúc lớn biến mất, hàng triệu object bị giải phóng ngay trên thread đang chạy, gây pause không kiểm soát được.

Tracing thì ngược lại: chi phí tỷ lệ với số object **còn sống** (với collector kiểu copy). Rác nhiều mà object sống ít thì rất rẻ, đúng với đặc điểm phần lớn object chết trẻ.

### Finalize và reference yếu
- Object có {{finalize()}} phải qua thêm một vòng (được đưa vào hàng đợi finalizer và "sống lại" tạm thời), nên bị thu hồi chậm hơn. finalize đã bị deprecated for removal (JEP 421, JDK 18).
- Soft/Weak/Phantom reference không giữ object sống như strong reference; GC xử lý chúng theo quy tắc riêng.

### Vì sao vẫn leak
~~~java
public class AuditService {
    private static final Map<String, List<Event>> PENDING = new ConcurrentHashMap<>();

    public void record(String txId, Event e) {
        PENDING.computeIfAbsent(txId, k -> new CopyOnWriteArrayList<>()).add(e);
        // quên remove khi giao dịch hoàn tất -> mọi Event reachable mãi từ static field
    }
}
~~~
Cách tìm: chụp heap dump rồi dùng Path to GC Roots trong MAT trên object nghi ngờ; chuỗi giữ thường có dạng static field → map → entry → object.

### Câu trả lời sai phổ biến
- "Gán null là object được thu ngay": gán null chỉ cắt một reference. Object chết khi không còn đường nào từ root, và chỉ được thu ở lần GC sau.
- "Biến local còn trong scope thì object còn sống": JIT có thể coi biến không còn được dùng nữa là đã chết, nên object có thể bị thu sớm hơn bạn nghĩ. Đó là lý do có {{Reference.reachabilityFence}}.
- "System.gc() giải phóng bộ nhớ ngay": đó chỉ là gợi ý (có thể bị tắt bằng {{-XX:+DisableExplicitGC}}), và với G1 mặc định nó gây ra một lần full GC.
- "Các object trỏ vòng lẫn nhau không bao giờ được thu": đúng với reference counting, sai với JVM.

> Senior tip: khi giải thích một vụ leak cho team, tôi luôn chỉ ra **root** cụ thể lấy từ MAT, thường là static field, ThreadLocal của thread pool, hoặc class loader. Câu hỏi "có GC rồi sao còn leak" được trả lời bằng một câu: GC thu những gì không còn đến được, chứ không thu những gì bạn không còn cần.`,
  follow: [
    'Card table / remembered set giải quyết vấn đề gì khi chỉ dọn young gen?',
    'Vì sao Reference.reachabilityFence tồn tại?'
  ],
  tags: ['GC roots', 'reachability', 'reference counting', 'memory leak'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-021',
  topic: 'jvm',
  level: 'senior',
  q: 'Minor GC, major GC và full GC khác nhau thế nào? Object được promote lên old gen khi nào, và trên production bạn nhận ra "promote quá sớm" hay full GC qua GC log ra sao?',
  a: `**Tóm tắt:** Heap được chia thế hệ dựa trên giả thuyết "phần lớn object chết trẻ". **Minor (young) GC** dọn young gen (Eden + Survivor) khi Eden đầy; có stop-the-world nhưng nhanh vì chỉ copy số ít object còn sống. **Major GC** là việc thu dọn old gen; thuật ngữ này không được chuẩn hoá, với G1 nó thường là chu kỳ concurrent marking cộng các lần mixed GC. **Full GC** dọn toàn bộ heap (kèm class unloading) trong một lần stop-the-world; với G1 đây là phương án dự phòng khi các cơ chế khác không theo kịp, pause dài và là dấu hiệu có vấn đề. Object được promote khi sống qua số lần minor GC vượt tenuring threshold (tối đa 15), khi Survivor không đủ chỗ (promote sớm), còn object rất lớn ở G1 (humongous) được cấp thẳng vào region riêng thuộc old gen.

### Vòng đời một object
~~~text
new Order()  -> Eden
Eden đầy     -> Young GC: object còn sống được copy sang Survivor, tuổi = 1;
                Eden và Survivor cũ được dọn sạch
Các lần sau  -> object còn sống được copy qua lại giữa hai Survivor, tuổi tăng 1
Tuổi đạt ngưỡng (tối đa 15) hoặc Survivor đầy -> promote sang Old
Old dần đầy  -> G1: concurrent marking khi vượt IHOP (mặc định 45% heap)
                -> mixed GC dọn young + một phần region old nhiều rác
Không kịp    -> Full GC (stop-the-world, cả heap)
~~~
- Tuổi được lưu trong 4 bit của object header, nên {{MaxTenuringThreshold}} tối đa là 15. Ngưỡng thực tế được điều chỉnh động theo mức lấp đầy Survivor ({{TargetSurvivorRatio}}, mặc định 50%).
- Ở G1, object có kích thước từ một nửa region trở lên là **humongous** và được cấp thẳng vào region riêng thuộc old. Liên tục tạo mảng byte lớn (đọc file, build response lớn) là một nguồn áp lực old gen.

### So sánh
| | Young | Mixed (G1) | Full |
|---|---|---|---|
| Phạm vi | Eden + Survivor | Young + một số region old nhiều rác | Toàn bộ heap |
| Kích hoạt | Eden đầy | Sau concurrent marking | Cấp phát thất bại, evacuation failure, System.gc()... |
| Pause | Ngắn (vài ms tới vài chục ms) | Ngắn, theo mục tiêu pause | Dài, có thể hàng giây với heap lớn |
| Bình thường? | Có, xảy ra liên tục | Có | Không, cần điều tra |

### Promote quá sớm
Object sống "trung bình" (session, response đang build, batch 10.000 bản ghi) sống qua 1–2 lần young GC, Survivor không đủ chỗ nên bị đẩy sang old, rồi chết ngay sau đó. Old gen đầy rác, marking và mixed GC chạy dày hơn, nặng thì dẫn tới full GC.

Nguyên nhân thường gặp: allocation rate rất cao; young gen quá nhỏ (ví dụ đặt {{MaxGCPauseMillis}} quá thấp khiến G1 thu nhỏ young); batch giữ quá nhiều dữ liệu cùng lúc.

### Đọc GC log (JDK 17, -Xlog:gc)
~~~text
[12.345s][info][gc] GC(41) Pause Young (Normal) (G1 Evacuation Pause) 1530M->420M(2048M) 18.214ms
[60.101s][info][gc] GC(97) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1720M->980M(2048M) 25.002ms
[75.880s][info][gc] GC(120) Pause Full (G1 Compaction Pause) 2010M->1890M(2048M) 2450.317ms
~~~
- Dòng 1 bình thường: young GC dọn hơn 1 GB, còn lại 420 MB.
- Dòng 2: marking được kích hoạt bởi một humongous allocation, cần tìm xem ai đang cấp phát mảng lớn.
- Dòng 3: full GC mất 2,4 giây mà chỉ giải phóng 120 MB, nghĩa là old gen chứa toàn object **còn sống**. Đây là leak hoặc heap quá nhỏ, không phải chuyện tuning GC.

### Hành động
- Xem phân bố tuổi trong Survivor bằng {{-Xlog:gc+age=trace}}.
- Old gen sau mỗi lần mixed/full GC tăng dần theo ngày: leak, cần heap dump. Old gen ổn định nhưng vẫn có full GC: heap nhỏ hoặc cấp phát humongous; tăng heap, giảm cấp phát mảng lớn, hoặc để G1 bắt đầu marking sớm hơn.
- Full GC do {{System.gc()}} từ thư viện hoặc code gọi tay: tìm và gỡ lời gọi, hoặc dùng {{-XX:+ExplicitGCInvokesConcurrent}}.

### Câu trả lời sai phổ biến
- "Major GC chính là full GC": hai từ hay bị dùng lẫn, nhưng với G1 việc dọn old gen chủ yếu là concurrent marking cộng mixed GC, không phải full GC.
- "Minor GC không dừng ứng dụng": có stop-the-world, chỉ là ngắn.
- "Object luôn phải sống đủ 15 lần GC mới lên old": ngưỡng thay đổi động, và Survivor đầy thì object bị promote sớm.

> Senior tip: chỉ số tôi xem đầu tiên không phải pause time mà là **old gen sau GC** (heap còn lại sau mixed/full GC). Đường này đi ngang là heap khoẻ; đi lên theo hình bậc thang là leak; đi ngang nhưng sát trần là heap quá nhỏ. Ba hình dạng, ba hướng xử lý khác nhau.`,
  follow: [
    'Vì sao MaxTenuringThreshold tối đa là 15?',
    'Humongous object trong G1 là gì và vì sao nó gây vấn đề?',
    'Full GC xảy ra trong G1 khi nào, và bạn xử lý thế nào?'
  ],
  tags: ['minor GC', 'major GC', 'full GC', 'promotion', 'tenuring', 'G1'],
  refs: [
    { type: 'doc', title: 'Java Concurrency Utilities', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 425: Virtual Threads Preview', url: 'https://openjdk.org/jeps/425' }
  ]
},
{
  id: 'jvm-022',
  topic: 'jvm',
  level: 'mid',
  q: 'Phân biệt {{StackOverflowError}} và {{OutOfMemoryError}}: nguyên nhân, cách tái hiện từng loại, có nên catch không, và sau khi lỗi xảy ra thì JVM/ứng dụng ở trạng thái nào?',
  a: `**Tóm tắt:** StackOverflowError xảy ra khi stack của **một thread** hết chỗ, gần như luôn do đệ quy quá sâu hoặc vô hạn. Chỉ thread đó bị ảnh hưởng, và stack được giải phóng ngay khi exception lan ngược ra. OutOfMemoryError xảy ra khi JVM không cấp phát được bộ nhớ trong một vùng **dùng chung** (heap, metaspace, direct memory, hay native memory để tạo thread). Nó nổ ở thread "xui xẻo" đang cấp phát lúc đó, không nhất thiết là thread gây ra, và thường cả ứng dụng đã ở trạng thái hỏng. Cả hai đều là {{Error}} (kế thừa {{VirtualMachineError}}) và không nên catch để chạy tiếp. Với OOM, hãy cấu hình heap dump và {{ExitOnOutOfMemoryError}} để process được restart sạch.

### So sánh
| | StackOverflowError | OutOfMemoryError |
|---|---|---|
| Vùng nhớ | Stack của một thread ({{-Xss}}) | Heap, Metaspace, direct buffer, native (khi tạo thread)... |
| Nguyên nhân điển hình | Đệ quy vô hạn hoặc quá sâu ({{toString}} vòng tròn, cây quá sâu) | Leak, heap nhỏ so với tải, nạp quá nhiều dữ liệu một lần |
| Ai chịu | Thread đang đệ quy | Bất kỳ thread nào đang cấp phát lúc đó |
| Sau lỗi | Stack được giải phóng khi unwind; JVM vẫn khoẻ | Heap vẫn đầy; thread khác cũng sắp OOM; trạng thái app có thể dở dang |
| Stack trace | Lặp lại cùng các frame (mặc định chỉ giữ 1024 frame, {{-XX:MaxJavaStackTraceDepth}}) | Chỉ ra chỗ cấp phát, thường không phải chỗ leak |
| Công cụ | Đọc stack trace | Heap dump + MAT, NMT, GC log |

### Tái hiện
~~~java
// StackOverflowError
static int depth = 0;
static void recurse() { depth++; recurse(); }

public static void main(String[] args) {
    try {
        recurse();
    } catch (StackOverflowError e) {
        System.out.println(depth);   // vài nghìn tới vài chục nghìn, tuỳ -Xss, kích thước frame và JIT
    }
}
~~~
~~~java
// OutOfMemoryError: Java heap space  (chạy với -Xmx64m)
List<byte[]> hold = new ArrayList<>();
while (true) hold.add(new byte[1024 * 1024]);   // vẫn giữ reference nên GC không thu được
~~~
Hai ví dụ chỉ để học; đừng chạy kiểu "tạo thread vô hạn" (để tái hiện {{unable to create native thread}}) trên máy dùng chung, vì nó ảnh hưởng tới các process khác của cùng user.

### Vì sao không catch để chạy tiếp
- StackOverflowError có thể nổ ở bất kỳ lời gọi nào trong chuỗi, kể cả lúc một method đang cập nhật trạng thái dở dang. Khối finally vẫn chạy, nhưng finally cũng cần stack và có thể nổ tiếp. Bắt nó ở biên một request để trả lỗi là chấp nhận được, nếu đoạn code đó không sửa trạng thái dùng chung.
- OutOfMemoryError: các thread khác có thể đã chết vì OOM (thread pool mất worker, scheduler ngừng chạy), có thể có object dở dang trong cache, connection dở dang. Trên thực tế không có cách nào chứng minh app vẫn đúng, nên hãy để process chết và restart.
- {{catch (Throwable t)}} trong vòng lặp của worker sẽ nuốt luôn OOM: service trông vẫn "sống" nhưng hỏng ngầm. Nếu buộc phải bắt Throwable, hãy ném lại {{VirtualMachineError}}.

### Xử lý đúng
**StackOverflowError**: đọc stack trace tìm cụm frame lặp lại; đổi đệ quy thành vòng lặp dùng {{ArrayDeque}} làm stack tường minh; giới hạn độ sâu của input (Jackson 2.15+ mặc định giới hạn độ sâu lồng nhau là 1000 qua {{StreamReadConstraints}}). Chỉ tăng {{-Xss}} khi độ sâu là hợp lệ và có giới hạn, và nhớ rằng nó áp dụng cho mọi thread.

**OutOfMemoryError**:
~~~bash
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/ -XX:+ExitOnOutOfMemoryError
~~~
Đọc **thông điệp** để biết vùng nào hết: {{Java heap space}}, {{GC overhead limit exceeded}} (Parallel GC), {{Metaspace}}, {{Direct buffer memory}}, {{unable to create native thread}}, {{Requested array size exceeds VM limit}}. Mỗi loại một hướng điều tra khác nhau. Pod bị OOMKilled (exit 137) thì không có OutOfMemoryError nào cả: đó là kernel giết process vì RSS vượt memory limit.

### Câu trả lời sai phổ biến
- "Thread ném OOM là thủ phạm": thường chỉ là nạn nhân; thủ phạm nằm trong heap dump.
- "StackOverflowError do heap đầy": không liên quan tới heap.
- "Tăng Xmx để sửa StackOverflowError": stack được chỉnh bằng Xss, không phải Xmx.
- "Bắt OutOfMemoryError rồi gọi System.gc()": JVM đã GC hết sức trước khi ném OOM.

> Senior tip: với StackOverflowError, tôi coi input là nghi phạm đầu tiên: cây danh mục cha–con do người dùng tạo, rule engine đệ quy, JSON từ đối tác. Giới hạn độ sâu ở biên hệ thống rẻ hơn nhiều so với tăng Xss. Với OOM, câu hỏi đầu tiên luôn là "thông điệp nói vùng nào?"; rất nhiều lần team nhầm OOM Metaspace hay Direct buffer memory thành OOM heap rồi tăng Xmx một cách vô ích.`,
  follow: [
    'Vì sao thread ném OutOfMemoryError thường không phải thủ phạm?',
    'Tăng -Xss ảnh hưởng gì khi service có 500 thread?'
  ],
  tags: ['StackOverflowError', 'OutOfMemoryError', 'Xss', 'heap dump']
}
);
