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
  tags: ['synchronized', 'ReentrantLock', 'ReadWriteLock', 'StampedLock']
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
  tags: ['ThreadPoolExecutor', 'thread pool', 'sizing']
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
  tags: ['Executors', 'thread pool', 'OOM']
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
  tags: ['CompletableFuture', 'async', 'ForkJoinPool']
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
  tags: ['deadlock', 'thread dump', 'livelock', 'starvation']
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
  tags: ['virtual threads', 'Java 21', 'pinning', 'ThreadLocal']
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
  tags: ['CAS', 'AtomicInteger', 'ABA', 'LongAdder']
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
  tags: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser']
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
  tags: ['rate limit', 'backpressure', 'idempotency', 'DLQ']
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
  tags: ['structured concurrency', 'ScopedValue', 'Java 21']
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
  tags: ['heap', 'metaspace', 'direct memory', 'code cache']
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
  tags: ['G1', 'ZGC', 'Shenandoah', 'Parallel GC']
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
  tags: ['Kubernetes', 'MaxRAMPercentage', 'OOMKilled', 'container']
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
  tags: ['OutOfMemoryError', 'MAT', 'heap dump']
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
  tags: ['memory leak', 'MAT', 'heap dump']
}
,
{
  id: 'jvm-006',
  topic: 'jvm',
  level: 'lead',
  q: 'CPU 100% trên production: quy trình điều tra của bạn (top -H, jstack, async-profiler, JFR) như thế nào?',
  a: `**Tóm tắt:** tìm thread đốt CPU: top -H -p PID lấy thread id nóng nhất → đổi hex → grep trong jstack, đọc frame đầu (hàm nóng). Cần phân sâu hơn thì dùng async-profiler/flame graph hoặc JFR. Phải trả lời được: đốt CPU vì code nghiệp vụ, JIT compiler, GC thread, hay native (TLS/deflate).

### Quy trình tiêu chuẩn
1. Xác định process đốt CPU nhất (top/htop).
2. Lấy thread nóng nhất của process đó:

~~~bash
top -H -p <pid>                          # threads, xem %CPU
printf %x 4321                           # 4321 -> 10e1 (hex)
jstack <pid> | grep -A 12 "nid=0x10e1"   # frame của thread đó
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
  tags: ['CPU', 'jstack', 'async-profiler', 'JFR']
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
  tags: ['JIT', 'C2', 'escape analysis', 'GraalVM']
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
  tags: ['ZGC', 'latency', 'p99', 'safepoint']
}
);
