/* Topics: concurrency, jvm — owner: task T2. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'concurrency-001',
  topic: 'concurrency',
  level: 'mid',
  q: 'Java Memory Model: "happens-before" nghĩa là gì? {{volatile}} đảm bảo điều gì và KHÔNG đảm bảo điều gì?',
  a: `**Tóm tắt:** happens-before là "lời hứa về thứ tự" mà Java Memory Model (JMM) đưa ra: nếu hành động A happens-before hành động B thì mọi thứ A đã ghi đều **nhìn thấy được** khi B chạy, và A được coi là xảy ra trước B. {{volatile}} tạo quan hệ happens-before giữa lần ghi và lần đọc sau đó trên cùng biến, nên nó đảm bảo **visibility (thấy giá trị mới) và ordering (không bị xếp lại thứ tự)**, nhưng KHÔNG đảm bảo **atomicity** của thao tác nhiều bước như {{i++}}.

### Hiểu nhanh
Hãy tưởng tượng mỗi thread là một nhân viên có cuốn sổ nháp riêng (cache của CPU). Bạn ghi số mới vào sổ nháp của mình, nhưng đồng nghiệp ngồi bàn khác vẫn đọc sổ nháp cũ của họ. happens-before giống như quy định "ghi xong phải chép lên bảng chung, và người đọc phải nhìn bảng chung". {{volatile}} là tấm bảng chung đó cho một biến. Nhưng bảng chung không ngăn hai người cùng đọc số 5, cùng cộng 1 rồi cùng ghi 6: muốn vậy cần "khoá" (lock) hoặc phép toán nguyên tử.

### Thuật ngữ
- **JMM (Java Memory Model)**: phần đặc tả Java (JLS chương 17) quy định thread này được phép thấy giá trị gì do thread khác ghi.
- **Visibility**: thread B có thấy giá trị mà thread A vừa ghi hay không.
- **Reordering**: compiler, JIT hoặc CPU đổi thứ tự lệnh để chạy nhanh hơn, miễn là kết quả trong **một** thread không đổi.
- **Atomicity**: một thao tác diễn ra trọn vẹn, không thread nào chen vào giữa.
- **Data race**: hai thread truy cập cùng biến, ít nhất một bên ghi, và không có happens-before giữa chúng.
- **Unsafe publication**: đưa reference của object cho thread khác mà không có happens-before, khiến thread kia có thể thấy object "nửa xây".
- **Monitor**: khoá gắn với mỗi object, được dùng bởi {{synchronized}}.

### Vì sao cần JMM
1. **Mỗi core có cache riêng.** Ghi vào biến có thể chỉ nằm ở cache/store buffer của core đó một lúc; core khác vẫn đọc giá trị cũ. Vì sao: đi ra RAM chậm hơn cache hàng trăm lần, phần cứng phải "lười" đồng bộ để nhanh.
2. **Compiler/JIT xếp lại lệnh.** Ví dụ JIT thấy biến {{stop}} không bị sửa trong vòng lặp nên đưa phép đọc ra ngoài vòng: {{while (!stop)}} thành vòng lặp vô hạn. Vì sao: trong một thread, việc đó không làm đổi kết quả.
3. **Thread khác có thể thấy object "nửa xây".** Thread A chạy xong constructor rồi gán reference, nhưng thread B thấy reference khác null mà field vẫn là giá trị mặc định (0/null) — đây là unsafe publication.
4. **JMM là hợp đồng:** nếu bạn tạo đủ quan hệ happens-before, JVM hứa mọi tối ưu trên đều "vô hình" với bạn. Không có happens-before thì kết quả là bất định.

~~~text
Core 1 (Thread A)            Core 2 (Thread B)
cache: stop = true           cache: stop = false   <- vẫn đọc giá trị cũ
        \\                          /
         ---------- RAM: ? --------
volatile: ghi phải đẩy ra, đọc phải lấy bản mới nhất
~~~

### Các rule happens-before hay dùng
1. **Program order**: trong cùng một thread, lệnh viết trước happens-before lệnh viết sau.
2. **Monitor lock**: unlock một monitor happens-before lần lock tiếp theo trên **cùng** monitor. Vì sao quan trọng: đây là lý do code trong {{synchronized}} thấy được mọi thứ thread trước đã ghi.
3. **{{volatile}}**: write vào biến volatile happens-before mọi read sau đó thấy giá trị đó.
4. **{{Thread.start()}}**: mọi thứ trước {{start()}} thấy được trong thread mới. **{{Thread.join()}}**: mọi thứ thread con làm thấy được sau khi {{join()}} trả về.
5. **Transitive (bắc cầu)**: A hb B và B hb C thì A hb C. Đây là "phép màu" giúp ghi field thường **trước** khi ghi volatile cũng được publish theo.

### Volatile: được và không được gì

~~~java
volatile boolean stop;
// ĐÚNG: flag visibility, safe publication
while (!stop) { work(); }    // thread khác set stop = true thì vòng lặp chắc chắn dừng

// SAI: i++ gồm read-modify-write 3 bước, vẫn mất update
volatile int counter;
counter++;                   // => phải dùng AtomicInteger / LongAdder / lock
~~~

- **Được**: read thấy giá trị mới nhất; các ghi **trước** lệnh ghi volatile được "publish" cho thread đọc biến volatile sau đó.
- **Không được**: atomic cho thao tác ghép (compound action); không loại bỏ race kiểu check-then-act ({{if (x == null) x = ...}}).

Ví dụ số liệu: 2 thread, mỗi thread {{counter++}} 100.000 lần trên biến volatile. Kết quả mong muốn 200.000, thực tế thường ra kiểu 13x.xxx–19x.xxx và mỗi lần chạy một khác. Đổi sang {{AtomicInteger.incrementAndGet()}} thì luôn đúng 200.000.

### Lỗi hay gặp
- **Cờ dừng không volatile**: triệu chứng là thread nền không bao giờ dừng khi gọi stop (chỉ xảy ra sau khi JIT đã tối ưu, nên test ngắn thì chạy đúng). Cách tránh: cờ dùng chung giữa thread phải là {{volatile}} hoặc {{AtomicBoolean}}.
- **Tin rằng volatile làm counter đúng**: triệu chứng là số đếm thiếu dưới tải. Cách tránh: dùng {{AtomicInteger}}/{{LongAdder}} hoặc lock.
- **Dùng nhiều field volatile riêng lẻ để giữ một bất biến** (ví dụ min và max): reader có thể thấy min mới, max cũ. Cách tránh: gói vào object immutable và publish qua một reference volatile, hoặc dùng lock.
- **Dùng Thread.sleep trong test để "chứng minh" đúng**: sleep không tạo happens-before. Cách tránh: dùng jcstress cho litmus test, hoặc lý luận bằng các rule ở trên.

### Trả lời miệng 1 phút
"happens-before là quy tắc của Java Memory Model: nếu A happens-before B thì B chắc chắn thấy mọi thứ A đã ghi. Lý do cần nó là CPU có cache riêng từng core và JIT được phép xếp lại lệnh, nên không có quy tắc thì thread này có thể đọc giá trị cũ của thread kia. Các nguồn happens-before hay dùng là unlock trước lock trên cùng monitor, ghi volatile trước đọc volatile, start và join của thread, và tính bắc cầu. volatile cho tôi visibility và ordering nên rất hợp làm cờ dừng hay publish một object; nhưng nó không làm count++ nguyên tử vì đó là ba bước đọc, cộng, ghi. Trong thực tế, cờ thì tôi dùng volatile, đếm thì dùng AtomicInteger hoặc LongAdder, còn bất biến nhiều field thì dùng lock hoặc object immutable."

> Senior tip: phỏng vấn hay hỏi "volatile rồi mà vẫn sai thì do đâu?" — câu trả lời chuẩn: volatile chỉ đảm bảo thấy giá trị, không đảm bảo tính toàn vẹn của phép nhiều bước; cần lock, Atomic hoặc object bất biến. Khi review code concurrent, tôi yêu cầu tác giả chỉ ra được **cạnh happens-before cụ thể** nối writer với reader; không chỉ ra được thì code đó đang "đúng nhờ may mắn" (thường là nhờ x86, và sẽ lộ bug khi chạy trên ARM như AWS Graviton).`,
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
  a: `**Tóm tắt:** {{synchronized}} là lựa chọn mặc định: cú pháp gọn, không thể quên unlock, và JVM tối ưu mạnh (lock nhẹ khi không tranh chấp, lock coarsening/elision). Chuyển sang {{ReentrantLock}} khi cần những thứ synchronized không có: {{tryLock}} có timeout, chờ mà vẫn ngắt được, fair, nhiều {{Condition}}. {{ReadWriteLock}} và {{StampedLock}} chỉ đáng dùng khi đọc nhiều hơn ghi rõ rệt **và** đo được có tranh chấp thật.

### Hiểu nhanh
Hãy nghĩ tới một phòng họp có một chìa khoá. {{synchronized}} là cánh cửa tự khoá: vào thì khoá, ra thì tự mở, không thể quên. {{ReentrantLock}} là chìa khoá bạn tự cầm: linh hoạt hơn (đợi tối đa 2 giây rồi bỏ đi, hoặc bỏ về khi sếp gọi), nhưng quên trả chìa là cả công ty kẹt. {{ReadWriteLock}} là phòng triển lãm: nhiều người **xem** cùng lúc được, nhưng khi có người **sửa** tranh thì phải đóng cửa. {{StampedLock}} cho phép người xem "liếc nhanh không cần vé", rồi kiểm tra xem trong lúc liếc có ai sửa không; có thì xem lại cẩn thận.

### Thuật ngữ
- **Monitor**: khoá gắn sẵn với mọi object Java, là thứ {{synchronized}} dùng.
- **AQS (AbstractQueuedSynchronizer)**: khung trong JDK quản lý một biến state và hàng đợi thread chờ; là nền của ReentrantLock, Semaphore, CountDownLatch.
- **CAS (compare-and-swap)**: lệnh CPU "ghi giá trị mới nếu giá trị hiện tại vẫn như tôi thấy", nguyên tử mà không cần khoá.
- **Reentrant**: thread đang giữ khoá có thể lấy lại chính khoá đó (gọi lồng nhau) mà không tự chặn mình.
- **Contention**: nhiều thread cùng tranh một khoá tại cùng thời điểm.
- **Lock coarsening / elision**: JIT gộp nhiều lần lock liền nhau thành một, hoặc bỏ hẳn lock trên object không thoát ra khỏi method (nhờ escape analysis).
- **Starvation**: một thread chờ mãi không tới lượt.

### Bảng so sánh

| Tính năng | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|---|---|---|---|---|
| Cơ chế | monitor JVM | CAS + AQS | 1 AQS, state chia read/write | CAS + spin/park |
| tryLock/timeout | Không | Có | Có | Có |
| Ngắt được khi chờ | Không | Có | Có | Có |
| Reentrant | Có | Có | Có | Không |
| Nhiều điều kiện chờ | 1 wait set | Nhiều Condition | Có (write lock) | Không có Condition |
| Tự nhả khi exception | Có | Phải unlock trong finally | Phải unlock trong finally | Phải unlock đúng stamp |

### Điểm cần kể (theo thứ tự cân nhắc)
1. **synchronized trước tiên.** Khi không có tranh chấp, JVM dùng lock nhẹ (chỉ một CAS); khi có tranh chấp mới inflate thành monitor đầy đủ. JIT còn làm lock coarsening và elimination. Vì sao chọn trước: khoảng 90% trường hợp hiệu năng tương đương, mà code ngắn và không thể quên unlock. (Biased locking đã tắt mặc định từ JDK 15 và bị gỡ ở JDK 18.)
2. **{{ReentrantLock}} khi cần điều khiển.** Mỗi {{Condition}} là một hàng chờ riêng (ví dụ notFull/notEmpty trong bounded buffer); {{lockInterruptibly()}} cho phép thread thoát ra khi bị cancel/shutdown; {{tryLock(2, SECONDS)}} giúp tránh deadlock. Vì sao không dùng mặc định: phải tự {{unlock()}} trong {{finally}}, quên là treo hệ thống.
3. **{{ReentrantReadWriteLock}} khi đọc áp đảo.** Read lock chia sẻ, write lock độc quyền. Chỉ đáng giá khi tỷ lệ read/write rất lệch (khoảng trên 10:1) **và** đoạn critical section đủ dài; nếu đoạn đọc chỉ vài nano giây thì chi phí quản lý read lock còn lớn hơn lợi ích. Fair mode chống starvation nhưng giảm throughput.
4. **{{StampedLock}} khi cần tốc độ đọc tối đa.** Optimistic read: đọc không khoá, sau đó {{validate(stamp)}} xem có write chen vào không; có thì rơi xuống readLock. Giá phải trả: **không reentrant** (lấy lại lần hai trong cùng thread là tự deadlock), không có Condition, code phức tạp, dễ unlock sai stamp.

~~~java
// Optimistic read của StampedLock
long stamp = sl.tryOptimisticRead();   // không khóa, chỉ lấy "số phiên bản"
double x = cx, y = cy;                 // đọc vào biến cục bộ
if (!sl.validate(stamp)) {             // có write xen vào trong lúc đọc?
    stamp = sl.readLock();             // fallback pessimistic
    try { x = cx; y = cy; } finally { sl.unlockRead(stamp); }
}
return Math.hypot(x, y);               // chỉ dùng dữ liệu sau khi đã validate
~~~

~~~java
// ReentrantLock: luôn theo mẫu lock - try - finally unlock
if (lock.tryLock(200, TimeUnit.MILLISECONDS)) {
    try { updateBalance(); } finally { lock.unlock(); }
} else {
    throw new BusyException("Tài khoản đang được xử lý, thử lại sau");
}
~~~

### Lỗi hay gặp
- **Quên unlock khi có exception**: triệu chứng là sau một lỗi, mọi request vào đoạn đó treo vĩnh viễn (thread dump thấy hàng loạt thread WAITING ở {{ReentrantLock.lock}}). Cách tránh: {{lock()}} ngay trước {{try}}, {{unlock()}} trong {{finally}}.
- **Dùng StampedLock trong code gọi đệ quy/lồng nhau**: triệu chứng là thread tự treo chính nó. Cách tránh: chỉ dùng StampedLock trong class nhỏ, đóng gói kín, không gọi callback khi đang giữ lock.
- **Chọn ReadWriteLock theo cảm tính**: triệu chứng là chậm hơn synchronized khi đoạn đọc ngắn. Cách tránh: benchmark bằng JMH với tỷ lệ đọc/ghi thật.
- **Lock trong JVM cho dữ liệu nằm ở DB**: chạy 3 pod là 3 lock riêng, không bảo vệ được gì. Cách tránh: khoá/điều kiện ở tầng DB.

### Trả lời miệng 1 phút
"Mặc định tôi dùng synchronized vì gọn, không thể quên unlock, và JVM tối ưu tốt khi không tranh chấp. Khi cần tryLock có timeout để tránh deadlock, cần chờ mà ngắt được, cần fair, hoặc cần nhiều Condition, tôi chuyển sang ReentrantLock — nó xây trên AQS và CAS, đổi lại phải unlock trong finally. ReadWriteLock cho phép nhiều reader song song, chỉ có lợi khi đọc áp đảo và đoạn đọc đủ dài. StampedLock thêm optimistic read, nhanh nhất cho read-heavy nhưng không reentrant và dễ dùng sai. Kinh nghiệm của tôi là không chọn theo lý thuyết mà đo bằng JMH trên tải thật; nhiều lần đổi về synchronized mà throughput không giảm."

> Senior tip: đừng chọn lock theo whiteboard — benchmark với JMH trên profile thật. Tôi từng thấy module migrate JDK 8 lên 17 đổi ReentrantLock về synchronized: throughput không giảm, code gọn đi nhiều. Thêm một lưu ý cho Java 21: với virtual thread, block I/O bên trong synchronized làm virtual thread bị **pin** vào carrier thread, nên khi đó ReentrantLock là lựa chọn an toàn hơn; từ JDK 24 (JEP 491) hạn chế này đã được gỡ cho synchronized.`,
  follow: [
    'StampedLock không reentrant — gây vấn đề gì khi refactor code cũ?',
    'Condition của ReentrantLock khác Object.wait/notify thế nào?'
  ],
  tags: ['synchronized', 'ReentrantLock', 'ReadWriteLock', 'StampedLock'],
  refs: [
    { type: 'doc', title: 'ReentrantLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html' },
    { type: 'doc', title: 'StampedLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html' },
    { type: 'doc', title: 'JEP 491: Synchronize Virtual Threads without Pinning', url: 'https://openjdk.org/jeps/491' },
  ]
},
{
  id: 'concurrency-003',
  topic: 'concurrency',
  level: 'senior',
  q: 'Đi sâu vào {{ThreadPoolExecutor}}: thứ tự tạo thread khi submit 1 task, rejection policy và cách sizing pool cho CPU-bound vs IO-bound?',
  a: `**Tóm tắt:** khi submit một task, {{ThreadPoolExecutor}} làm theo đúng thứ tự: (1) chưa đủ corePoolSize thì tạo thread mới; (2) đủ core rồi thì cho task vào queue; (3) queue đầy thì tạo thêm thread tới maximumPoolSize; (4) đã max mà queue vẫn đầy thì reject theo policy. Sizing: CPU-bound ≈ số core; IO-bound ≈ core × (1 + W/C), với W/C là tỉ lệ thời gian chờ / thời gian tính toán. Công thức chỉ là điểm khởi đầu, phải đo thật.

### Hiểu nhanh
Hãy hình dung một quầy giao dịch ngân hàng. corePoolSize là số giao dịch viên chính thức; queue là hàng ghế chờ; maximumPoolSize là tổng số giao dịch viên khi gọi thêm người làm thời vụ; rejection policy là bảo vệ ra nói "hôm nay hết số". Điều bất ngờ: ngân hàng này chỉ gọi người thời vụ khi **hàng ghế chờ đã kín**, không phải khi khách vừa bắt đầu đông. Nếu hàng ghế dài vô hạn thì không bao giờ có người thời vụ và khách chờ mãi.

### Thuật ngữ
- **corePoolSize**: số thread pool cố gắng giữ thường trực.
- **maximumPoolSize**: trần số thread, chỉ vượt core khi queue đầy.
- **keepAliveTime**: thread vượt core rảnh quá thời gian này thì bị huỷ.
- **Bounded queue**: hàng đợi có sức chứa giới hạn, ví dụ {{ArrayBlockingQueue(100)}}.
- **Rejection policy**: cách xử lý khi pool không nhận thêm được task.
- **CPU-bound / IO-bound**: task tốn thời gian tính toán / tốn thời gian chờ mạng, DB, file.
- **Little's law**: số việc đang xử lý đồng thời = throughput × thời gian xử lý mỗi việc.
- **Backpressure**: tín hiệu "chậm lại" truyền ngược về phía bên gửi việc khi hệ thống quá tải.

### Thứ tự xử lý khi submit (từng bước)
1. **Số thread < core** → tạo thread mới chạy task ngay, kể cả khi đang có thread rảnh. Vì sao: pool "làm ấm" dần tới số core.
2. **Đủ core** → {{queue.offer(task)}}. Vì sao queue trước: JDK coi thread là tài nguyên đắt, ưu tiên xếp hàng hơn là tạo thêm thread.
3. **Queue đầy** → tạo thread mới cho tới maximumPoolSize. Đây là "chế độ khẩn cấp" để xả tải.
4. **Đã max và queue vẫn đầy** → gọi RejectedExecutionHandler.

~~~text
submit(task)
   |
   v
threads < core ? --yes--> tạo thread mới
   | no
   v
queue.offer ok ? --yes--> nằm chờ trong queue
   | no (đầy)
   v
threads < max ? --yes--> tạo thread "thời vụ"
   | no
   v
rejection policy
~~~

### Constructor đầy đủ

~~~java
new ThreadPoolExecutor(
    4,                                  // corePoolSize
    8,                                  // maximumPoolSize
    60, TimeUnit.SECONDS,               // keepAlive cho thread ngoài core
    new ArrayBlockingQueue<>(100),      // queue BOUNDED (rất quan trọng)
    namedThreadFactory,                 // đặt tên thread để đọc thread dump
    new ThreadPoolExecutor.CallerRunsPolicy()); // rejection
~~~

- Bẫy tư duy: queue được check **trước** khi tạo thread vượt core. Với queue vô hạn, maxPoolSize gần như vô nghĩa (pool không bao giờ vượt core).
- {{allowCoreThreadTimeOut(true)}} cho cả core thread chết khi idle — hợp cho pool có traffic co giãn.
- Ví dụ số: core 4, max 8, queue 100. Gửi 50 task cùng lúc: 4 task chạy, 46 nằm queue, **không** có thread thứ 5. Gửi 110 task: 4 chạy + 100 chờ + 4 thread thời vụ chạy 4 task nữa = 108, 2 task còn lại bị reject.

### Rejection policy
- **AbortPolicy** (mặc định): ném {{RejectedExecutionException}} — fail fast, caller tự retry hoặc trả 503.
- **CallerRunsPolicy**: chạy task trên chính thread submit — backpressure tự nhiên vì caller bận thì không submit thêm được; nhưng nếu submit từ Netty event loop thì cả hệ thống chậm theo.
- **DiscardPolicy / DiscardOldestPolicy**: bỏ im lặng — chỉ hợp task có thể vứt (metric, log).

### Sizing
1. **CPU-bound**: pool ≈ số core (có thể +1). Vì sao: chỉ có N core thật, thêm thread chỉ tăng context switch.
2. **IO-bound**: pool ≈ core × (1 + W/C). Ví dụ 8 core, mỗi request chờ DB 90 ms và tính toán 10 ms → W/C = 9 → khoảng 80 thread. REST, JDBC, file IO có thể gấp 10–50 lần số core.
3. **Kiểm chứng bằng Little's law**: concurrency cần ≈ throughput × latency mục tiêu (ví dụ 1000 req/s × 200 ms = 200 request đang bay).
4. **Đo**: expose activeCount/queueSize qua Micrometer; alert khi queue > 70% trong nhiều phút.

### Lỗi hay gặp
- **Queue vô hạn** (mặc định của {{newFixedThreadPool}}): triệu chứng là p99 trượt dài, heap tăng dần rồi OOM. Cách tránh: luôn truyền capacity cho queue.
- **Task ném exception không ai hay**: với {{submit()}}, exception nằm im trong Future. Cách tránh: bọc try-catch trong task và log, hoặc dùng {{execute()}} cùng UncaughtExceptionHandler.
- **Pool JDBC không tune song song**: 200 thread với 10 connection = 190 thread xếp hàng chờ connection, timeout hàng loạt. Cách tránh: kích thước pool thread phải khớp với pool connection và giới hạn của DB.
- **Đặt max lớn mà queue vô hạn rồi tưởng pool sẽ tự co giãn**: pool mãi chỉ có core thread. Cách tránh: hiểu đúng thứ tự ở trên.

### Trả lời miệng 1 phút
"ThreadPoolExecutor xử lý submit theo thứ tự: chưa đủ core thì tạo thread, đủ core thì vào queue, queue đầy mới tạo thêm tới max, max rồi thì reject. Điểm hay bị hiểu sai là queue được ưu tiên trước thread vượt core, nên dùng queue vô hạn thì max coi như vô nghĩa và burst sẽ thành latency rồi OOM. Policy tôi hay dùng là AbortPolicy để fail fast trả 503, hoặc CallerRunsPolicy cho batch nội bộ để có backpressure. Sizing thì CPU-bound bằng số core, IO-bound theo core nhân một cộng W trên C, rồi kiểm chứng bằng Little's law và metric queue size, active count. Trên production tôi luôn yêu cầu queue bounded, policy ghi rõ và thread có tên."

> Senior tip: tôi luôn đưa ra con số mẫu: với API ngoài 100 rps và latency 200 ms, concurrency cap = 20 theo Little's law; rate limiter 100 rps chặn burst. Câu trả lời thiếu số và thiếu cách đo là thiếu nửa điểm ở vị trí senior.`,
  follow: [
    'Vì sao JDK check queue trước khi tạo thread vượt core?',
    'CallerRunsPolicy block Netty event loop — xử lý thế nào?'
  ],
  tags: ['ThreadPoolExecutor', 'thread pool', 'sizing'],
  refs: [
    { type: 'doc', title: 'ThreadPoolExecutor API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ]
}
,
{
  id: 'concurrency-004',
  topic: 'concurrency',
  level: 'senior',
  q: 'Vì sao không nên dùng {{Executors.newFixedThreadPool}} / {{newCachedThreadPool}} mặc định trên production?',
  a: `**Tóm tắt:** {{newFixedThreadPool}} dùng {{LinkedBlockingQueue}} không giới hạn: khi có burst, queue phình vô hạn, p99 trượt dài rồi OOM heap, và maxPoolSize gần như vô nghĩa. {{newCachedThreadPool}} có max = {{Integer.MAX_VALUE}} với {{SynchronousQueue}} (không chứa được task nào): burst tạo hàng nghìn thread, dẫn tới OOM "unable to create native thread". Production nên tự dựng {{ThreadPoolExecutor}} với queue bounded, rejection policy có chủ đích và thread có tên.

### Hiểu nhanh
{{newFixedThreadPool}} giống một quán ăn có 10 đầu bếp nhưng hàng chờ dài vô tận: khách cứ xếp hàng, chẳng ai bị từ chối, nhưng người cuối hàng chờ 3 tiếng và quán bị tràn ra đường (hết RAM). {{newCachedThreadPool}} ngược lại: mỗi khách tới là thuê thêm một đầu bếp mới, không giới hạn — đến lúc bếp không còn chỗ đứng (hết bộ nhớ/giới hạn thread của OS). Cả hai đều thiếu cái quan trọng nhất: một giới hạn rõ ràng và cách nói "không" khi quá tải.

### Thuật ngữ
- **Executors**: class tiện ích của JDK sinh sẵn các pool phổ biến (fixed, cached, single, scheduled).
- **LinkedBlockingQueue**: queue dạng danh sách liên kết; tạo không truyền capacity thì sức chứa là {{Integer.MAX_VALUE}}.
- **SynchronousQueue**: queue sức chứa 0 — mỗi lần đưa task vào phải có thread nhận ngay.
- **Native thread**: thread thật của hệ điều hành; mỗi platform thread Java ứng với một native thread, có stack riêng.
- **OOM (OutOfMemoryError)**: JVM hết bộ nhớ heap, metaspace hoặc không tạo được native thread.
- **p99**: 99% request nhanh hơn giá trị này; đo "đuôi chậm" mà người dùng cảm nhận.
- **ThreadFactory**: đối tượng quyết định cách tạo thread (tên, daemon, priority).

### Câu chuyện failure (từng bước)
1. Burst 50k task trong 10 giây, mỗi task khoảng 100 ms.
2. Fixed pool 10 thread xử lý được khoảng 100 task/giây, tức trong 10 giây chỉ xong khoảng 1k task. 49k task còn lại nằm trong queue. Vì sao không tạo thêm thread: queue chưa bao giờ đầy, nên max không bao giờ được dùng tới.
3. Task cuối hàng chờ khoảng 490 giây. Client đã timeout từ lâu, nhưng server vẫn cặm cụi làm việc vô ích.
4. Mỗi task giữ một payload (ví dụ 50 KB) → 49k × 50 KB ≈ 2,4 GB nằm trong heap → GC chạy liên tục → OOM.

~~~java
// Burst 50k task trong 10s, mỗi task ~100ms
Executors.newFixedThreadPool(10);
// queue vô hạn: hàng chục nghìn task chờ => p99 lên hàng trăm giây
// task giữ payload lớn => OOM heap

Executors.newCachedThreadPool();
// SynchronousQueue: mỗi task cần một thread mới (nếu không có thread rảnh)
// 10k thread x ~1 MB stack reserve => "unable to create native thread"
~~~

~~~text
newFixedThreadPool(10)          newCachedThreadPool()
[10 thread] <- [queue vô hạn]   [thread][thread][thread]... không giới hạn
  latency tăng -> OOM heap        RAM/ulimit cạn -> OOM native thread
~~~

### Thiếu sót của factory helper
- Không expose rejection policy (mặc định Abort) và ThreadFactory — thread dump toàn {{pool-1-thread-123}}, khó grep.
- Không expose loại queue/capacity, allowCoreThreadTimeOut — mọi tuning phải sửa code.
- Không có sẵn metric queue depth / active count / rejection count.
- Java 21: {{newVirtualThreadPerTaskExecutor}} thay "cached pool" cho task IO — nhưng vẫn phải giới hạn ở tầng tài nguyên (pool JDBC, semaphore), nếu không tự DDoS chính DB của mình.

### Cách làm đúng

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 32, 30, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),                    // tối đa 200 task chờ
    new CustomizableThreadFactory("video-encode-"),   // Spring; set daemon qua setDaemon(true)
    new ThreadPoolExecutor.CallerRunsPolicy());       // hoặc Abort + retry/MQ
pool.allowCoreThreadTimeOut(true);
~~~

Không dùng Spring thì Java 21 có sẵn {{Thread.ofPlatform().name("video-encode-", 0).factory()}} để đặt tên thread.

Rule tôi áp cho team khi review: mọi pool trên production phải có (1) queue bounded, (2) rejection policy được ghi rõ, (3) thread name dễ grep, (4) metric queue size và số lần reject.

### Lỗi hay gặp
- **Tạo pool mới trong mỗi request** ({{Executors.newFixedThreadPool}} trong method controller): triệu chứng là số thread tăng mãi, vì pool không được shutdown. Cách tránh: pool là bean dùng chung, shutdown theo lifecycle app.
- **Dùng newSingleThreadExecutor cho việc quan trọng**: nó cũng có queue vô hạn, một task chậm làm cả hàng chờ dồn lại. Cách tránh: đặt capacity và timeout.
- **Chuyển sang virtual thread rồi bỏ mọi giới hạn**: triệu chứng là DB báo "too many connections" hoặc đối tác trả 429. Cách tránh: Semaphore hoặc pool connection làm giới hạn thật.
- **CallerRunsPolicy trên thread I/O của Netty/WebFlux**: event loop bị chặn, mọi kết nối khác chậm theo. Cách tránh: dùng AbortPolicy và trả lỗi nhanh ở tầng đó.

### Trả lời miệng 1 phút
"Tôi không dùng Executors.newFixedThreadPool hay newCachedThreadPool trên production vì cả hai đều không có giới hạn ở chỗ nguy hiểm nhất. Fixed pool dùng LinkedBlockingQueue vô hạn, nên khi burst, task xếp hàng mãi, latency tăng tới hàng trăm giây rồi OOM heap, và max pool không bao giờ được dùng. Cached pool dùng SynchronousQueue với max bằng Integer.MAX_VALUE, nên burst tạo hàng nghìn thread và OOM vì không tạo được native thread. Thay vào đó tôi tự tạo ThreadPoolExecutor với queue bounded, rejection policy rõ ràng, thread có tên và metric. Từ Java 21, với task I/O có thể dùng virtual thread, nhưng vẫn giới hạn bằng semaphore hoặc connection pool."

> Senior tip: vụ thực tế tôi điều tra: p99 nhảy từ 80 ms lên 9 s không phải vì code chậm mà vì queue vô hạn nuốt 200k task sau một khoảng traffic spike. Fail fast với rejection công khai tốt hơn âm thầm xếp hàng vô hạn nhiều.`,
  follow: [
    'CallerRunsPolicy dùng cùng Netty event loop — risk thế nào?',
    'Với virtual threads, còn cần giới hạn gì ngoài số thread?'
  ],
  tags: ['Executors', 'thread pool', 'OOM'],
  refs: [
    { type: 'doc', title: 'ThreadPoolExecutor API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html' },
    { type: 'doc', title: 'Executors API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html' },
  ]
},
{
  id: 'concurrency-005',
  topic: 'concurrency',
  level: 'senior',
  q: '{{CompletableFuture}}: khác biệt giữa {{thenApply}} và {{thenCompose}}, dùng {{allOf}} thế nào, xử lý exception, executor mặc định chạy ở đâu?',
  a: `**Tóm tắt:** {{thenApply}} = map: biến giá trị thành giá trị khác. {{thenCompose}} = flatMap: dùng khi bước tiếp theo **tự nó** trả về một CompletableFuture, để không bị lồng {{CompletableFuture<CompletableFuture<T>>}}. {{allOf}} chờ nhiều future rồi gom kết quả bằng {{join()}}. Lỗi xử lý bằng {{exceptionally}} / {{handle}} / {{whenComplete}}. Không truyền executor thì callback không-async chạy trên thread vừa hoàn thành bước trước (hoặc thread gọi nếu future đã xong), còn các hàm {{*Async}} chạy trên {{ForkJoinPool.commonPool()}} — task blocking bắt buộc phải dùng executor riêng.

### Hiểu nhanh
CompletableFuture giống một phiếu hẹn ở tiệm giặt: bạn được phiếu ngay, đồ giặt xong sau. {{thenApply}} là "khi xong thì gấp quần áo" — việc nhỏ, làm ngay trên kết quả. {{thenCompose}} là "khi xong thì gửi sang tiệm là ủi" — việc đó lại cho bạn **một phiếu hẹn mới**; thenCompose giúp bạn cầm một phiếu cuối cùng thay vì "phiếu kẹp trong phiếu". {{allOf}} là "báo tôi khi cả ba túi đồ đều xong". Còn executor là "ai làm việc đó": không nói rõ thì ai rảnh làm, và nếu bạn bắt nhân viên dùng chung của cả toà nhà (commonPool) đứng chờ, cả toà nhà kẹt.

### Thuật ngữ
- **CompletableFuture (CF)**: future có thể hoàn thành từ bên ngoài và cho phép nối các bước xử lý bất đồng bộ.
- **map / flatMap**: map biến T thành R; flatMap biến T thành "hộp chứa R" rồi gỡ một lớp hộp.
- **Callback / stage**: một bước trong chuỗi, chạy khi bước trước hoàn thành.
- **commonPool**: ForkJoinPool dùng chung toàn JVM, parallelism mặc định = số core − 1.
- **CompletionException**: exception bọc lỗi gốc khi lỗi đi qua chuỗi CF hoặc khi gọi {{join()}}.
- **Executor**: thành phần quyết định task chạy trên thread nào.
- **Fail-fast**: dừng ngay khi có lỗi đầu tiên thay vì chờ tất cả.

### thenApply vs thenCompose

~~~java
CompletableFuture<HttpResp> resp = client.callAsync(url);

// map giá trị -> giá trị
CompletableFuture<Dto> dto = resp.thenApply(Dto::of);

// flatMap: bước tiếp theo là async (trả CF)
CompletableFuture<Detail> d = resp.thenCompose(r -> fetchAsync(r.id));

// nếu dùng thenApply(r -> fetchAsync(r.id)): được CF<CF<Detail>> — sai mong muốn
~~~

Quy tắc nhớ: lambda trả về giá trị thường thì dùng thenApply; lambda trả về CompletableFuture thì dùng thenCompose.

### allOf + gom kết quả
~~~java
CompletableFuture<List<Price>> all = CompletableFuture
    .allOf(c1, c2, c3)
    .thenApply(v -> List.of(c1.join(), c2.join(), c3.join()));
~~~
1. {{allOf}} trả về {{CF<Void>}} — nó không chứa kết quả, chỉ báo "tất cả đã xong".
2. Khi allOf complete, từng CF con đã xong nên {{join()}} bên trong không block.
3. Nếu một CF con lỗi, allOf cũng complete exceptionally (bọc trong CompletionException) — nhưng **chỉ khi TẤT CẢ CF con đã xong**: allOf không fail-fast. Muốn huỷ sớm phải tự xử lý (ví dụ CF con lỗi thì complete một CF "failFast" riêng).

Ví dụ số: gọi 3 dịch vụ giá, lần lượt mất 120 ms, 80 ms, 300 ms. Gọi tuần tự hết 500 ms; dùng supplyAsync + allOf hết khoảng 300 ms (bằng call chậm nhất).

### Xử lý exception
- {{exceptionally(ex -> fallback)}}: chỉ chạy khi lỗi; dùng để thay bằng giá trị dự phòng.
- {{handle((v, ex) -> ...)}}: luôn chạy; dùng để chuẩn hoá cả hai đường thành công/thất bại.
- {{whenComplete((v, ex) -> ...)}}: side effect (log/metric), giữ nguyên kết quả hoặc lỗi.
- Chuỗi không xử lý lỗi sẽ im lặng cho tới khi có người {{join/get}} — nếu không ai gọi, lỗi "rơi vào hư không"; nhớ whenComplete để log.
- Timeout: Java 9+ có {{orTimeout(2, SECONDS)}} (lỗi TimeoutException) và {{completeOnTimeout(fallback, 2, SECONDS)}}.

### Executor mặc định (từng trường hợp)
1. **{{thenApply}} (không Async)**: chạy trên thread vừa hoàn thành bước trước; nếu future đã xong từ trước thì chạy ngay trên thread đang gọi thenApply.
2. **{{thenApplyAsync(fn)}} / {{supplyAsync(fn)}} không truyền executor**: chạy trên {{ForkJoinPool.commonPool()}} (parallelism = cores − 1). Pool này dùng chung với parallel stream và CF khác: cạn là ảnh hưởng toàn JVM. (Nếu parallelism ≤ 1, ví dụ container 1–2 vCPU, JDK tạo một thread mới cho mỗi task.)
3. **{{supplyAsync(fn, ioExecutor)}}**: chạy trên executor bạn chỉ định — cách đúng cho IO.
- Pitfall lớn: blocking code (JDBC, REST sync) trong commonPool làm treo cả pool; deadlock tự tạo kinh điển: callback trong commonPool {{join()}} một CF con cũng cần chạy trong commonPool.

### Lỗi hay gặp
- **Dùng thenApply cho bước trả về CF**: triệu chứng là kiểu {{CF<CF<T>>}} và phải join hai lần (block thread). Cách tránh: thenCompose.
- **supplyAsync không executor cho JDBC/HTTP**: triệu chứng là parallel stream và các tính năng khác chậm theo, thread dump thấy worker commonPool chờ socket. Cách tránh: executor IO riêng có giới hạn.
- **Quên xử lý lỗi**: triệu chứng là request "biến mất" không log. Cách tránh: whenComplete log ở cuối chuỗi, handle/exceptionally ở biên.
- **join() rải rác giữa chuỗi**: mất lợi ích async, có thể deadlock. Cách tránh: chỉ join ở tầng biên.

### Trả lời miệng 1 phút
"thenApply là map, dùng khi bước sau trả về giá trị thường; thenCompose là flatMap, dùng khi bước sau tự trả về CompletableFuture để tránh lồng future trong future. Muốn chạy song song nhiều call thì tôi supplyAsync từng cái rồi allOf, sau đó join từng cái để gom kết quả — lưu ý allOf không fail-fast. Lỗi thì exceptionally để fallback, handle để chuẩn hoá cả hai nhánh, whenComplete để log. Điểm quan trọng nhất là executor: các hàm Async không truyền executor chạy trên commonPool dùng chung cả JVM, nên mọi IO tôi đều truyền executor riêng có giới hạn, và chỉ join ở tầng ngoài cùng."

> Senior tip: quy ước của tôi: callback then* chỉ non-blocking; mọi IO đi qua supplyAsync(fn, ioExecutor) riêng; join/get chỉ ở tầng biên (controller, batch-finish). Thiết kế này giúp tránh "CF hell" và deadlock tự tạo chung commonPool.`,
  follow: [
    'thenApply vs thenApplyAsync — callback chạy trên thread nào từng trường hợp?',
    'Đặt timeout cho chuỗi CF nhiều step: làm thế nào?'
  ],
  tags: ['CompletableFuture', 'async', 'ForkJoinPool'],
  refs: [
    { type: 'doc', title: 'CompletableFuture API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html' },
    { type: 'doc', title: 'ForkJoinPool API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html' },
  ]
},
{
  id: 'concurrency-006',
  topic: 'concurrency',
  level: 'lead',
  q: 'Deadlock: 4 điều kiện cần là gì, phát hiện bằng thread dump ra sao, phòng tránh khi thiết kế thế nào? Phân biệt với livelock và starvation.',
  a: `**Tóm tắt:** deadlock chỉ xảy ra khi có đủ 4 điều kiện Coffman — mutual exclusion, hold-and-wait, no-preemption, circular wait; phá được một trong bốn là hết deadlock. Trên production phát hiện bằng thread dump: JVM tự in "Found one Java-level deadlock" kèm vòng chờ. Livelock: thread vẫn chạy nhưng không tiến được vì liên tục nhường/thử lại theo nhau. Starvation: một số thread mãi không được cấp tài nguyên vì bị chen hàng liên tục.

### Hiểu nhanh
Deadlock giống hai xe ô tô gặp nhau trên cây cầu một làn: mỗi xe đã chiếm nửa cầu và chờ xe kia lùi, không ai chịu lùi, kẹt mãi. Livelock giống hai người gặp nhau ở hành lang hẹp: cả hai cùng bước sang trái, rồi cùng bước sang phải... vẫn di chuyển nhưng không ai qua được. Starvation giống một người xếp hàng mà cứ có người "quen" chen lên trước: hàng vẫn chạy, chỉ có người đó mãi không tới lượt.

### Thuật ngữ
- **Coffman conditions**: 4 điều kiện cần (đặt theo tên Edward Coffman, 1971) để deadlock xảy ra.
- **Mutual exclusion**: mỗi tài nguyên tại một thời điểm chỉ một thread dùng.
- **Hold and wait**: đang giữ tài nguyên này mà đi xin thêm tài nguyên khác.
- **No preemption**: không ai tước được tài nguyên khỏi thread đang giữ.
- **Circular wait**: chuỗi chờ khép vòng (A chờ B, B chờ A).
- **Thread dump**: ảnh chụp stack trace của mọi thread tại một thời điểm ({{jstack}}, {{jcmd Thread.print}}).
- **Lock ordering**: quy ước mọi nơi đều lấy lock theo cùng một thứ tự.
- **Open call**: gọi ra ngoài (callback, DB, mạng) khi không giữ lock nào.

### 4 điều kiện Coffman
1. **Mutual exclusion** — tài nguyên chỉ một thread dùng tại một thời điểm. Vì sao khó phá: lock sinh ra chính là để làm việc này.
2. **Hold and wait** — đang giữ 1 lock mà đi chờ lock khác. Phá bằng cách lấy mọi lock cần thiết cùng lúc, hoặc chỉ giữ một lock.
3. **No preemption** — không thể tước lock khỏi thread đang giữ. Phá bằng {{tryLock}} có timeout: chờ không được thì tự nhả.
4. **Circular wait** — vòng: A chờ B, B chờ A. Phá bằng lock ordering — cách bền vững nhất.

~~~text
Thread-A: giữ lock(acc#1) ---- chờ ----> lock(acc#2)
                ^                              |
                |                              v
Thread-B: chờ lock(acc#1) <---- giữ ---- lock(acc#2)
  => vòng khép kín: không ai nhả, không ai tiến
~~~

### Phát hiện bằng thread dump

~~~bash
jstack <pid> > dump-1.txt       # chụp 2-3 lần cách nhau vài giây
jcmd <pid> Thread.print -l      # thay thế jstack, -l in thêm thông tin lock j.u.c
~~~

~~~text
"Thread-A" waiting to lock <0x0a1b> (owned by "Thread-B")
"Thread-B" waiting to lock <0x9c2d> (owned by "Thread-A")
Found one Java-level deadlock: ...
~~~

1. Tìm dòng "Found one Java-level deadlock" ở cuối dump — JVM tự phát hiện vòng chờ.
2. Đọc từng thread: lock nào đang giữ ("locked <0x...>"), lock nào đang chờ ("waiting to lock <0x...>").
3. Ánh xạ về code qua stack trace để biết hai đoạn code nào lấy lock ngược thứ tự.
- ReentrantLock cũng được phát hiện vì AQS ghi nhận owner. Có thể kiểm tra bằng code: {{ThreadMXBean.findDeadlockedThreads()}}.
- Dump không báo deadlock mà service vẫn treo (chờ IO, chờ DB lock, chờ pool connection): so sánh nhiều dump — thread đứng nguyên cùng stack qua mọi lần chụp là nghi phạm.

### Phòng tránh — phá đúng 1 trong 4 điều kiện
- **Lock ordering**: mọi code lock theo cùng thứ tự (ví dụ theo entity id tăng dần) — phá circular wait, cách bền nhất.
- **tryLock + timeout**: chờ không được thì nhả hết lock đã giữ rồi retry (có backoff) — phá no-preemption.
- **Open calls**: không gọi callback/DB/network khi đang giữ lock.
- Giảm nested lock: một method một lock; dùng cấu trúc concurrent sẵn có.

~~~java
// Phá circular wait: luôn khóa hai account theo id tăng dần
Account a = from, b = to;
if (a.id > b.id) { Account t = a; a = b; b = t; }
synchronized (a) { synchronized (b) { transfer(from, to, amount); } }
~~~

### Livelock & starvation
- **Livelock**: hai bên retry liên tục và huỷ hành động của nhau — có hoạt động (CPU cao) nhưng không tiến triển; sửa bằng random backoff hoặc để một bên quyết.
- **Starvation**: writer liên tiếp thắng, reader đói mãi vì lock không fair (hoặc ngược lại); sửa bằng fair lock (đổi lấy throughput), quota, hoặc hàng đợi có thứ tự.

| | Deadlock | Livelock | Starvation |
|---|---|---|---|
| CPU | Thấp | Cao | Bình thường |
| Thread state | BLOCKED/WAITING mãi | RUNNABLE | Một số chờ lâu |
| Tiến triển | Không | Không | Có nhưng không công bằng |

### Lỗi hay gặp
- **Chuyển tiền A→B và B→A cùng lúc**, mỗi bên khoá tài khoản nguồn trước: triệu chứng là vài request treo vĩnh viễn dưới tải cao. Cách tránh: khoá theo id tăng dần.
- **Gọi listener/callback khi đang giữ lock**: callback lại lấy một lock khác của module khác → vòng chờ khó thấy. Cách tránh: copy dữ liệu ra, nhả lock, rồi mới gọi.
- **Deadlock giữa lock JVM và connection pool**: thread giữ lock rồi chờ connection, thread khác giữ connection rồi chờ lock. Dump không báo deadlock. Cách tránh: không lấy connection khi đang giữ lock.
- **Deadlock ở DB**: hai transaction cập nhật dòng theo thứ tự ngược nhau. Cách tránh: cập nhật theo thứ tự khoá chính cố định, transaction ngắn.

### Trả lời miệng 1 phút
"Deadlock cần đủ bốn điều kiện Coffman: mutual exclusion, hold and wait, no preemption và circular wait, nên chỉ cần phá một điều kiện. Cách tôi hay dùng nhất là lock ordering, ví dụ chuyển tiền thì luôn khoá tài khoản id nhỏ trước, để không bao giờ có vòng chờ; chỗ nào không áp được thứ tự thì dùng tryLock có timeout rồi nhả và retry. Trên production tôi chụp jstack hai ba lần, JVM sẽ in Found one Java-level deadlock; còn nếu treo mà không báo deadlock thì tìm thread đứng yên ở cùng stack qua nhiều dump. Livelock khác ở chỗ thread vẫn chạy, CPU cao mà không tiến; starvation là hệ thống vẫn chạy nhưng một số thread mãi không tới lượt."

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
  a: `**Tóm tắt:** virtual thread (JEP 444, chính thức từ Java 21) là thread do JVM quản lý chứ không phải thread của OS. JVM "gắn" (mount) nó lên một carrier thread — platform thread thuộc một ForkJoinPool riêng, số carrier mặc định ≈ số CPU. Khi virtual thread gặp blocking I/O, JVM cất stack của nó xuống heap, tháo ra (unmount) và trả carrier cho virtual thread khác. Vì rẻ nên có thể chạy hàng triệu task đồng thời. Pinning: trên Java 21, block bên trong khối {{synchronized}} (hoặc trong native call) khiến virtual thread không unmount được và giữ luôn carrier; JDK 24 (JEP 491) đã gỡ hạn chế này cho synchronized.

### Hiểu nhanh
Platform thread giống thuê một tài xế riêng cho mỗi khách: khách vào quán ăn 30 phút thì tài xế ngồi chờ ngoài xe, rất phí. Virtual thread giống một hãng taxi: khách xuống xe vào quán (chờ I/O) thì xe chạy đi đón khách khác; khi khách ăn xong, một chiếc xe bất kỳ tới đón tiếp. Số xe (carrier) chỉ bằng số CPU, nhưng phục vụ được hàng nghìn khách. Pinning là khi khách bắt tài xế "chờ tôi, không được đi đâu" — trên Java 21 đó là khi khách đang ở trong khối synchronized.

### Thuật ngữ
- **Platform thread**: thread Java truyền thống, ánh xạ 1-1 với thread của OS, stack cỡ MB.
- **Virtual thread**: thread nhẹ do JVM lập lịch, stack lưu trên heap và co giãn theo nhu cầu.
- **Carrier thread**: platform thread đang "chở" (chạy) một virtual thread.
- **Mount / unmount**: gắn virtual thread lên carrier để chạy / tháo ra khi nó phải chờ.
- **Continuation**: cấu trúc lưu trạng thái stack để tạm dừng rồi chạy tiếp ở đúng chỗ.
- **Pinning**: virtual thread bị dính chặt vào carrier, không unmount được khi block.
- **JFR (Java Flight Recorder)**: công cụ ghi sự kiện trong JVM với overhead thấp.
- **ScopedValue**: cách chia sẻ dữ liệu bất biến theo phạm vi code, thay thế ThreadLocal (chính thức từ JDK 25).

### Cơ chế (từng bước)
1. **Tạo**: {{Thread.ofVirtual().start(task)}} hoặc {{Executors.newVirtualThreadPerTaskExecutor()}}. Chỉ tốn vài trăm byte ban đầu, vì stack nằm trên heap dưới dạng continuation.
2. **Lập lịch**: scheduler là một ForkJoinPool riêng (không phải commonPool) chạy ở chế độ FIFO; nó mount virtual thread lên một carrier rảnh.
3. **Gặp blocking**: các điểm blocking của JDK (Socket, {{Thread.sleep}}, lock của {{java.util.concurrent}}, BlockingQueue...) được viết lại để khi virtual thread chờ, JVM chép các frame stack xuống heap và unmount. Vì sao: carrier được giải phóng để chạy virtual thread khác.
4. **Hết chờ**: I/O xong, virtual thread được đưa lại vào hàng chờ và mount lên một carrier bất kỳ (có thể khác carrier cũ), chạy tiếp từ đúng dòng đã dừng.
5. **Phong cách mới**: một virtual thread cho mỗi task, **KHÔNG pool** virtual thread — tạo mới rẻ hơn tái dùng.

~~~text
Carrier-1: [VT-1 chạy] -> VT-1 chờ DB (unmount) -> [VT-7 chạy] -> ...
Carrier-2: [VT-2 chạy] -> [VT-3 chạy] -> VT-1 quay lại (mount) ...
Heap:      stack VT-1 nằm đây trong lúc chờ DB
=> 8 carrier phục vụ 10.000 virtual thread chủ yếu đang chờ I/O
~~~

Ví dụ số: 10.000 request đồng thời, mỗi request chờ DB/HTTP 200 ms. Platform thread: cần ~10.000 thread × ~1 MB stack reserve, gần như chắc chắn chạm giới hạn. Virtual thread: 10.000 continuation nhỏ trên heap, chạy trên 8 carrier.

### Pinning
~~~java
synchronized (lock) {        // Java 21: block I/O trong khối này...
    api.call();              // => virtual thread bị pin vào carrier
}                            // carrier không thể giải phóng cho task khác
~~~
- **Java 21–23**: block trong synchronized (kể cả {{Object.wait()}}) hoặc trong native/foreign call khiến virtual thread không unmount → giữ carrier. Khi nhiều task cùng chạm khối đó, số task chạy song song sụp về đúng số carrier.
- **JDK 24+ (JEP 491)**: synchronized và Object.wait không còn pin; virtual thread unmount bình thường. Native call và foreign function vẫn pin.
- **Phát hiện**: JFR event {{jdk.VirtualThreadPinned}} (có từ Java 21, vẫn dùng được ở bản mới); flag {{-Djdk.tracePinnedThreads=full}} in stack chỗ bị pin trên Java 21–23 nhưng đã bị bỏ từ JDK 24.
- **Trên Java 21**: thay synchronized bằng ReentrantLock ở vùng có block I/O là biện pháp số một; đồng thời nâng thư viện (JDBC driver, HTTP client) lên bản đã bỏ synchronized ở đường I/O.

### Nên / không nên
- **Nên**: server nhiều kết nối đồng thời với blocking I/O; migrate code blocking cũ mà không muốn chuyển sang reactive; fan-out gọi hàng trăm call mỗi request. Spring Boot 3.2+ bật bằng {{spring.threads.virtual.enabled=true}}.
- **Không nên**: task CPU-bound (thread rẻ không tạo thêm core); code reactive đã chạy tốt; task giữ state lớn trong ThreadLocal.
- Virtual thread "rẻ" nhưng tài nguyên phía dưới thì không (DB pool, file descriptor, quota đối tác) — chỗ đó cần semaphore + rate limit.

### ThreadLocal & pool tài nguyên
- Không pool virtual thread → ThreadLocal được tạo mới cho mỗi task: MDC, security context tạo mới mỗi request, GC pressure tăng; object lớn giữ trong ThreadLocal nhân với hàng triệu task là dễ OOM. ScopedValue (preview ở Java 21, chính thức ở JDK 25) là hướng thay thế.
- Bottleneck thường chuyển sang pool JDBC: 10 connection = 10 task chạy DB song song, phần còn lại chờ. Điều đó là ĐÚNG — nhưng bạn phải tune pool JDBC trong giới hạn DB chịu được và đo chi tiết, chứ không phải "tăng pool vô hạn" là xong.

### Lỗi hay gặp
- **Pool virtual thread** (đưa vào FixedThreadPool hay tái dùng): mất lợi ích, còn rò ThreadLocal giữa task. Cách tránh: mỗi task một virtual thread mới; giới hạn bằng Semaphore.
- **Không giới hạn gì sau khi bật virtual thread**: triệu chứng là DB báo hết connection, đối tác trả 429, Hikari timeout hàng loạt. Cách tránh: Semaphore theo từng dependency.
- **Pinning trên Java 21**: triệu chứng là throughput thấp bất thường, thread dump thấy carrier đều đứng trong synchronized. Cách tránh: JFR VirtualThreadPinned, đổi sang ReentrantLock hoặc nâng lên JDK 24+.
- **Dùng virtual thread cho tính toán nặng**: không nhanh hơn, còn làm các task I/O bị chậm vì carrier bị chiếm. Cách tránh: tách pool CPU riêng.

### Trả lời miệng 1 phút
"Virtual thread là thread nhẹ do JVM quản lý: nó được mount lên một carrier thread, và khi gặp blocking I/O, JVM cất stack xuống heap, unmount, trả carrier cho việc khác. Nhờ vậy tôi viết code blocking bình thường mà vẫn phục vụ hàng chục nghìn request đồng thời với vài carrier. Điểm cần cẩn thận trên Java 21 là pinning: block bên trong synchronized hoặc native call sẽ giữ carrier, tôi phát hiện bằng JFR event VirtualThreadPinned và thay bằng ReentrantLock; từ JDK 24 synchronized đã hết pin. Virtual thread hợp với I/O-bound, không giúp CPU-bound, không nên pool, và vẫn phải giới hạn tài nguyên phía sau bằng semaphore hay connection pool."

> Senior tip: benchmark trước khi tin virtual threads: test tăng concurrent từ 100 lên 10k, đo p99 và connection pool; thường p99 phụ thuộc pool JDBC và giới hạn của DB nhiều hơn số thread. Khi đó việc cần làm là tune pool JDBC (trong sức chịu của DB) và đặt semaphore cho từng dependency, không phải thêm thread.`,
  follow: [
    'Phát hiện pinning của một service Java 21 trong production thế nào?',
    'Nên dùng virtual thread cho fan-out 1000 call mỗi request hay reactive stack?'
  ],
  tags: ['virtual threads', 'Java 21', 'pinning', 'ThreadLocal'],
  refs: [
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 491: Synchronize Virtual Threads without Pinning', url: 'https://openjdk.org/jeps/491' },
    { type: 'doc', title: 'Virtual Threads (Oracle JDK 21 guide)', url: 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html' },
  ]
},
{
  id: 'concurrency-008',
  topic: 'concurrency',
  level: 'mid',
  q: '{{ThreadLocal}} dùng khi nào? Vì sao nó gây memory leak trong thread pool và xử lý ra sao?',
  a: `**Tóm tắt:** {{ThreadLocal}} cho mỗi thread một bản dữ liệu riêng, hợp để mang ngữ cảnh theo request mà không phải truyền tham số qua mọi method: user context, transaction context, trace id trong MDC... Trong thread pool, thread sống rất lâu nên giá trị đã set không được giải phóng nếu không gọi {{remove()}} — gây rò rỉ heap; tệ hơn, task sau có thể đọc nhầm giá trị của task trước (lỗi bảo mật).

### Hiểu nhanh
Mỗi thread có một "ngăn kéo riêng". ThreadLocal là nhãn dán trên ngăn kéo: cùng một nhãn "currentUser" nhưng mỗi thread mở ra thấy đồ của mình. Vấn đề là trong thread pool, thread giống nhân viên ca kíp dùng chung bàn làm việc: nếu ca trước không dọn ngăn kéo, ca sau mở ra thấy giấy tờ của khách cũ — vừa chật chỗ (leak bộ nhớ) vừa lộ thông tin (leak dữ liệu). Quy tắc vàng: ai bỏ đồ vào ngăn kéo thì phải dọn ra trước khi kết thúc việc.

### Thuật ngữ
- **ThreadLocalMap**: bảng băm nằm bên trong mỗi object Thread, lưu các giá trị ThreadLocal của thread đó.
- **WeakReference (tham chiếu yếu)**: tham chiếu không giữ object sống; GC được phép thu hồi object nếu chỉ còn tham chiếu yếu.
- **Strong reference (tham chiếu mạnh)**: tham chiếu bình thường, giữ object sống.
- **Stale entry**: entry có key đã bị GC (null) nhưng value vẫn còn.
- **MDC (Mapped Diagnostic Context)**: map trong logging (SLF4J/Logback) để gắn requestId/userId vào mọi dòng log, cài đặt bằng ThreadLocal.
- **ClassLoader leak**: một object còn giữ tham chiếu khiến cả classloader của webapp không được thu hồi khi redeploy.
- **Metaspace**: vùng nhớ ngoài heap chứa metadata của class.
- **ScopedValue**: dữ liệu bất biến gắn với một phạm vi code, tự hết hạn khi ra khỏi phạm vi.

### Cơ chế (từng bước)
1. Mỗi Thread có field {{threadLocals}} kiểu ThreadLocalMap. Vì sao đặt trong Thread: đọc/ghi chỉ chạm vào dữ liệu của thread hiện tại nên không cần lock.
2. {{tl.set(v)}}: lấy map của thread hiện tại, ghi entry với key là **tham chiếu yếu** tới object ThreadLocal, value là **tham chiếu mạnh** tới v.
3. {{tl.get()}}: tra map của thread hiện tại theo key; chưa có thì gọi {{initialValue()}}.
4. Khi object ThreadLocal không còn ai dùng, key bị GC thành null nhưng value vẫn bị map giữ mạnh. Value chỉ được dọn **lười biếng** khi map tình cờ quét tới entry đó trong lần get/set sau.
5. Thread trong pool không bao giờ chết → map không bao giờ bị huỷ → value sống mãi. {{remove()}} là cách dọn chủ động duy nhất đáng tin cậy.

~~~text
Thread "http-nio-8080-exec-7" (sống suốt đời app)
  threadLocals: ThreadLocalMap
    [ key: weak -> ThreadLocal(userCtx) | value: STRONG -> UserContext(user=A, 2 MB) ]
Request A xong, quên remove()  -> Request B chạy trên cùng thread
  -> get() trả về UserContext của A  (rò dữ liệu)
  -> 200 thread x 2 MB = 400 MB nằm chết trong Old Gen (rò bộ nhớ)
~~~

### Leak trong pool
1. Task quên remove: giá trị nằm trong thread hàng giờ, hàng ngày, chiếm Old Gen.
2. **Leak dữ liệu giữa request**: task sau đọc nhầm MDC requestId/userId của task trước — lỗi bảo mật nghiêm trọng và không debug được qua stack trace.
3. Giá trị tham chiếu tới class của webapp (Tomcat) ⇒ WebappClassLoader không giải phóng khi redeploy → Metaspace leak.
4. Cache tĩnh + ThreadLocal = nhân bản dữ liệu theo số thread, footprint heap tăng gấp nhiều lần.

### Cách làm đúng

~~~java
try {
    MDC.put("requestId", reqId);
    chain.doFilter(req, resp);
} finally {
    MDC.clear();          // luôn dọn ở finally, kể cả khi có exception
}
~~~

- Quy ước: set — try/finally — remove trong cùng call stack; đặt set/remove ở filter/interceptor, không để từng method tự set.
- SimpleDateFormat mutable: bọc {{ThreadLocal.withInitial}} là cách tạm thời; Java 17/21 dùng {{DateTimeFormatter}} bất biến là xong — không cần ThreadLocal nữa.
- Truyền context sang thread khác (executor, @Async): ThreadLocal **không** tự đi theo; dùng TaskDecorator của Spring hoặc Micrometer Context Propagation để copy vào rồi dọn ra.
- ScopedValue (preview Java 21–24, chính thức JDK 25 qua JEP 506): giá trị gắn với scope nên tự hết hạn, không có remove để quên — hợp với virtual thread.

### Lỗi hay gặp
- **Quên remove trong filter tự viết**: triệu chứng là thỉnh thoảng log mang userId của người khác, hoặc user thấy dữ liệu của user khác. Cách tránh: luôn dọn trong finally.
- **Đọc ThreadLocal trong code chạy ở @Async/CompletableFuture**: triệu chứng là giá trị null (thread khác). Cách tránh: TaskDecorator/context propagation.
- **InheritableThreadLocal với pool**: giá trị chỉ được copy lúc **tạo** thread, nên thread pool cũ giữ giá trị của request đầu tiên. Cách tránh: không dùng InheritableThreadLocal với pool.
- **ThreadLocal chứa object lớn với virtual thread**: mỗi task một bản, hàng trăm nghìn task là hàng trăm nghìn bản. Cách tránh: giữ ThreadLocal nhỏ, hoặc chuyển ScopedValue.

### Trả lời miệng 1 phút
"ThreadLocal cho mỗi thread một bản giá trị riêng, tôi hay dùng cho context của request như MDC hay security context. Bên trong, mỗi Thread có một ThreadLocalMap, key là tham chiếu yếu tới ThreadLocal còn value là tham chiếu mạnh. Trong thread pool, thread sống suốt đời app nên nếu không remove thì value nằm mãi, vừa rò heap vừa có thể để request sau đọc nhầm dữ liệu của request trước, và trên Tomcat còn gây leak classloader khi redeploy. Vì vậy tôi luôn set ở filter và remove trong finally ở cùng chỗ. Với Java 21 và virtual thread, tôi giữ ThreadLocal thật nhỏ và hướng tới ScopedValue."

> Senior tip: một vụ "user A thấy data user B" gây ấn tượng cho tôi: MDC có userId của request trước bị giữ lại trong thread, một filter sau đó đọc MDC mà không set — 1 trong 10k request rơi vào trường hợp này. Sau đó team tôi review bắt buộc {{set(}} và {{remove}} phải đi cùng nhau trong cùng method.`,
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
  a: `**Tóm tắt:** CAS (compare-and-swap) là lệnh nguyên tử của CPU: "chỉ ghi giá trị mới nếu giá trị hiện tại vẫn đúng như tôi đã thấy" — nền tảng của lập trình lock-free. {{AtomicInteger}} dùng vòng lặp CAS cho {{incrementAndGet}}: thử, thất bại thì đọc lại và thử tiếp. ABA: giá trị đi A → B → A khiến CAS tưởng không có gì thay đổi; sửa bằng {{AtomicStampedReference}} (gắn kèm số phiên bản). {{LongAdder}} chống điểm nóng bằng cách chia counter thành nhiều cell và cộng lại khi đọc — throughput cao hơn nhiều khi tranh chấp mạnh, đổi lại {{sum()}} chỉ là giá trị xấp xỉ khi đang có thread cập nhật.

### Hiểu nhanh
CAS giống sửa một trang wiki: bạn mở trang thấy phiên bản 5, sửa xong bấm lưu, hệ thống chỉ chấp nhận nếu trang vẫn là phiên bản 5; ai đó đã lưu trước thì bạn phải tải lại và sửa lại. Không ai phải "khoá" trang. ABA là khi người khác sửa trang rồi hoàn tác về đúng nội dung cũ — bạn nhìn nội dung thấy giống hệt nên tưởng chưa ai đụng vào. LongAdder giống quầy thu ngân có nhiều máy đếm tiền: mỗi thu ngân đếm vào máy riêng, cuối ngày mới cộng tổng, thay vì cả chục người tranh nhau một máy.

### Thuật ngữ
- **CAS (compare-and-swap)**: lệnh so sánh-rồi-ghi nguyên tử ở mức phần cứng.
- **Lock-free**: thuật toán bảo đảm luôn có ít nhất một thread tiến triển, không dùng khoá.
- **CAS loop / spin**: vòng lặp thử CAS cho tới khi thành công.
- **ABA problem**: giá trị bị đổi rồi đổi về như cũ, CAS không phát hiện được.
- **Stamp / version**: số đếm tăng mỗi lần thay đổi, dùng kèm giá trị để phát hiện ABA.
- **Cache line**: khối 64 byte mà CPU đồng bộ giữa các core.
- **Cache line bouncing**: một cache line bị chuyền qua lại giữa các core vì nhiều core cùng ghi.
- **AQS**: khung đồng bộ của JDK (nền ReentrantLock, Semaphore) dùng CAS để đổi state.

### CAS trong JVM (từng bước)

~~~java
public final int incrementAndGet() {
    int cur;
    do {
        cur = get();                            // 1. đọc giá trị hiện tại (volatile read)
    } while (!compareAndSet(cur, cur + 1));     // 2. CAS; fail => có thread khác vừa đổi => thử lại
    return cur + 1;
}
~~~
(Đây là cách hiểu; JDK thật gọi thẳng {{Unsafe.getAndAddInt}}, trên x86 thường thành một lệnh {{lock xadd}}.)

1. Đọc giá trị hiện tại của field volatile. Vì sao volatile: để luôn thấy giá trị mới nhất và để CAS có ngữ nghĩa happens-before.
2. Tính giá trị mới ở biến cục bộ.
3. Gọi CAS: CPU khoá cache line trong tích tắc, so sánh, ghi nếu khớp.
4. Thất bại nghĩa là thread khác thắng → quay lại bước 1. Không ai bị "ngủ", nên không có context switch.

- CAS compile thành lệnh {{lock cmpxchg}} trên x86 hoặc cặp ldxr/stxr (hoặc lệnh CAS của ARMv8.1 LSE) trên ARM — nguyên tử phần cứng, không cần mutex.
- Nhiều cấu trúc JDK xây trên CAS: AtomicXxx, AQS (nền ReentrantLock/Semaphore), ConcurrentHashMap khi chèn node vào bucket rỗng...

### Vấn đề ABA
CAS chỉ kiểm "bằng hay khác", không biết lịch sử. Lỗi kinh điển trên lock-free stack:

~~~text
Thread 1: đọc head = A (A.next = B), định CAS head: A -> B
Thread 2: pop A, pop B, push lại node A   (head: A -> B -> A)
Thread 1: CAS(head, A, B) THÀNH CÔNG — nhưng B đã bị pop, stack hỏng
~~~

Cách sửa:
- {{AtomicStampedReference}}: CAS trên cặp (reference, stamp); stamp tăng mỗi lần đổi nên A(stamp 1) khác A(stamp 3).
- {{AtomicMarkableReference}}: biến thể chỉ có một bit đánh dấu.
- Trong Java, GC giữ object sống khi còn tham chiếu nên ít gặp ABA hơn C/C++ (không thể "tái sử dụng địa chỉ" khi còn ai giữ); ABA chủ yếu xuất hiện khi tự quản lý object pool, node reuse, off-heap/direct buffer, hoặc khi CAS trên **giá trị số** (số dư 100 → 50 → 100).
- Cách khác: gắn version number vào record (giống optimistic locking ở DB), hoặc quay lại dùng lock cho phần phức tạp.

### LongAdder vs AtomicLong

| | AtomicLong | LongAdder |
|---|---|---|
| Cơ chế | 1 volatile long + CAS | base + mảng Cell, thread chọn cell theo hash |
| Tranh chấp cao | CAS liên tục fail, CPU đốt vòng lặp | mỗi thread CAS cell riêng, ít fail |
| sum() | chính xác tại một thời điểm | xấp xỉ khi thread khác đang update |
| API | incrementAndGet, compareAndSet... | increment, add, sum, sumThenReset (không có CAS) |
| Bộ nhớ | 8 byte | lớn hơn (cell được đệm @Contended) |
| Dùng khi | cần giá trị chuẩn từng thời điểm, sinh ID | đếm metric, throughput cao |

Cơ chế LongAdder: không có tranh chấp thì CAS vào {{base}}; CAS fail thì tạo mảng Cell và mỗi thread cộng vào cell của mình; mảng có thể mở rộng tới cỡ số CPU. Các cell được đệm để nằm ở cache line khác nhau, tránh cache line bouncing.

Ví dụ số (cỡ độ lớn, tuỳ máy): 16 thread cùng tăng counter, AtomicLong có thể chậm hơn LongAdder vài lần đến hàng chục lần vì phần lớn CAS thất bại; với 1 thread thì hai cái tương đương.

### Lỗi hay gặp
- **Check-then-act với Atomic**: {{if (a.get() > 0) a.decrementAndGet()}} vẫn race. Cách tránh: dùng vòng CAS có điều kiện hoặc {{updateAndGet}}/{{accumulateAndGet}}.
- **Dùng LongAdder cho sinh ID/số thứ tự**: không có incrementAndGet nên không lấy được giá trị duy nhất. Cách tránh: AtomicLong.
- **Hàm truyền vào updateAndGet có side effect**: hàm có thể bị gọi nhiều lần khi CAS fail. Cách tránh: hàm thuần, không log/gọi API bên trong.
- **Vòng CAS tự viết trên dữ liệu nóng**: triệu chứng là CPU 100% nhưng throughput thấp. Cách tránh: LongAdder, hoặc giảm tranh chấp bằng cách chia nhỏ dữ liệu.

### Trả lời miệng 1 phút
"CAS là lệnh nguyên tử của CPU: chỉ ghi giá trị mới nếu giá trị hiện tại vẫn như mình đã đọc. AtomicInteger dùng nó trong vòng lặp: đọc, tính, CAS, thất bại thì thử lại, nên không có thread nào bị ngủ. Hạn chế đầu tiên là ABA: giá trị đổi rồi đổi về như cũ thì CAS không biết; tôi xử lý bằng AtomicStampedReference hoặc version number. Hạn chế thứ hai là khi tranh chấp cao, nhiều thread CAS cùng một cache line nên fail liên tục; LongAdder giải quyết bằng cách chia thành nhiều cell rồi cộng khi đọc. Nên metric thì tôi dùng LongAdder, còn giá trị cần chính xác từng thời điểm như sinh ID thì dùng AtomicLong."

> Senior tip: rule code review: counter cho metrics → LongAdder; giá trị chuẩn từng thời điểm (token bucket rate limiter, sinh ID) → AtomicLong. Trong async-profiler, nếu thấy vòng CAS của AtomicLong chiếm CPU khi tranh chấp cao — đó là chỗ LongAdder thay thế thoải mái.`,
  follow: [
    'CAS + volatility: vì sao field của {{AtomicInteger}} phải volatile?',
    'ABA trên máy có GC tham chiếu sống: vẫn là vấn đề thật?'
  ],
  tags: ['CAS', 'AtomicInteger', 'ABA', 'LongAdder'],
  refs: [
    { type: 'doc', title: 'AtomicInteger API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html' },
    { type: 'doc', title: 'LongAdder API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html' },
  ]
}
,
{
  id: 'concurrency-010',
  topic: 'concurrency',
  level: 'mid',
  q: 'Double-checked locking cho singleton: viết code đúng và giải thích vì sao bắt buộc phải có {{volatile}}.',
  a: `**Tóm tắt:** double-checked locking (DCL) chỉ vào {{synchronized}} ở lần gọi đầu tiên; những lần sau đọc field mà không cần khoá. Nếu field instance không {{volatile}}, JIT/CPU có thể làm cho thread khác thấy tham chiếu đã được gán **trước khi** constructor chạy xong; thread đó thấy instance khác null nhưng dùng một object "nửa xây" (field chưa khởi tạo). {{volatile}} cấm việc xếp lại này nhờ quan hệ happens-before giữa lần ghi và lần đọc field.

### Hiểu nhanh
Tưởng tượng xây nhà: thứ tự đúng là xây xong rồi mới treo biển số nhà. Nhưng đội thi công (JIT/CPU) được phép treo biển số trước cho nhanh, miễn là **chính họ** không bị ảnh hưởng. Người đưa thư (thread khác) thấy biển số là đi vào — và bước vào một ngôi nhà chưa có sàn. {{volatile}} giống quy định "chỉ được treo biển khi nhà đã xây xong và người đưa thư phải nhìn biển chính thức", nên ai thấy biển là chắc chắn nhà đã hoàn thiện.

### Thuật ngữ
- **Singleton**: class chỉ có đúng một instance trong ứng dụng.
- **Lazy initialization**: chỉ tạo object khi có người dùng lần đầu, không tạo sẵn.
- **Double-checked locking (DCL)**: kiểm tra null hai lần, một lần ngoài lock (nhanh) và một lần trong lock (an toàn).
- **Reordering**: JIT/CPU đổi thứ tự lệnh khi thấy không ảnh hưởng tới thread hiện tại.
- **Happens-before**: quy tắc của JMM bảo đảm thứ tự và khả năng nhìn thấy giữa các thread.
- **Holder idiom**: dùng class lồng static để JVM khởi tạo lazy và thread-safe.
- **Class initialization lock**: khoá JVM tự dùng để đảm bảo phần khởi tạo static của class chạy đúng một lần.

### Code đúng

~~~java
public class Db {
    private static volatile Db instance;   // volatile BẮT BUỘC

    public static Db getInstance() {
        Db r = instance;                   // đọc volatile 1 lần cho đường nóng
        if (r == null) {                   // check 1: không khoá
            synchronized (Db.class) {
                r = instance;              // check 2: đọc lại trong lock
                if (r == null) instance = r = new Db();
            }
        }
        return r;
    }
}
~~~
Biến cục bộ {{r}} giúp đường nóng chỉ đọc field volatile một lần (đọc volatile đắt hơn đọc biến cục bộ một chút).

### Vì sao thiếu volatile là sai (từng bước)
1. {{new Db()}} gồm 3 việc: (a) cấp phát bộ nhớ, field mặc định 0/null; (b) chạy constructor; (c) gán tham chiếu vào field {{instance}}.
2. Trong thread A, JIT chỉ cần đảm bảo kết quả **từ góc nhìn của A** không đổi, nên được phép để bước (c) hiển thị với thread khác trước (b).
3. Thread B vào check 1 (không lock), thấy {{instance != null}}, bỏ qua synchronized, trả về object — nhưng constructor chưa chạy xong, field vẫn là null/0.
4. B dùng object hỏng: NullPointerException hoặc cấu hình sai, chỉ xảy ra hiếm hoi, phụ thuộc CPU/JIT/scheduler, gần như không tái hiện được.
5. Khi thêm {{volatile}}: lệnh ghi volatile (c) không được đưa lên trước các lệnh ghi trong constructor, và thread B đọc volatile thấy tham chiếu thì chắc chắn thấy mọi field đã khởi tạo.

~~~text
Thread A (không volatile)          Thread B
cấp phát Db@1 (url = null)
instance = Db@1   <- hiện ra sớm
                                   instance != null -> return Db@1
                                   Db@1.url.length()  -> NPE!
chạy constructor: url = "jdbc:..."
~~~

### Phương án thay thế (khuyên dùng hơn)
- **Holder idiom** — tận dụng khoá khởi tạo class của JVM, không cần volatile:

~~~java
private static class Holder { static final Db INSTANCE = new Db(); }
public static Db getInstance() { return Holder.INSTANCE; }  // lazy + thread-safe
~~~
Vì sao đúng: class {{Holder}} chỉ được khởi tạo khi {{Holder.INSTANCE}} được đọc lần đầu; JVM đảm bảo việc khởi tạo chạy đúng một lần và kết quả được publish an toàn cho mọi thread.

- **{{enum}} singleton**: chống reflection + serialization miễn phí (Effective Java khuyên).
- Trong Spring app: bean singleton của container đã có lifecycle/scope đúng — đừng viết tay.

### Lỗi hay gặp
- **Quên volatile**: triệu chứng là NPE "không thể xảy ra" lâu lâu xuất hiện một lần, nhất là trên ARM. Cách tránh: volatile, hoặc dùng holder idiom.
- **Chỉ kiểm tra một lần bên ngoài lock** (bỏ check 2): hai thread cùng thấy null, cùng chờ lock, lần lượt tạo hai instance. Cách tránh: luôn kiểm tra lại trong lock.
- **synchronized cả method getInstance()**: đúng nhưng mọi lần gọi đều phải lấy lock. Cách tránh: holder idiom cho cả lazy lẫn nhanh.
- **Constructor nặng (gọi DB/mạng) trong holder**: lỗi một lần là class hỏng tới khi restart (ExceptionInInitializerError rồi NoClassDefFoundError). Cách tránh: không làm I/O trong khởi tạo static.

### Trả lời miệng 1 phút
"Double-checked locking kiểm tra null bên ngoài lock để đường nóng không phải khoá, rồi kiểm tra lại bên trong synchronized để chỉ tạo một instance. Field phải volatile vì new gồm cấp phát, chạy constructor và gán tham chiếu, và JIT hay CPU có thể làm thread khác thấy phép gán trước khi constructor xong; thread đó bỏ qua lock và dùng object nửa xây. volatile tạo happens-before giữa lần ghi và lần đọc nên ai thấy tham chiếu cũng thấy object đã khởi tạo đầy đủ. Tuy vậy trong thực tế tôi ưu tiên holder idiom hoặc enum vì JVM tự lo thread-safety, và trong Spring thì để container quản lý singleton."

> Senior tip: tôi coi "singleton tự viết bằng DCL" là code legacy cần review kỹ: 2 nhóm bug thường gặp là (1) quên volatile — bug "object nửa xây" rơi vào production không repro được, (2) holder nhưng class được load bởi 2 classloader khác nhau trong app server, nên thực tế có 2 "singleton".`,
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
  a: `**Tóm tắt:** {{CountDownLatch}} = chờ N việc xong (dùng một lần). {{CyclicBarrier}} = N worker chờ nhau tại một điểm hẹn, xong pha này qua pha khác, dùng lại được. {{Semaphore}} = giới hạn số thread được vào cùng lúc (giới hạn concurrency / tài nguyên — không phải rate limit theo thời gian). {{Phaser}} = barrier nhiều pha với số thành viên thay đổi linh hoạt.

### Hiểu nhanh
- **CountDownLatch** giống tên lửa đếm ngược: mỗi bộ phận kiểm tra xong thì đếm lùi một số, về 0 thì phóng; đã phóng thì không đếm lại.
- **CyclicBarrier** giống nhóm leo núi hẹn nhau ở mỗi trạm nghỉ: ai tới trước thì chờ, đủ người mới cùng đi tiếp chặng sau; trạm sau lại hẹn như vậy.
- **Semaphore** giống bãi đỗ xe có 5 chỗ: hết chỗ thì xe sau chờ ở barrier, có xe ra thì xe khác vào.
- **Phaser** giống nhóm leo núi mà thành viên có thể nhập đoàn hay rời đoàn ở bất kỳ trạm nào.

### Thuật ngữ
- **Party**: một thành viên tham gia barrier/phaser.
- **Permit**: một "vé vào" của Semaphore; acquire lấy vé, release trả vé.
- **Barrier action**: đoạn code chạy một lần khi đủ party tới điểm hẹn (trước khi cả nhóm đi tiếp).
- **Broken barrier**: trạng thái CyclicBarrier bị hỏng khi một party bị interrupt, timeout hoặc barrier action ném lỗi.
- **Fan-out / fan-in**: chia việc ra nhiều thread / gom kết quả về.
- **Rate limit**: giới hạn số lần mỗi đơn vị thời gian (ví dụ 100 call/giây) — khác với giới hạn số việc chạy cùng lúc.
- **AQS**: khung đồng bộ của JDK mà CountDownLatch và Semaphore xây trên đó.

### Cơ chế từng loại
1. **CountDownLatch(n)**: bên trong là một bộ đếm (state của AQS). {{countDown()}} giảm 1; {{await()}} chặn cho tới khi về 0. Về 0 rồi thì mọi await sau trả về ngay. Vì sao một lần: không có thao tác tăng lại, thiết kế để đơn giản và nhanh.
2. **CyclicBarrier(n, action)**: mỗi thread gọi {{await()}} thì chờ; thread thứ n tới sẽ chạy action rồi đánh thức cả nhóm, barrier tự reset cho pha sau. Vì sao "cyclic": nó dùng lại được qua nhiều vòng.
3. **Semaphore(k)**: có k permit. {{acquire()}} lấy một permit (hết thì chờ), {{release()}} trả lại. Không có khái niệm "chủ sở hữu": thread khác release được — khác với lock.
4. **Phaser**: {{register()}}/{{arriveAndDeregister()}} thay đổi số party giữa chừng; {{arriveAndAwaitAdvance()}} giống await của barrier; có số thứ tự pha.

~~~text
CountDownLatch(3):  T1 done(2) T2 done(1) T3 done(0) -> main.await() trả về
CyclicBarrier(3):   W1 chờ.. W2 chờ.. W3 tới -> action -> cả 3 sang pha 2 -> lặp lại
Semaphore(5):       [5 call đang chạy] call thứ 6 chờ -> 1 call xong, release -> call 6 vào
~~~

### Code mẫu từng loại

~~~java
// CountDownLatch: fan-out, chờ tất cả xong rồi tổng hợp
CountDownLatch done = new CountDownLatch(tasks.size());
for (var t : tasks) executor.submit(() -> {
    try { process(t); } finally { done.countDown(); }   // nhớ finally
});
boolean ok = done.await(30, TimeUnit.SECONDS);          // false nếu hết giờ

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
| Giới hạn số truy cập đồng thời vào tài nguyên ngoài | Semaphore |
| Số party thay đổi giữa các pha | Phaser |
| Fan-out/fan-in async có dữ liệu trả về | CompletableFuture.allOf |
| Giới hạn số call mỗi giây | Rate limiter (Resilience4j, Guava), không phải Semaphore |

Ví dụ số để phân biệt Semaphore và rate limit: Semaphore(5) với mỗi call 100 ms cho tối đa khoảng 50 call/giây; nếu call chỉ còn 10 ms thì thành 500 call/giây — Semaphore không giới hạn theo thời gian.

### Lỗi hay gặp
- **Quên countDown trong đường lỗi**: triệu chứng là await treo mãi khi một task ném exception. Cách tránh: countDown trong finally, luôn dùng await có timeout và kiểm tra giá trị trả về.
- **Semaphore release nhiều hơn acquire** (release trong finally dù acquire thất bại, hoặc release hai lần): số permit tăng dần, giới hạn mất tác dụng. Cách tránh: acquire **trước** try, release trong finally; với tryAcquire thì chỉ release khi trả về true.
- **CyclicBarrier bị broken**: một thread ném lỗi/timeout làm mọi thread đang chờ nhận BrokenBarrierException. Cách tránh: thiết kế reset/retry, hoặc chuyển sang Phaser.
- **Dùng CountDownLatch cho nhiều vòng**: latch không reset; vòng thứ hai await trả về ngay. Cách tránh: CyclicBarrier hoặc tạo latch mới mỗi vòng.

### Trả lời miệng 1 phút
"Bốn công cụ này đều là synchronizer của java.util.concurrent nhưng giải bốn bài khác nhau. CountDownLatch là chờ N việc xong, dùng một lần, tôi hay dùng để fan-out rồi đợi tất cả, luôn countDown trong finally và await có timeout. CyclicBarrier là nhóm worker chờ nhau tại mỗi pha, dùng lại được, có barrier action, nhưng một thread lỗi là cả barrier broken. Semaphore giới hạn số việc chạy đồng thời, ví dụ tối đa 5 call tới đối tác; nó không phải rate limit theo giây. Phaser dành cho nhiều pha với số thành viên thay đổi. Thực tế phần lớn nhu cầu chỉ là CountDownLatch hoặc CompletableFuture.allOf."

> Senior tip: 90% nhu cầu fan-out thực chiến chỉ là "đợi N việc xong" — CountDownLatch + await timeout là mẫu gọn nhất. Tôi có một lần duy nhất phải dùng Phaser: pipeline nhiều stage mà số worker thay đổi khi kết thúc từng stage — mạnh nhưng không đáng dùng mặc định.`,
  follow: [
    'CyclicBarrier "broken" xảy ra thế nào, xử lý ra sao?',
    'Khi nào CompletableFuture.allOf thay thế được CountDownLatch?'
  ],
  tags: ['CountDownLatch', 'CyclicBarrier', 'Semaphore', 'Phaser'],
  refs: [
    { type: 'doc', title: 'CountDownLatch API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html' },
    { type: 'doc', title: 'CyclicBarrier API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CyclicBarrier.html' },
    { type: 'doc', title: 'Semaphore API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html' },
    { type: 'doc', title: 'Phaser API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Phaser.html' },
  ]
},
{
  id: 'concurrency-012',
  topic: 'concurrency',
  level: 'lead',
  q: 'Thiết kế hệ thống xử lý song song 1 triệu record với giới hạn tốc độ (rate limit của API bên ngoài) và yêu cầu không mất dữ liệu. Bạn dựng kiến trúc thế nào?',
  a: `**Tóm tắt:** tôi tách bài toán thành 3 lớp: (1) **nguồn có checkpoint** (Kafka hoặc cursor trên bảng) để crash vẫn chạy tiếp được từ chỗ cũ; (2) **fan-out có kiểm soát**: queue bounded + giới hạn concurrency + rate limiter đúng theo quota API ngoài; (3) **ghi idempotent + DLQ** để đạt at-least-once mà hiệu ứng cuối cùng như exactly-once. Không dùng queue vô hạn; không suy ra quota từ số worker.

### Hiểu nhanh
Hãy hình dung bạn phải gửi 1 triệu lá thư qua một bưu cục chỉ nhận 100 lá mỗi giây. Bạn cần: một cuốn sổ ghi "đã gửi tới lá số bao nhiêu" (checkpoint) để mất điện vẫn biết làm tiếp từ đâu; một người gác cửa đếm đúng 100 lá/giây (rate limiter) thay vì để 250 nhân viên ùa vào; mỗi lá có mã riêng để bưu cục nhận trùng thì bỏ qua (idempotent); và một rổ "thư bị trả lại" (DLQ) để xem lại sau thay vì vứt đi.

### Thuật ngữ
- **Checkpoint / offset**: vị trí đã xử lý xong, lưu bền vững để chạy tiếp sau sự cố.
- **Rate limit / quota**: số request tối đa đối tác cho phép trong một đơn vị thời gian.
- **Token bucket**: thuật toán rate limit — "xô" được nạp token đều đặn, mỗi request lấy một token.
- **Idempotent**: thực hiện nhiều lần cho kết quả như một lần.
- **At-least-once**: mỗi record được xử lý ít nhất một lần (có thể trùng), không mất.
- **DLQ (Dead Letter Queue)**: nơi chứa record xử lý thất bại sau nhiều lần retry, để xem và xử lý lại.
- **Outbox pattern**: ghi sự kiện vào bảng outbox trong cùng transaction nghiệp vụ, một tiến trình khác gửi đi sau.
- **Jitter**: thêm độ trễ ngẫu nhiên để các client không retry cùng một lúc.

### Kiến trúc tổng thể

~~~text
Kafka topic (hoặc bảng job có cursor)
  -> Ingest worker: fetch batch nhỏ (vd 500), advance checkpoint sau khi batch được sink ack
  -> BoundedQueue (cap ~ 2x concurrency)
  -> Worker pool (virtual threads): mỗi worker 1 record
  -> Semaphore (concurrency) + Rate limiter (token bucket theo quota API) trước mỗi call ngoài
  -> Sink ghi idempotent theo key; lỗi đi DLQ
  -> Checkpoint store: advance sau khi cả batch commit
~~~

### 1) Nguồn — checkpoint bền vững
1. Kafka: offset do broker lưu, replay được; crash giữa chừng thì consumer đọc lại từ offset chưa commit — không mất dữ liệu (nhưng có thể xử lý trùng, nên bước 3 phải idempotent).
2. Batch job tự viết: lưu cursor (id cuối) trong bảng; đọc theo {{WHERE id > :cursor ORDER BY id LIMIT 500}}.
3. Commit checkpoint **sau khi** sink ack cả batch, không phải ngay khi đọc. Vì sao: commit lúc đọc mà crash trước khi ghi xong thì các record đó bị bỏ qua vĩnh viễn.

### 2) Concurrency + rate limit
1. **Đo quota thật** của API ngoài (tài liệu, header 429/Retry-After); không đoán. Dùng token bucket (Resilience4j RateLimiter hoặc Guava RateLimiter).
2. **Giới hạn concurrency theo Little's law**: concurrency ≈ quota (rps) × latency. Ví dụ 100 rps × 200 ms = 20 call đang bay ⇒ Semaphore(20). Vì sao cần cả hai: rate limiter chặn số call mỗi giây, semaphore chặn số call treo cùng lúc khi đối tác chậm đi.
3. **429/Retry-After**: worker tôn trọng Retry-After, thêm jitter để cả cụm không retry cùng lúc (stampede); sau 3 lần retry thì đẩy record sang topic retry/DLQ.

~~~text
// Ví dụ: 1.000.000 record, quota 100 rps, latency 200 ms
// => 20 call song song; rate limiter 100 rps chặn burst
// thời gian tối thiểu: 1.000.000 / 100 = 10.000 s ≈ 2,8 giờ (đây là trần cứng)
// record gặp 429: chờ Retry-After + jitter, max 3 lần rồi vào DLQ
~~~

### 3) Không mất dữ liệu
- Sink idempotent theo key nghiệp vụ (upsert / unique constraint / event id) — retry an toàn.
- DLQ cho record fail sau N lần retry, kèm alert; không có DLQ là cách âm thầm mất data.
- Outbox pattern khi cần atomic giữa DB và hệ thống ngoài: ghi bảng outbox cùng transaction nghiệp vụ, relay background gửi đi; crash thì replay outbox.
- Shutdown có kế hoạch: dừng nhận mới, chờ queue drain (có timeout), flush batch cuối, advance checkpoint, rồi mới tắt process.

### 4) Vận hành
- Metric: queue depth, in-flight count, rps thực tế so với quota, DLQ count, batch latency p99; alert khi DLQ tăng liên tục.
- Load test phá: burst 10x quota, kill -9 giữa batch — checkpoint phải nhảy lại đúng chỗ.
- Khi quota là trần cứng (2,8 giờ ở ví dụ trên mà SLA yêu cầu 1 giờ): chuyển sang batching nếu đối tác hỗ trợ — 1 call 500 record thay vì 500 call riêng lẻ — hoặc thương lượng quota.

### Lỗi hay gặp
- **"Rate limit" bằng sleep trong mỗi worker**: triệu chứng là rps thực tế = số worker × (1/sleep), vượt quota, 429 dồn dập. Cách tránh: một rate limiter dùng chung, đo rps thực tế trên dashboard.
- **Commit checkpoint trước khi ghi xong**: triệu chứng là thiếu record sau mỗi lần deploy/crash. Cách tránh: commit sau khi sink ack.
- **Sink không idempotent**: triệu chứng là bản ghi trùng (gửi 2 lần tiền, 2 email) sau mỗi lần replay. Cách tránh: unique key/upsert, lưu event id đã xử lý.
- **Retry ngay lập tức không jitter**: cả cụm cùng retry, đối tác càng quá tải. Cách tránh: exponential backoff + jitter, tôn trọng Retry-After.

### Trả lời miệng 1 phút
"Tôi chia thành ba lớp. Nguồn phải có checkpoint bền vững, Kafka offset hoặc cursor trong bảng, và tôi chỉ advance checkpoint sau khi cả batch đã ghi xong, nên crash thì chạy lại đúng chỗ. Ở giữa là fan-out có kiểm soát: queue bounded, semaphore giới hạn số call đang bay theo Little's law, và một rate limiter token bucket đặt đúng quota đối tác; gặp 429 thì retry theo Retry-After có jitter, quá ba lần thì vào DLQ. Đầu ra ghi idempotent theo key nghiệp vụ nên at-least-once vẫn cho kết quả như exactly-once. Cuối cùng là metric rps thực tế so với quota, DLQ và test kill giữa batch để chứng minh không mất dữ liệu."

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
  a: `**Tóm tắt:** structured concurrency (JEP 453, preview từ Java 21) coi một nhóm task song song là **một khối có ranh giới**: ra khỏi khối thì mọi subtask phải kết thúc; một subtask fail thì khối huỷ các subtask còn lại rồi báo lỗi. Nó sửa những điểm yếu của CompletableFuture: không huỷ dây chuyền, task "mồ côi" sống lâu hơn request, stack trace khó đọc. ScopedValue (JEP 446, preview ở Java 21; chính thức ở JDK 25) là dữ liệu bất biến gắn với một khối code, thay ThreadLocal ở chỗ truyền context theo request: tự hết hạn, không leak khi pool tái dùng thread, và kế thừa rẻ sang subtask.

### Hiểu nhanh
Hãy nghĩ tới một trưởng nhóm giao 3 việc cho 3 người rồi ngồi chờ ở phòng họp. Structured concurrency là luật: "không ai rời phòng họp khi việc còn dang dở; một người báo hỏng thì trưởng nhóm gọi hai người kia dừng tay". Với CompletableFuture, mỗi người tự đi làm, trưởng nhóm về rồi họ vẫn làm tiếp và chẳng ai bảo dừng. ScopedValue giống thẻ khách đeo cổ chỉ có hiệu lực trong toà nhà: ra khỏi cửa là thẻ tự hết hạn, không như ThreadLocal là chìa khoá bạn phải nhớ trả lại.

### Thuật ngữ
- **Structured concurrency**: nguyên tắc vòng đời của task con nằm trọn trong khối code đã tạo ra nó.
- **StructuredTaskScope**: API của JDK hiện thực nguyên tắc trên (fork, join, huỷ).
- **Subtask / fork**: task con được tạo bên trong scope.
- **Cancellation propagation (huỷ dây chuyền)**: một task lỗi thì các task liên quan tự động bị huỷ.
- **Orphan task (task mồ côi)**: task vẫn chạy dù bên gọi đã trả kết quả hoặc đã lỗi.
- **Preview feature**: tính năng chưa chính thức, phải bật {{--enable-preview}}, API có thể thay đổi.
- **ScopedValue**: giá trị bất biến được "gắn" (bind) trong phạm vi một lời gọi {{run}}/{{call}}.
- **Rebind**: gắn giá trị khác cho một phạm vi con nhỏ hơn.

### Vấn đề của CompletableFuture
1. **Callback chạy trên thread không kiểm soát** (executor/callback thread) — stack trace chỉ có các frame của framework, khó biết ai đã gọi.
2. **Không huỷ dây chuyền**: 1 task fail, các task còn lại vẫn chạy và ngốn tài nguyên; phải tự viết logic huỷ.
3. **Task mồ côi** sống lâu hơn request (không giới hạn vòng đời) — khó suy luận, có thể ghi dữ liệu sau khi request đã trả lỗi.
4. **Không có khối scope** — không có một điểm "tới đây thì tất cả phải xong".

~~~text
CompletableFuture:                 StructuredTaskScope:
request ──┬─ findUser   (lỗi!)     try (scope) {
          ├─ fetchOrder (vẫn chạy)   fork findUser   (lỗi!)
          └─ return lỗi              fork fetchOrder -> bị huỷ
fetchOrder chạy tiếp sau khi        join -> ném lỗi
request đã trả về (mồ côi)        } // ra khỏi khối: không còn subtask sống
~~~

### StructuredTaskScope (API Java 21–24)

~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var u = scope.fork(() -> findUser(id));     // mỗi fork là 1 virtual thread
    var o = scope.fork(() -> fetchOrder(id));

    scope.join().throwIfFailed();   // 1 con fail => huỷ con còn lại, ném lỗi
    return new Profile(u.get(), o.get());
}   // ra khỏi khối: không còn subtask nào sống
~~~

1. {{fork}} chạy subtask (mặc định trên virtual thread mới).
2. {{join}} chờ tới khi mọi subtask xong **hoặc** policy quyết định dừng.
3. Policy ShutdownOnFailure: subtask đầu tiên lỗi → scope shutdown → các subtask còn lại bị interrupt.
4. {{throwIfFailed()}} ném lỗi gốc; nếu không lỗi thì {{get()}} lấy kết quả.
5. try-with-resources đóng scope, đảm bảo không còn thread con nào sống.

- Hai policy có sẵn: ShutdownOnFailure (1 fail huỷ tất cả) và ShutdownOnSuccess (1 thành công là đủ, huỷ còn lại — hợp "đua lấy kết quả nhanh nhất" giữa nhiều replica).
- Huỷ hoạt động bằng interrupt, nên subtask phải phản ứng với interrupt (I/O của JDK trên virtual thread thì có).

### ScopedValues

~~~java
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

ScopedValue.where(CURRENT_USER, user)
           .run(() -> handleRequest(request));   // chỉ có giá trị bên trong run()

// ở sâu bên trong: CURRENT_USER.get() trả về user; ngoài run() thì không có binding
~~~

- Không có set/remove để quên: giá trị sống đúng trong scope rồi tự biến mất; không leak giữa các task trong pool.
- Bất biến; chỉ rebind cho scope nhỏ hơn.
- Subtask fork trong StructuredTaskScope kế thừa binding rẻ (chia sẻ, không copy), không tạo entry riêng cho từng thread như ThreadLocal/InheritableThreadLocal.
- Phiên bản: ScopedValue preview 21–24, chính thức ở JDK 25 (JEP 506); structured concurrency vẫn preview ở JDK 25 và API đổi ({{StructuredTaskScope.open()}} + Joiner thay ShutdownOnFailure/ShutdownOnSuccess). Trên JDK 21 production không bật preview: ThreadLocal + {{remove()}} trong filter vẫn là chuẩn an toàn.

### Lỗi hay gặp
- **Đưa API preview vào production rồi nâng JDK**: code không biên dịch được vì API đã đổi (như JDK 25). Cách tránh: cô lập phần dùng preview sau một lớp wrapper, hoặc chỉ dùng trên bản đã chính thức.
- **Gọi get() trước join()**: ném IllegalStateException. Cách tránh: luôn join (và throwIfFailed) trước.
- **Subtask nuốt InterruptedException**: huỷ không có tác dụng, scope chờ lâu. Cách tránh: khôi phục cờ interrupt hoặc ném tiếp.
- **Coi ScopedValue như biến có thể sửa**: không có set; muốn đổi thì rebind trong scope con.

### Trả lời miệng 1 phút
"Structured concurrency coi một nhóm task song song như một khối: fork các subtask, join, và khi ra khỏi khối thì chắc chắn không còn subtask nào chạy. Với ShutdownOnFailure, một subtask lỗi thì scope interrupt các subtask còn lại và ném lỗi, nên không có task mồ côi như với CompletableFuture, và stack trace đọc được vì mỗi subtask là một virtual thread bình thường. ScopedValue thay ThreadLocal cho context theo request: giá trị bất biến, chỉ có hiệu lực trong run, tự hết hạn nên không thể quên remove. Lưu ý phiên bản: ScopedValue chính thức từ JDK 25, structured concurrency vẫn preview và API đã đổi, nên trên Java 21 production tôi vẫn dùng ThreadLocal có remove."

> Senior tip: cách chia nhanh: CompletableFuture hợp với data flow compose nhiều bước; StructuredTaskScope hợp với mẫu "gọi N call, 1 fail huỷ còn lại, tổng hợp". Tôi áp nó cho fan-out 3-5 call: code giảm từ 40 dòng (CompletableFuture + AtomicBoolean huỷ tay) xuống 10 dòng, stack trace đọc dễ hẳn.`,
  follow: [
    'ShutdownOnFailure khác ShutdownOnSuccess ở use case nào?',
    'Vì sao ScopedValue khó leak hơn ThreadLocal trong thread pool?'
  ],
  tags: ['structured concurrency', 'ScopedValue', 'Java 21'],
  refs: [
    { type: 'doc', title: 'JEP 453: Structured Concurrency (Preview)', url: 'https://openjdk.org/jeps/453' },
    { type: 'doc', title: 'JEP 505: Structured Concurrency (Fifth Preview)', url: 'https://openjdk.org/jeps/505' },
    { type: 'doc', title: 'JEP 506: Scoped Values', url: 'https://openjdk.org/jeps/506' },
  ]
},
{
  id: 'concurrency-014',
  topic: 'concurrency',
  level: 'senior',
  q: 'ForkJoinPool và work stealing: cơ chế hoạt động, vì sao parallel stream dùng chung commonPool là nguy hiểm trên server?',
  a: `**Tóm tắt:** ForkJoinPool cho mỗi worker một deque riêng: worker push/pop task của mình ở một đầu (LIFO), worker rảnh thì "trộm" ở đầu còn lại của deque người khác (FIFO). Nhờ vậy gần như không có lock chung, rất hợp với bài toán chia để trị. {{ForkJoinPool.commonPool()}} là pool tĩnh dùng chung cả JVM, parallelism mặc định = số core − 1. Parallel stream và các hàm {{*Async}} của CompletableFuture không truyền executor đều chạy trên pool này, nên chỉ một đoạn code blocking (JDBC, HTTP) cũng đủ chiếm hết vài worker và làm chậm mọi tính năng khác đang dùng chung.

### Hiểu nhanh
Hãy hình dung một bếp có 4 đầu bếp, mỗi người có một chồng đĩa việc riêng. Ai cũng lấy việc ở **đỉnh** chồng của mình (việc vừa thêm, còn "nóng"). Người nào hết việc thì sang lấy trộm ở **đáy** chồng của người khác — chỗ đó thường là việc to nhất, trộm một lần được nhiều. Vì ít khi đụng tay nhau nên bếp gần như không cần "trưởng bếp phân việc" (lock chung). Còn commonPool là cái bếp **dùng chung của cả toà nhà**: chỉ cần một đầu bếp đứng chờ người giao hàng (I/O) là cả toà nhà thiếu người nấu.

### Thuật ngữ
- **ForkJoinPool**: thread pool chuyên cho bài chia để trị, mỗi worker có hàng đợi hai đầu riêng.
- **Deque (double-ended queue)**: hàng đợi lấy/thêm được ở cả hai đầu.
- **Work stealing**: worker rảnh lấy task từ deque của worker khác.
- **fork / join**: tách task con ra chạy song song / chờ lấy kết quả task con.
- **RecursiveTask / RecursiveAction**: task của ForkJoinPool có / không có kết quả trả về.
- **commonPool**: ForkJoinPool tĩnh dùng chung toàn JVM, parallelism mặc định = số core − 1.
- **managedBlock**: API để báo cho ForkJoinPool biết sắp block, cho phép pool bù thêm thread.
- **Parallelism**: số worker mà pool cố gắng giữ chạy song song.

~~~text
Worker-1 deque: [T8 T5 T1]  <- push/pop ở đầu phải (LIFO, task mới, nhỏ)
                 ^ đầu trái: Worker-3 rảnh trộm T1 (FIFO, task cũ, lớn)
Worker-2 deque: [T9 T6]
Worker-3 deque: [ ]  -> chọn ngẫu nhiên deque khác để steal
~~~

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

### Lỗi hay gặp
- **Gọi HTTP/JDBC trong {{parallelStream()}}**: triệu chứng là các API không liên quan cũng chậm, thread dump thấy {{ForkJoinPool.commonPool-worker-*}} đứng ở socket read. Cách tránh: executor I/O riêng có giới hạn, hoặc virtual thread + semaphore.
- **Ngưỡng tách task quá nhỏ** (ví dụ tách tới từng phần tử): chi phí tạo task lớn hơn việc thật, chậm hơn chạy tuần tự. Cách tránh: ngưỡng cỡ vài nghìn tới vài chục nghìn phần tử, đo bằng JMH.
- **Gọi {{left.join()}} trước khi tự tính nửa còn lại** (fork rồi join ngay): mất tính song song. Cách tránh: fork một nửa, compute nửa kia, rồi mới join.
- **Container 1–2 vCPU**: commonPool parallelism = 1, parallel stream không song song và CompletableFuture async tạo thread mới cho mỗi task. Cách tránh: truyền executor rõ ràng, đặt CPU request/limit hợp lý.

### Trả lời miệng 1 phút
"ForkJoinPool cho mỗi worker một deque riêng: worker lấy việc của mình ở một đầu theo LIFO để tận dụng cache, còn worker rảnh trộm ở đầu kia theo FIFO, thường được task lớn nên ít phải trộm lại; join không ngồi chờ mà chạy việc khác. Thiết kế này rất hợp chia để trị CPU-bound. Vấn đề là commonPool dùng chung cả JVM, chỉ có số core trừ một worker, và parallel stream lẫn supplyAsync không truyền executor đều chạy ở đó. Nếu ai đó gọi HTTP hay JDBC trong parallel stream thì worker kẹt chờ I/O và mọi tính năng khác đang dùng commonPool chậm theo. Vì vậy I/O tôi luôn đưa sang executor riêng hoặc virtual thread, parallel stream chỉ dành cho tính toán thuần trên dữ liệu lớn và phải đo trước."

> Senior tip: khi review code, tôi grep {{parallelStream}} và các lời gọi {{supplyAsync}} không truyền executor, vì đây là hai đường phổ biến nhất khiến việc rò vào commonPool. Hãy expose {{getActiveThreadCount()}} và {{getQueuedSubmissionCount()}} của commonPool thành metric: queue tăng dần trong giờ cao điểm là dấu hiệu có ai đó đang block trong pool.`,
  follow: [
    'Vì sao worker trộm task ở đầu FIFO của deque chứ không ở đầu LIFO?',
    'Bạn chọn ngưỡng tách task (threshold) cho RecursiveTask thế nào?',
    'ForkJoinPool.managedBlock dùng khi nào?'
  ],
  tags: ['ForkJoinPool', 'work stealing', 'commonPool', 'parallel stream'],
  refs: [
    { type: 'doc', title: 'ForkJoinPool API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html' },
    { type: 'doc', title: 'ForkJoinTask API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinTask.html' },
  ]
},
{
  id: 'concurrency-015',
  topic: 'concurrency',
  level: 'senior',
  q: 'Producer–consumer với {{BlockingQueue}}: backpressure, chọn bounded queue và chính sách khi queue đầy (reject, block, drop) — bạn quyết định thế nào?',
  a: `**Tóm tắt:** Producer–consumer phải dùng queue **có giới hạn**, vì queue không giới hạn chỉ đổi vấn đề "chậm" thành "OOM". Khi queue đầy có bốn lựa chọn: block producer ({{put}}), chờ có hạn ({{offer}} kèm timeout), từ chối ngay ({{offer}} trả false, trả 429/503 hoặc chuyển sang nơi lưu bền) và drop (chỉ cho dữ liệu được phép mất như metric). Cách chọn dựa trên hai câu hỏi: producer có được phép chậm lại không, và dữ liệu có được phép mất không.

### Hiểu nhanh
Producer–consumer giống một dây chuyền đóng gói: người bỏ hàng lên băng chuyền (producer) và người đóng thùng (consumer) làm với tốc độ khác nhau, băng chuyền ở giữa (queue) giúp hai bên không phải chờ nhau từng món. Nếu băng chuyền dài vô hạn, người bỏ hàng cứ bỏ mãi, hàng chất đống tới khi sập kho (OOM). Băng chuyền có độ dài giới hạn buộc ta phải quyết định khi đầy: bảo người bỏ hàng **đứng chờ** (block), **chờ một chút rồi thôi** (offer có timeout), **từ chối ngay** (reject), hay **vứt bớt** (drop). Tín hiệu "đầy rồi, chậm lại" đó gọi là backpressure.

### Thuật ngữ
- **Producer / consumer**: bên tạo việc / bên xử lý việc.
- **BlockingQueue**: queue thread-safe có thao tác chặn khi đầy (put) hoặc khi rỗng (take).
- **Bounded queue**: queue có sức chứa tối đa.
- **Backpressure**: cơ chế truyền tín hiệu quá tải ngược về phía producer.
- **Load shedding**: chủ động từ chối bớt việc để giữ hệ thống sống.
- **Poison pill**: một phần tử đặc biệt đưa vào queue để báo consumer dừng.
- **Little's Law**: số việc trong hệ thống = tốc độ xử lý × thời gian mỗi việc ở trong hệ thống.
- **Outbox table**: bảng lưu sự kiện trong cùng transaction nghiệp vụ, để gửi đi bền vững sau.

### Luồng xử lý khi queue đầy (từng bước)
1. Producer tạo việc với tốc độ 600 task/s, consumer chỉ xử lý 400 task/s → mỗi giây dư 200 task.
2. Queue bounded 200 phần tử đầy sau khoảng 1 giây.
3. Từ đây mỗi lần producer gửi việc, chính sách khi đầy quyết định: block (producer chậm lại còn 400/s), offer timeout (chờ vài chục ms rồi trả 503), reject ngay, hoặc drop.
4. Vì sao như vậy là tốt: quá tải lộ ra **ngay tại biên** dưới dạng 503/chậm lại có kiểm soát, thay vì latency tăng dần rồi OOM sau vài phút.

~~~text
Producer 600/s --> [ queue cap 200 ] --> Consumer 400/s
                       đầy sau ~1s
                 put()   : producer bị chặn, chạy ở 400/s
                 offer(t): chờ t, hết chỗ -> false -> trả 503
                 offer() : false ngay -> drop/đếm metric
~~~

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

### Lỗi hay gặp
- **Queue không truyền capacity** ({{new LinkedBlockingQueue<>()}}): triệu chứng là heap tăng đều trong giờ cao điểm, GC dày, p99 tăng rồi OOM. Cách tránh: luôn đặt capacity tính từ SLA.
- **Dùng put() trong thread HTTP**: triệu chứng là request treo vô thời hạn khi consumer chậm, thread Tomcat cạn. Cách tránh: offer có timeout, hết chỗ trả 429/503.
- **Drop dữ liệu quan trọng trong RAM**: mất giao dịch khi queue đầy hoặc pod restart. Cách tránh: ghi bền vững trước (outbox, Kafka).
- **Consumer không dừng được khi shutdown**: kẹt ở take(), pod bị SIGKILL. Cách tránh: poll có timeout + cờ dừng, hoặc poison pill, hoặc interrupt.

### Trả lời miệng 1 phút
"Producer–consumer tôi luôn dùng queue có giới hạn, vì queue vô hạn chỉ đổi vấn đề chậm thành OOM và task trong đó thường đã quá hạn từ lâu. Khi queue đầy có bốn lựa chọn: put để block producer, hợp với batch nội bộ; offer có timeout cho request online, hết chỗ thì trả 503 hoặc 429; offer trả false ngay để load shedding; và drop chỉ cho dữ liệu được phép mất như metric. Dữ liệu không được mất thì phải ghi bền vững trước, như outbox hay Kafka. Kích thước queue tôi tính bằng Little's Law từ thời gian chờ tối đa chấp nhận được, rồi theo dõi queue size và số lần reject để biết lúc nào phải scale consumer."

> Senior tip: kích thước queue là tham số SLA, không phải tham số hiệu năng. Tôi tính nó từ thời gian chờ tối đa chấp nhận được, rồi expose {{queue.size()}} và số lần reject thành metric. Alert khi queue liên tục trên 80%: đó là lúc phải scale consumer, không phải tăng queue.`,
  follow: [
    'Poison pill và interrupt: cách nào dừng consumer an toàn hơn?',
    'CallerRunsPolicy gây vấn đề gì khi caller là thread của Tomcat?',
    'Khi nào dùng SynchronousQueue thay vì queue có dung lượng?'
  ],
  tags: ['BlockingQueue', 'backpressure', 'bounded queue', 'producer-consumer'],
  refs: [
    { type: 'doc', title: 'BlockingQueue API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html' },
    { type: 'doc', title: 'ThreadPoolExecutor API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html' },
  ]
},
{
  id: 'concurrency-016',
  topic: 'concurrency',
  level: 'senior',
  q: 'Interrupt: {{InterruptedException}} xử lý đúng (khôi phục cờ), huỷ task, {{Future.cancel}} — bạn implement thế nào?',
  a: `**Tóm tắt:** Interrupt là cơ chế **hợp tác**: {{t.interrupt()}} chỉ bật một cờ. Thread đang bị chặn ở {{sleep}}, {{wait}}, {{join}}, {{BlockingQueue.take}}, {{Lock.lockInterruptibly}}... sẽ thoát ra bằng {{InterruptedException}}, và cờ bị xoá. Khi bắt được exception này chỉ có hai cách đúng: ném tiếp lên (khai báo throws), hoặc nếu không ném được thì gọi {{Thread.currentThread().interrupt()}} để khôi phục cờ rồi kết thúc công việc. {{Future.cancel(true)}} thực chất chỉ gửi interrupt tới thread đang chạy task; task không kiểm tra cờ thì vẫn chạy đến hết.

### Hiểu nhanh
Interrupt giống việc gõ cửa phòng và nói "anh dừng tay được rồi" chứ không phải phá cửa lôi người ra. Người đang ngủ (sleep/wait/take) sẽ bị đánh thức ngay và biết là có người gọi. Người đang cắm cúi làm việc thì phải **tự ngẩng lên kiểm tra** xem có ai gọi không. Nếu bạn nghe thấy tiếng gọi rồi lờ đi (nuốt exception), người quản lý bên ngoài (executor) tưởng bạn chưa được báo và đứng chờ mãi. Vì thế: nghe được mà chưa xử lý được thì phải "gõ cửa lại" cho người khác biết — đó là khôi phục cờ interrupt.

### Thuật ngữ
- **Interrupt flag (cờ interrupt)**: một biến boolean trong mỗi thread, {{interrupt()}} bật nó lên.
- **Cooperative cancellation (huỷ hợp tác)**: task tự kiểm tra yêu cầu dừng và tự dừng, không bị giết cưỡng bức.
- **Interruptible blocking**: điểm chặn sẽ thoát ra bằng InterruptedException khi thread bị interrupt.
- **Future**: đại diện cho kết quả của task chạy bất đồng bộ; có {{get}}, {{cancel}}, {{isDone}}.
- **CancellationException**: lỗi ném ra khi lấy kết quả của task đã bị huỷ.
- **Graceful shutdown**: tắt ứng dụng có trật tự: ngừng nhận việc, làm nốt hoặc dừng việc dang dở an toàn.
- **Checked exception**: exception bắt buộc phải khai báo {{throws}} hoặc bắt; InterruptedException là loại này.

### Luồng một lần huỷ task (từng bước)
1. Executor gọi {{future.cancel(true)}} hoặc {{shutdownNow()}} → gọi {{workerThread.interrupt()}}. Vì sao không giết thread: giết giữa chừng để lại lock và dữ liệu dở dang.
2. Cờ interrupt của worker bật lên.
3. Nếu worker đang ở {{queue.take()}} → JVM đánh thức, **xoá cờ**, ném InterruptedException.
4. Task bắt exception: khôi phục cờ ({{Thread.currentThread().interrupt()}}), dọn tài nguyên trong finally, return.
5. Executor thấy task kết thúc, thread được thu hồi; {{awaitTermination}} trả về true.

~~~text
cancel(true) --> interrupt() --> cờ = true
                     |
   đang take()/sleep()?  --yes--> InterruptedException (cờ bị xoá)
                     |                  -> catch: interrupt() lại + dọn dẹp + thoát
                     no (đang tính toán)
                     -> task phải tự kiểm tra isInterrupted() sau mỗi vòng/lô
~~~

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

### Lỗi hay gặp
- **Bắt {{InterruptedException}} rồi chỉ log** và chạy tiếp: triệu chứng là shutdown treo tới khi pod bị kill sau 30 giây. Cách tránh: ném lại hoặc khôi phục cờ rồi thoát.
- **Vòng lặp tính toán không kiểm tra cờ**: {{cancel(true)}} không có tác dụng, CPU vẫn 100% sau khi huỷ. Cách tránh: kiểm tra {{isInterrupted()}} sau mỗi lô.
- **Dùng {{Thread.interrupted()}} để "xem thử"**: cờ bị xoá, tầng trên không còn biết. Cách tránh: dùng {{isInterrupted()}} khi chỉ muốn đọc.
- **Đọc socket kiểu cũ không timeout**: interrupt không đánh thức, thread treo mãi. Cách tránh: đặt read timeout, hoặc đóng socket từ thread khác.

### Trả lời miệng 1 phút
"Interrupt trong Java là cơ chế hợp tác: interrupt chỉ bật một cờ, thread đang chặn ở sleep, wait, join, take hay lockInterruptibly sẽ thoát ra bằng InterruptedException và cờ bị xoá; còn code đang tính toán phải tự kiểm tra isInterrupted. Khi bắt InterruptedException tôi chỉ có hai lựa chọn đúng: khai báo throws để ném tiếp, hoặc nếu đang trong Runnable thì gọi Thread.currentThread().interrupt để khôi phục cờ rồi thoát, nếu không thì shutdownNow sẽ không có tác dụng. Future.cancel(true) thực chất chỉ interrupt thread đang chạy task, còn CompletableFuture.cancel thì không interrupt gì cả. Với job dài, tôi kiểm tra cờ sau mỗi batch và commit theo batch để dừng nhanh mà dữ liệu vẫn nhất quán."

> Senior tip: trong code review tôi grep {{catch (InterruptedException}}: mọi chỗ phải ném lại hoặc có {{Thread.currentThread().interrupt()}}. Với job đối soát chạy hàng giờ, tôi kiểm tra cờ interrupt sau mỗi batch 1.000 bản ghi và commit theo batch. Nhờ vậy khi deploy, {{shutdownNow()}} dừng được job trong vài giây mà dữ liệu vẫn nhất quán.`,
  follow: [
    'Task đang đọc socket bằng InputStream không phản ứng với interrupt — bạn dừng nó thế nào?',
    'Vì sao CompletableFuture.cancel(true) không interrupt được task?',
    'Thread.interrupted() khác isInterrupted() ở điểm nào?'
  ],
  tags: ['interrupt', 'InterruptedException', 'Future.cancel', 'shutdown'],
  refs: [
    { type: 'doc', title: 'ExecutorService API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html' },
    { type: 'doc', title: 'Future API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ]
},
{
  id: 'concurrency-017',
  topic: 'concurrency',
  level: 'mid',
  q: '{{wait/notify}} vs {{Condition}}: spurious wakeup là gì, vì sao luôn kiểm tra điều kiện trong vòng lặp?',
  a: `**Tóm tắt:** {{wait}}/{{notify}} gắn với monitor của một object và chỉ gọi được khi đang giữ {{synchronized}} trên chính object đó; mỗi monitor chỉ có **một** wait set. {{Condition}} (lấy từ {{Lock.newCondition()}}) cho phép một lock có nhiều hàng chờ riêng (notFull, notEmpty), và có thêm {{awaitUninterruptibly}}, {{awaitNanos}}, {{awaitUntil}}. Luôn chờ trong {{while}}, vì thread có thể thức dậy khi điều kiện chưa đúng: spurious wakeup (đặc tả cho phép), {{notifyAll}} đánh thức nhiều thread cùng lúc, hoặc một thread khác chen vào lấy mất trạng thái trước khi bạn giành lại được lock.

### Hiểu nhanh
Hãy nghĩ tới phòng chờ ở phòng khám. {{wait()}} là bệnh nhân ngồi xuống ghế chờ và **trả lại chìa khoá phòng khám** để người khác vào. {{notify()}} là y tá gọi "có chỗ rồi" — nhưng gọi không có nghĩa là bạn được vào ngay: bạn phải đứng dậy, giành lại chìa khoá, và có thể người khác đã nhanh chân vào trước. Vì thế khi đứng dậy bạn phải **nhìn lại xem còn chỗ không** (vòng while). wait/notify chỉ có **một phòng chờ chung** cho mọi loại bệnh nhân; Condition cho phép có nhiều phòng chờ riêng (phòng chờ "khám", phòng chờ "lấy thuốc") nên y tá gọi đúng người.

### Thuật ngữ
- **Monitor**: khoá gắn với mỗi object, dùng bởi synchronized, wait, notify.
- **Wait set**: tập các thread đang chờ trên một monitor sau khi gọi wait().
- **Condition**: hàng chờ gắn với một Lock, tạo bằng {{lock.newCondition()}}; có await/signal.
- **Spurious wakeup**: thread thức dậy dù không ai notify — đặc tả Java cho phép điều này.
- **Lost wakeup**: tín hiệu notify được gửi khi chưa ai chờ, nên thread chờ sau đó ngủ mãi.
- **Guarded wait**: mẫu "chờ trong vòng lặp cho tới khi điều kiện đúng".
- **Bounded buffer**: hàng đợi có sức chứa giới hạn, producer chờ khi đầy, consumer chờ khi rỗng.

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

### Lỗi hay gặp
- **Dùng {{if}} thay {{while}}**: triệu chứng là NoSuchElementException hoặc dữ liệu sai lâu lâu mới xuất hiện dưới tải. Cách tránh: luôn {{while (!condition) wait()}}.
- **notify() trên monitor có nhiều loại waiter**: đánh thức nhầm producer thay vì consumer, hệ thống thỉnh thoảng treo. Cách tránh: notifyAll(), hoặc Lock + nhiều Condition.
- **Sửa trạng thái ngoài synchronized rồi mới notify**: lost wakeup, thread chờ ngủ mãi. Cách tránh: kiểm tra và thay đổi trạng thái luôn trong cùng lock với wait/notify.
- **Gọi await() mà quên lock.unlock() trong finally**: lock kẹt vĩnh viễn khi có exception. Cách tránh: mẫu lock — try — finally unlock.

### Trả lời miệng 1 phút
"wait và notify gắn với monitor của một object, chỉ gọi được khi đang giữ synchronized trên object đó, và mỗi monitor chỉ có một wait set. Condition lấy từ Lock cho phép nhiều hàng chờ riêng, ví dụ notFull và notEmpty, nên signal đánh thức đúng loại thread, và còn có awaitNanos, awaitUntil, awaitUninterruptibly. Tôi luôn chờ trong vòng while vì thread có thể thức dậy khi điều kiện chưa đúng: spurious wakeup, notifyAll đánh thức nhiều thread, hoặc thread khác chen vào lấy mất trạng thái trước khi mình giành lại lock. Trong thực tế tôi hầu như không tự viết wait/notify mà dùng BlockingQueue, CountDownLatch hay Semaphore."

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

### Hiểu nhanh
Publish một object giống dán thông báo lên bảng tin công ty. Nếu bạn dán tờ giấy lên trước rồi mới viết nội dung, người đi ngang có thể đọc được một tờ trắng. "Publish an toàn" là các cách bảo đảm người đọc chỉ thấy tờ thông báo khi nội dung đã viết xong: dán qua bảng có kính khoá (lock), qua hộp thư chính thức (volatile, concurrent collection), hoặc in sẵn từ nhà in (static initializer). Riêng object **immutable** giống tờ thông báo được in xong mới mang ra — dán kiểu gì người đọc cũng thấy đủ nội dung, nhờ bảo đảm đặc biệt của field {{final}}.

### Thuật ngữ
- **Publish**: làm cho reference tới object nhìn thấy được từ thread khác.
- **Safe publication**: publish có happens-before giữa lúc khởi tạo xong và lúc thread khác đọc.
- **Data race**: hai thread truy cập cùng biến, có ít nhất một lần ghi, không có happens-before.
- **Immutable object**: object không đổi trạng thái sau khi constructor chạy xong.
- **Final field semantics / freeze**: bảo đảm của JMM rằng giá trị field final ở cuối constructor được mọi thread nhìn thấy.
- **this escape**: để lộ reference {{this}} ra ngoài khi constructor chưa chạy xong.
- **Defensive copy (copy phòng thủ)**: sao chép input/output mutable để bên ngoài không sửa được trạng thái bên trong.
- **Initialization safety**: tên gọi khác của bảo đảm dành cho field final.

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

### Lỗi hay gặp
- **Cache/config được nạp lại và gán vào field thường**: triệu chứng là thread khác thỉnh thoảng thấy config cũ, hoặc object có field null dù constructor đã gán. Cách tránh: field volatile hoặc AtomicReference giữ object immutable.
- **Đăng ký listener hoặc start thread trong constructor**: thread khác thấy object trước khi khởi tạo xong, field final cũng mất bảo đảm. Cách tránh: dùng factory method — tạo xong rồi mới đăng ký/start.
- **record chứa List rồi tưởng là immutable**: bên ngoài vẫn sửa được list, reader thấy trạng thái thay đổi giữa chừng. Cách tránh: {{List.copyOf}} trong compact constructor.
- **Chỉ test trên x86**: bug không xuất hiện ở máy dev, rồi lộ khi chạy trên Graviton/ARM. Cách tránh: lý luận bằng happens-before, kiểm tra bằng jcstress.

### Trả lời miệng 1 phút
"Publish là đưa reference của object cho thread khác. Nếu publish qua một field thường thì không có happens-before giữa các lệnh ghi trong constructor và lệnh đọc ở thread khác, nên thread kia có thể thấy reference khác null nhưng field vẫn là 0 hay null, nhất là trên ARM. Các cách publish an toàn là static initializer, volatile hoặc AtomicReference, lock, hoặc concurrent collection. Field final có bảo đảm riêng: nếu this không bị lộ trong constructor thì mọi thread thấy object đều thấy giá trị final đúng như lúc constructor xong. Vì vậy pattern tôi hay dùng là object immutable cộng một reference volatile: cập nhật bằng cách thay cả object, reader không cần lock."

> Senior tip: pattern tôi hay dùng cho config hay bảng tỷ giá đổi định kỳ là object immutable cộng một field {{volatile}} (hoặc AtomicReference) giữ bản hiện tại. Thread cập nhật tạo object mới rồi gán một lần. Reader không cần lock và không bao giờ thấy trạng thái lẫn giữa bản cũ và bản mới, vừa rẻ vừa đúng hơn nhiều so với đặt lock quanh một object mutable.`,
  follow: [
    'Để lộ this trong constructor: cho ví dụ thực tế và hậu quả?',
    'Vì sao lỗi publish không an toàn hiếm gặp trên x86 nhưng xuất hiện trên ARM?',
    'record có thực sự immutable không?'
  ],
  tags: ['safe publication', 'immutability', 'final', 'JMM'],
  refs: [
    { type: 'doc', title: 'JLS 17.4: Memory Model', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4' },
    { type: 'doc', title: 'JLS 17.5: final Field Semantics', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.5' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ]
},
{
  id: 'concurrency-019',
  topic: 'concurrency',
  level: 'lead',
  q: 'False sharing, cache line, {{@Contended}}: hiện tượng, phát hiện, khắc phục — đo bằng JMH thế nào?',
  a: `**Tóm tắt:** CPU đồng bộ cache theo đơn vị **cache line** (64 byte trên x86 và phần lớn ARM server). Khi hai thread ghi vào hai biến **khác nhau** nhưng nằm chung một line, mỗi lần ghi giao thức coherence (MESI) phải giành quyền sở hữu độc quyền line đó và vô hiệu hoá bản ở core kia. Line bị "chuyền qua lại" giữa các core, throughput giảm mạnh dù không có lock hay data race. Cách sửa là tách các biến ra những line khác nhau: {{@Contended}} (code ứng dụng phải chạy với {{-XX:-RestrictContended}}), padding, hoặc thiết kế để mỗi thread ghi vào vùng riêng như {{LongAdder}}. Đo bằng JMH với benchmark nhóm nhiều thread, kèm profiler {{perfnorm}} hoặc {{perf c2c}}.

### Hiểu nhanh
Hãy tưởng tượng hai người viết vào hai dòng khác nhau của **cùng một tờ giấy**, nhưng luật là mỗi lúc chỉ một người được cầm tờ giấy. Họ không hề viết đè lên nhau, vậy mà cứ phải chuyền tờ giấy qua lại liên tục, nên cả hai đều chậm. CPU cũng vậy: nó không đồng bộ từng biến mà đồng bộ cả "tờ giấy" 64 byte gọi là cache line. Hai biến nằm chung một line, mỗi biến do một thread ghi, là đủ để line bị chuyền qua lại giữa các core. Cách sửa là cho mỗi người một tờ giấy riêng (tách biến ra các line khác nhau).

### Thuật ngữ
- **Cache line**: đơn vị nhỏ nhất CPU chép giữa RAM và cache, thường 64 byte.
- **Cache coherence**: cơ chế giữ các bản copy trong cache của nhiều core nhất quán với nhau.
- **MESI**: giao thức coherence phổ biến, mỗi line ở một trong 4 trạng thái Modified, Exclusive, Shared, Invalid.
- **False sharing**: các thread ghi vào biến khác nhau nhưng chung cache line, gây tranh chấp phần cứng.
- **Padding**: chèn byte thừa để đẩy các biến sang cache line khác nhau.
- **@Contended**: annotation nội bộ của JDK yêu cầu JVM tự đệm quanh field/class.
- **JMH**: framework benchmark chính thức của OpenJDK, xử lý warm-up và tối ưu JIT để đo đúng.
- **perf c2c**: công cụ Linux phát hiện cache line bị chia sẻ giữa các core.

~~~text
Cache line 64 byte: [ requests (8B) | errors (8B) | ... ]
Core 1 ghi requests -> line ở Core 1 = Modified, ở Core 2 = Invalid
Core 2 ghi errors   -> kéo line về Core 2, Core 1 = Invalid
Core 1 ghi requests -> kéo line về lại ...   (ping-pong hàng triệu lần/giây)
Sau khi tách: [ requests | padding ... ]  [ errors | padding ... ]  -> mỗi core giữ line của mình
~~~

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

### Lỗi hay gặp
- **Mảng counter theo thread** ({{long[] counts}}, thread i ghi {{counts[i]}}): triệu chứng là thêm thread thì chậm hơn. Cách tránh: LongAdder, hoặc counter cục bộ trong thread rồi gộp cuối cùng.
- **Dùng @Contended mà quên {{-XX:-RestrictContended}}**: annotation bị bỏ qua âm thầm, không có cải thiện. Cách tránh: kiểm tra bố cục object bằng JOL (Java Object Layout) và benchmark lại.
- **Padding bằng field long thừa trong cùng class**: JVM sắp xếp lại field nên padding không nằm đúng chỗ. Cách tránh: padding qua kế thừa nhiều tầng, hoặc dùng thư viện đã làm sẵn (JCTools, Agrona).
- **Đo bằng System.nanoTime trong vòng lặp tự viết**: JIT loại bỏ code, kết quả vô nghĩa. Cách tránh: JMH với @Group và profiler perfnorm.

### Trả lời miệng 1 phút
"CPU đồng bộ cache theo cache line, thường 64 byte. False sharing là khi hai thread ghi vào hai biến khác nhau nhưng nằm chung một line: theo giao thức MESI, mỗi lần ghi phải giành quyền độc quyền và vô hiệu hoá bản ở core kia, nên line bị chuyền qua lại và throughput sụp dù không có lock hay data race. Tôi nghi tới nó khi thêm thread mà throughput không tăng, CPU cao và không thấy lock contention; xác nhận bằng perf c2c hoặc JMH với benchmark nhóm. Cách sửa là tách biến sang các line khác nhau bằng @Contended với cờ -XX:-RestrictContended, padding qua kế thừa, hoặc tốt nhất là đổi thiết kế như LongAdder để mỗi thread ghi vùng riêng."

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

### Hiểu nhanh
Tắt một executor giống đóng cửa một nhà hàng. {{shutdown()}} là treo biển "ngừng nhận khách": khách đang ăn và khách đã gọi món vẫn được phục vụ xong. {{shutdownNow()}} là bật đèn báo "đóng cửa ngay": huỷ các món chưa nấu, nhắc khách đang ăn đứng dậy (interrupt) — nhưng ai cố ngồi ăn tiếp thì vẫn ngồi. {{awaitTermination}} là quản lý đứng ở cửa chờ khách cuối cùng ra, tối đa bao lâu. Còn bẫy của ScheduledExecutorService giống một chiếc đồng hồ báo thức: chỉ cần một lần chuông bị lỗi là nó tự tắt hẳn, không báo cho ai.

### Thuật ngữ
- **Graceful shutdown**: tắt có trật tự, làm nốt việc đang dở trong thời gian cho phép.
- **ScheduledExecutorService**: executor chạy task sau một khoảng trễ hoặc lặp lại định kỳ.
- **scheduleAtFixedRate / scheduleWithFixedDelay**: lặp theo nhịp cố định tính từ lúc bắt đầu / tính từ lúc lần trước kết thúc.
- **ScheduledFuture**: future đại diện cho task định kỳ; giữ exception nếu task lỗi.
- **UncaughtExceptionHandler**: hàm xử lý exception không ai bắt làm chết thread.
- **terminationGracePeriodSeconds**: thời gian Kubernetes chờ pod tự tắt sau SIGTERM trước khi gửi SIGKILL.
- **SIGTERM / SIGKILL**: tín hiệu yêu cầu tắt (bắt được) / giết ngay (không bắt được).

### Trình tự tắt pod trên Kubernetes
~~~text
t=0s   kubelet gửi SIGTERM -> JVM chạy shutdown hook / Spring đóng context
t=0s   web server ngừng nhận request mới; executor.shutdown()
t=0..20s chờ request + task đang chạy xong (awaitTermination)
t=20s  hết kiên nhẫn: shutdownNow() -> interrupt worker
t=25s  vẫn chưa xong: log lỗi, để process thoát
t=30s  (grace period mặc định) kubelet gửi SIGKILL -> chết ngay, không dọn dẹp gì
~~~

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

### Lỗi hay gặp
- **Job định kỳ không có try/catch**: triệu chứng là job im lặng ngừng chạy sau một lỗi đầu tiên, không log, không alert. Cách tránh: try/catch bao toàn thân job + metric "lần chạy thành công gần nhất".
- **Gọi shutdown() mà không awaitTermination**: process thoát khi task còn dở, dữ liệu ghi một nửa. Cách tránh: quy trình hai pha như trên.
- **Tổng thời gian chờ dài hơn grace period**: pod bị SIGKILL giữa chừng. Cách tránh: tổng timeout nhỏ hơn {{terminationGracePeriodSeconds}}, hoặc tăng grace period.
- **Task nuốt InterruptedException**: shutdownNow không dừng được. Cách tránh: khôi phục cờ interrupt và thoát.

### Trả lời miệng 1 phút
"shutdown ngừng nhận task mới nhưng vẫn chạy hết task đang chạy và trong queue; shutdownNow ngừng nhận, trả về các task chưa chạy và interrupt các worker, task không hợp tác với interrupt thì vẫn chạy tiếp. Cả hai đều không chờ, nên tôi dùng quy trình hai pha: shutdown, awaitTermination có timeout, hết giờ thì shutdownNow rồi chờ thêm một chút, và tổng thời gian phải nhỏ hơn grace period của pod. Riêng ScheduledExecutorService, một lần chạy ném exception là các lần sau bị huỷ âm thầm, exception nằm trong ScheduledFuture và không ai log; vì vậy mọi job định kỳ của tôi đều có try/catch bao ngoài, log, metric, và alert khi quá vài chu kỳ không có lần chạy thành công."

> Senior tip: kiểu incident hay gặp: job đồng bộ tỷ giá chạy mỗi phút, một lần API đối tác trả JSON lỗi gây NullPointerException, job ngừng chạy cả tuần cho tới khi khách khiếu nại tỷ giá cũ. Từ đó tôi bắt buộc mọi job định kỳ có try/catch bao ngoài và metric "lần chạy thành công gần nhất", alert khi quá 3 chu kỳ không cập nhật. Alert dựa trên "không có lần thành công" bắt được cả job chết lẫn job treo.`,
  follow: [
    'Task bỏ qua interrupt khi shutdownNow — bạn làm gì để pod vẫn tắt đúng hạn?',
    'scheduleAtFixedRate và scheduleWithFixedDelay khác nhau thế nào khi một lần chạy bị chậm?'
  ],
  tags: ['shutdown', 'shutdownNow', 'awaitTermination', 'ScheduledExecutorService'],
  refs: [
    { type: 'doc', title: 'ExecutorService API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html' },
    { type: 'doc', title: 'ScheduledThreadPoolExecutor API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledThreadPoolExecutor.html' },
  ]
},
{
  id: 'jvm-001',
  topic: 'jvm',
  level: 'senior',
  q: 'Liệt kê các vùng nhớ JVM (heap young/old, metaspace, stack, code cache, direct memory) và cho biết vấn đề ở vùng nào sinh ra triệu chứng gì.',
  a: `**Tóm tắt:** Bộ nhớ của một process Java chia thành nhiều vùng: **heap** (young gồm Eden + 2 Survivor, và old) chứa object do code tạo ra; **metaspace** là native memory chứa metadata của class; **mỗi thread một stack** chứa các frame method; **code cache** chứa mã máy do JIT sinh ra; **direct memory** cho NIO {{ByteBuffer}} nằm ngoài heap. Đọc triệu chứng là đoán được vùng: OOM "Java heap space" = heap; OOM "Metaspace" = quá nhiều class hoặc classloader leak; "unable to create native thread" = thread/stack/giới hạn OS; RSS cao hơn Xmx nhiều = native (direct buffer, metaspace, code cache...).

### Hiểu nhanh
Hãy hình dung JVM như một văn phòng. **Heap** là kho hàng chung, nơi mọi người để đồ (object); có khu "hàng mới về" (young) dọn rất thường xuyên và khu "hàng lưu lâu" (old) dọn ít hơn. **Stack** là cái bàn làm việc riêng của từng nhân viên (thread): giấy tờ đang xử lý dở nằm trên bàn, xong việc là dọn ngay. **Metaspace** là tủ hồ sơ mô tả "loại hàng" (class). **Code cache** là sổ tay ghi các thao tác đã được tối ưu sẵn để làm nhanh hơn. **Direct memory** là kho thuê ngoài, không nằm trong kho chính nên quản lý kho chính (GC) không nhìn thấy trực tiếp. Kho nào đầy thì báo lỗi khác nhau, nên đọc đúng thông báo là biết kho nào có vấn đề.

### Thuật ngữ
- **Heap**: vùng nhớ dùng chung mọi thread, nơi {{new}} cấp phát object, do GC quản lý; giới hạn bằng {{-Xmx}}.
- **Eden / Survivor**: Eden là nơi object mới sinh ra; Survivor là hai vùng nhỏ giữ object sống sót qua young GC.
- **Old gen**: nơi chứa object sống lâu, được "promote" từ young lên.
- **Metaspace**: native memory (ngoài heap) chứa metadata class, thay cho PermGen từ Java 8.
- **Native memory**: bộ nhớ process xin trực tiếp từ OS, không nằm trong heap Java.
- **RSS**: Resident Set Size, lượng RAM thật process đang chiếm, con số mà Kubernetes dùng để quyết định OOMKill.
- **JIT**: trình biên dịch lúc chạy, dịch bytecode nóng thành mã máy và cất vào code cache.
- **Direct buffer**: {{ByteBuffer.allocateDirect}}, vùng nhớ ngoài heap để I/O không phải copy qua lại.

### Bảng tổng hợp

| Vùng | Chứa gì | Triệu chứng khi vấn đề |
|---|---|---|
| Heap: young (Eden + 2 Survivor) / old | object Java | OOM Java heap space; Full GC thường xuyên |
| Metaspace | metadata class/method | OOM Metaspace; tăng dần mỗi redeploy |
| Stack mỗi thread | frame method | StackOverflowError; "unable to create native thread" |
| Code cache | JIT code đã compile | "CodeCache is full" — JIT ngừng compile, CPU tăng |
| Direct memory | ByteBuffer.allocateDirect, Netty | OOM direct buffer memory; RSS cao hơn Xmx |

### Sơ đồ RSS của một process Java
~~~text
RSS (RAM thật của process, ví dụ 1.6 GB)
+-------------------------------------------+
| Heap (-Xmx1g)    [Eden|S0|S1|   Old     ] |  ~1.0 GB
| Metaspace + compressed class space        |  ~150 MB
| Thread stacks (200 thread, phần đã dùng)  |  ~100 MB
| Code cache (JIT)                          |  ~60 MB
| Direct buffers (Netty, NIO)               |  ~150 MB
| GC data structures, symbol, malloc...     |  ~140 MB
+-------------------------------------------+
=> RSS luôn lớn hơn Xmx; chênh vài trăm MB là bình thường
~~~

### Từng vùng hoạt động thế nào (và vì sao)
1. **Young gen**: object mới vào Eden. Khi Eden đầy, young GC (minor) copy object còn sống sang Survivor rồi xoá sạch Eden. Vì sao nhanh: phần lớn object chết trẻ, nên chỉ phải copy số ít còn sống.
2. **Old gen**: object sống qua vài lần minor GC được promote lên old. Old được dọn bằng major/mixed GC, chậm hơn vì nhiều object sống. Tỉ lệ young/old và tốc độ promote ảnh hưởng rõ tới throughput.
3. **Metaspace**: mỗi class được load sinh metadata ở đây. Giới hạn bằng {{-XX:MaxMetaspaceSize}}; không đặt thì trần chỉ là RAM, nên classloader leak có thể ăn hết memory của container.
4. **Stack**: mỗi platform thread có một stack ({{-Xss}}, mặc định 1 MB trên Linux x64; con số này là phần **reserve** địa chỉ, chỉ các trang thực sự dùng mới tốn RAM). 10.000 OS thread nghĩa là khoảng 10 GB địa chỉ reserve và rất nhiều tài nguyên kernel — một lý do virtual thread lưu stack của nó trên heap.
5. **Code cache**: có giới hạn ({{-XX:ReservedCodeCacheSize}}, mặc định 240 MB khi bật tiered compilation). Đầy thì JIT ngừng compile, code mới chạy bằng interpreter, hiệu năng rơi dần — service chạy lâu, nhiều code dễ gặp.
6. **Direct memory**: trần mặc định ({{-XX:MaxDirectMemorySize}}) bằng max heap. Netty và nhiều HTTP client dùng buffer direct để tránh copy, nên RSS luôn cao hơn Xmx một chút là bình thường.

### Cách phân loại khi có vấn đề
- OOM heap / RSS cao: bật {{-XX:+HeapDumpOnOutOfMemoryError}} cho hướng heap và {{-XX:NativeMemoryTracking=summary}} cho hướng native.
- Metaspace tăng dần theo mỗi lần redeploy: gần như chắc chắn classloader leak; mở Dominator Tree của heap dump tìm các WebappClassLoader cũ.
- "unable to create native thread": không phải thiếu heap — đếm số thread, kiểm tra stack size, {{ulimit -u}} và giới hạn pids của cgroup.

~~~bash
jcmd <pid> GC.heap_info                  # heap đang dùng bao nhiêu
jcmd <pid> VM.native_memory summary      # cần bật NMT lúc khởi động
jcmd <pid> VM.metaspace                  # chi tiết metaspace
~~~

### Lỗi hay gặp
- **Tăng Xmx để chữa mọi OOM**: triệu chứng là OOM Metaspace hoặc Direct buffer memory vẫn lặp lại, thậm chí pod bị OOMKilled sớm hơn vì heap lấn chỗ native. Cách tránh: đọc thông điệp sau dấu hai chấm trước khi đổi gì.
- **Nghĩ RSS = heap**: triệu chứng là pod 2 GB, Xmx 2 GB, bị OOMKilled (exit 137) mà log không có OutOfMemoryError. Cách tránh: chừa 25–40% limit cho native.
- **Thread pool không giới hạn**: triệu chứng là "unable to create native thread" dù heap còn trống. Cách tránh: pool có giới hạn, theo dõi metric số thread.
- **Không đặt trần Metaspace khi app sinh class động**: triệu chứng là RSS tăng dần qua nhiều ngày. Cách tránh: đặt {{MaxMetaspaceSize}} để lỗi lộ ra sớm và rõ ràng, rồi sửa gốc.

### Trả lời miệng 1 phút
"JVM có heap chia young và old để chứa object, metaspace chứa metadata class ở native memory, mỗi thread một stack, code cache cho mã JIT, và direct memory cho buffer NIO ngoài heap. Young dọn thường xuyên và rẻ vì đa số object chết trẻ, old dọn ít mà nặng hơn. Khi có sự cố tôi đọc thông điệp lỗi để khoanh vùng: Java heap space là heap, Metaspace thường là classloader leak, unable to create native thread là quá nhiều thread, còn RSS cao hơn Xmx là native. Trade-off quan trọng là trong container heap không được chiếm hết limit. Thực tế tôi luôn bật heap dump khi OOM và Native Memory Tracking, nhiều lần RSS tăng hoá ra do direct buffer chứ heap hoàn toàn sạch."

> Senior tip: luôn bật {{-XX:NativeMemoryTracking=summary}} ở môi trường quan trọng; so sánh {{jcmd VM.native_memory baseline}} rồi {{summary.diff}} trước khi kết luận "leak heap" — nhiều lần RSS tăng là native (direct buffer, metaspace) chứ heap vẫn trong sạch.`,
  follow: [
    'Metaspace khác PermGen (trước Java 8) thế nào, vì sao đổi?',
    'RSS lớn hơn Xmx — bạn điều tra bằng tool nào trước?'
  ],
  tags: ['heap', 'metaspace', 'direct memory', 'code cache'],
  refs: [
    { type: 'doc', title: 'Native Memory Tracking (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html' },
    { type: 'doc', title: 'The java Command (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
  ]
},
{
  id: 'jvm-002',
  topic: 'jvm',
  level: 'senior',
  q: 'So sánh các GC: Serial, Parallel, G1, ZGC, Shenandoah — cơ chế và tiêu chí chọn; G1 hoạt động ra sao (region, mixed GC)?',
  a: `**Tóm tắt:** Serial và Parallel dừng toàn bộ ứng dụng (stop-the-world) khi dọn; Serial dùng 1 thread cho máy nhỏ, Parallel dùng nhiều thread để tối đa throughput. G1 (mặc định từ Java 9) chia heap thành region và dọn từng phần, cân bằng giữa latency và throughput. ZGC (bản generational) và Shenandoah làm gần hết việc **đồng thời** với ứng dụng, pause dưới 1 ms kể cả heap lớn. Chọn theo mục tiêu: throughput → Parallel; cân bằng → G1; p99 thấp + heap to → ZGC.

### Hiểu nhanh
GC giống đội dọn vệ sinh trong một nhà hàng. **Serial**: một người dọn, nhà hàng đóng cửa khi dọn. **Parallel**: cả đội dọn cùng lúc, nhà hàng vẫn phải đóng cửa nhưng ngắn hơn. **G1**: chia nhà hàng thành nhiều ô bàn, mỗi lần chỉ đóng vài ô bẩn nhất để dọn nhanh, khách ở ô khác ảnh hưởng ít. **ZGC/Shenandoah**: nhân viên dọn **ngay trong lúc khách đang ăn**, chỉ xin khách dừng tay vài giây lẻ; đổi lại cần thêm nhân viên (CPU) chạy song song.

### Thuật ngữ
- **Stop-the-world (STW)**: mọi thread ứng dụng bị dừng trong lúc GC làm việc.
- **Throughput**: tỉ lệ thời gian CPU dành cho code ứng dụng thay vì GC.
- **Region**: ô nhớ kích thước bằng nhau mà G1 chia heap ra, mỗi ô đóng một vai trò (Eden, Survivor, Old, Humongous).
- **Humongous object**: object lớn từ nửa region trở lên, G1 cấp riêng một hoặc nhiều region liền nhau.
- **Concurrent marking**: đánh dấu object sống trong lúc ứng dụng vẫn chạy.
- **SATB (snapshot-at-the-beginning)**: kỹ thuật của G1 để không bỏ sót object khi đánh dấu đồng thời.
- **Barrier**: đoạn code nhỏ JIT chèn vào mỗi lần đọc/ghi reference để GC biết thay đổi.
- **IHOP**: ngưỡng chiếm dụng heap để G1 bắt đầu concurrent marking.

### Bảng so sánh

| GC | Cơ chế | Phù hợp heap | Mục tiêu |
|---|---|---|---|
| Serial | STW đầy đủ, 1 thread | nhỏ (dưới vài trăm MB) | app đơn giản/CLI, container rất nhỏ |
| Parallel | STW, nhiều thread song song | vừa tới lớn | throughput tối đa (mặc định ở JDK 8) |
| G1 | STW từng pha ngắn + marking đồng thời | trung – lớn (4–32 GB) | cân bằng latency |
| ZGC | concurrent, STW rất ngắn | lớn tới TB | pause dưới 1 ms |
| Shenandoah | concurrent, compaction đồng thời | lớn | pause thấp |

### G1 hoạt động ra sao (từng bước)
1. **Chia heap thành region** (ergonomics chọn 1–32 MB; JDK 18+ cho đặt tay tới 512 MB). Mỗi region được gán vai trò Eden / Survivor / Old / Humongous. Vì sao: dọn theo region cho phép mỗi lần chỉ xử lý một phần heap, nên pause ngắn và dự đoán được.
2. **Young GC**: khi các region Eden đầy, G1 dừng app (STW, nhiều thread) và copy object sống sang Survivor/Old. Nhanh vì chỉ đụng tới ít region và ít object sống.
3. **Concurrent marking**: khi old chiếm vượt IHOP ({{InitiatingHeapOccupancyPercent}}, mặc định 45%, và G1 tự điều chỉnh động — adaptive IHOP), G1 đánh dấu object sống song song với app, dùng SATB, rồi tính mỗi region còn bao nhiêu byte sống.
4. **Mixed GC**: các lần GC tiếp theo dọn young **cộng thêm** những region old ít object sống nhất (nhiều rác nhất — "garbage first"). Vì sao chọn region nhiều rác: copy ít mà thu hồi nhiều.
5. **Full GC** chỉ là phương án dự phòng khi các bước trên không theo kịp; thấy nó là có vấn đề.

~~~text
Heap G1 (mỗi ô là một region)
[E][E][S][O][O][H][H][ ][O][E][ ][O]
 E=Eden S=Survivor O=Old H=Humongous
Young GC : dọn tất cả E (+S)
Mixed GC : dọn E + vài O có ít object sống nhất
~~~

~~~bash
java -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -Xlog:gc* ...
# G1 tự điều chỉnh số region dọn mỗi lần để bám mục tiêu pause
# MaxGCPauseMillis (mặc định 200) là mục tiêu hướng dẫn, không phải cam kết cứng
~~~

### ZGC / Shenandoah
- **ZGC**: dùng colored pointers (bit màu trong con trỏ) + load barrier; marking, relocation và compaction đều chạy concurrent, STW chỉ còn vài pha rất ngắn. Java 21 có Generational ZGC ({{-XX:+UseZGC -XX:+ZGenerational}}, JEP 439) — tách young/old, throughput tốt hơn hẳn ZGC cũ; JDK 23 generational thành mặc định (JEP 474), JDK 24 bỏ hẳn chế độ non-generational (JEP 490), flag ZGenerational lỗi thời.
- **Shenandoah**: forwarding pointer + concurrent compaction; pause rất thấp. Có trong các bản OpenJDK build (Temurin, Corretto...), không có trong Oracle JDK. JDK 25 có chế độ generational ở dạng product (JEP 521).
- Giá chung: GC threads chạy song song **ăn CPU của app**, và barrier làm mỗi lần đọc/ghi reference đắt hơn chút.

### Khi nào chọn
- **Parallel**: batch job, ưu tiên throughput, pause vài trăm ms chấp nhận được.
- **G1**: mặc định cho đa số web/app heap trung tới lớn.
- **ZGC**: service nhạy latency (p99 dưới 10 ms), heap vài GB tới TB, Java 21+.
- **Serial**: container nhỏ (~512 MB), 1 core; JVM tự chọn Serial khi máy dưới 2 CPU hoặc dưới khoảng 1792 MB RAM.

### Lỗi hay gặp
- **Đặt MaxGCPauseMillis quá thấp (10 ms với G1)**: triệu chứng là young gen bị thu nhỏ, GC chạy liên tục, throughput tụt. Cách tránh: giữ mặc định, chỉ hạ sau khi đo.
- **Chuyển ZGC khi CPU đã sát trần**: triệu chứng là pause đẹp nhưng latency tổng tệ hơn vì app bị giành CPU. Cách tránh: kiểm tra CPU headroom ở peak.
- **Pod 1 vCPU âm thầm chạy SerialGC**: triệu chứng là pause dài bất ngờ. Cách tránh: ghi rõ {{-XX:+UseG1GC}} và kiểm tra log khởi động.
- **Copy flag CMS từ blog cũ**: CMS đã bị xoá ở JDK 14, JVM từ chối khởi động. Cách tránh: dọn flag khi nâng JDK.

### Trả lời miệng 1 phút
"Serial và Parallel là GC dừng cả ứng dụng, Parallel dùng nhiều thread nên hợp batch cần throughput. G1 là mặc định từ Java 9: chia heap thành region, young GC dọn Eden, khi old vượt ngưỡng IHOP thì marking đồng thời, sau đó mixed GC dọn thêm các region old nhiều rác nhất, nên pause ngắn và bám được mục tiêu MaxGCPauseMillis. ZGC và Shenandoah dùng barrier để làm gần hết việc song song với app, pause dưới một mili giây, từ JDK 21 có Generational ZGC và từ JDK 23 nó là mặc định của ZGC. Trade-off là ZGC tốn thêm CPU và barrier. Thực tế tôi giữ G1 cho đa số service, chỉ chuyển ZGC khi p99 bị GC chi phối và đã đo 24 giờ cho cả hai."

> Senior tip: nhảy ZGC vì "pause thấp" chưa chắc đúng: ZGC có overhead CPU concurrent và throughput có thể giảm so với G1 cùng heap; đo p99 và tổng throughput 24h cho cả hai collector trước khi quyết — latency và throughput là bài toán đổi chỗ, chọn trên số liệu.`,
  follow: [
    'mixed GC của G1 chọn region thế nào?',
    'Generational ZGC khác ZGC non-generation thế nào?'
  ],
  tags: ['G1', 'ZGC', 'Shenandoah', 'Parallel GC'],
  refs: [
    { type: 'doc', title: 'HotSpot Garbage Collection Tuning Guide (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' },
    { type: 'doc', title: 'JEP 439: Generational ZGC', url: 'https://openjdk.org/jeps/439' },
    { type: 'doc', title: 'JEP 379: Shenandoah (Production)', url: 'https://openjdk.org/jeps/379' },
  ]
}
,
{
  id: 'jvm-003',
  topic: 'jvm',
  level: 'senior',
  q: 'Tuning heap cho JVM chạy trong container (Kubernetes): vì sao không nên đặt Xmx bằng RAM limit của pod? {{-XX:MaxRAMPercentage}} hoạt động thế nào?',
  a: `**Tóm tắt:** RSS của JVM = heap + metaspace + stack mỗi thread + code cache + direct memory + native khác (cấu trúc GC, malloc). Đặt Xmx = RAM limit là dành hết chỗ cho heap, không chừa gì cho native — container bị kernel giết (OOMKilled, exit 137) dù heap chưa hề OOM. {{-XX:MaxRAMPercentage}} (mặc định 25%) đặt heap tối đa bằng một phần trăm memory limit mà JVM đọc từ cgroup, phần còn lại dành cho native; thực tế nên 50–75% tuỳ profile.

### Hiểu nhanh
Memory limit của pod giống một chiếc vali 2 kg của hãng bay. Heap chỉ là **một ngăn** trong vali; còn có ngăn đựng sạc (metaspace), ngăn đựng giấy tờ (thread stack), ngăn đựng đồ điện tử (direct buffer). Nếu bạn nhét riêng ngăn quần áo đã 2 kg thì cả vali chắc chắn vượt cân, và nhân viên (kernel) không hỏi han gì, cứ thế loại vali (OOMKill). MaxRAMPercentage là quy tắc "ngăn quần áo chỉ được chiếm 70% cân nặng vali".

### Thuật ngữ
- **Memory limit (Kubernetes)**: trần RAM của container, vượt là bị kernel giết.
- **cgroup**: cơ chế Linux giới hạn tài nguyên cho nhóm process; JVM đọc limit từ đây (hỗ trợ cả cgroup v1 và v2).
- **RSS**: RAM thật mà process chiếm, gồm heap và mọi vùng native.
- **OOMKilled / exit 137**: kernel gửi SIGKILL (128 + 9) vì container vượt limit; JVM không kịp in gì.
- **UseContainerSupport**: tính năng (bật mặc định từ Java 10, backport 8u191) để JVM nhìn limit của container thay vì RAM của cả node.
- **MaxRAMPercentage**: phần trăm limit dùng làm heap tối đa khi không đặt Xmx.
- **Direct buffer**: bộ nhớ ngoài heap dùng cho NIO/Netty.

### Vì sao Xmx = RAM limit là bẫy (từng bước)
1. Pod có limit 2 GB, ta đặt {{-Xmx2g}}. JVM tin là được dùng 2 GB cho heap, nên GC không vội dọn khi heap mới 1.7 GB.
2. Cùng lúc đó native vẫn tăng: metaspace ~150 MB, 200 thread stack, code cache, direct buffer của Netty.
3. Tổng RSS vượt 2 GB. Kernel không biết gì về "heap" — nó chỉ thấy process vượt limit và gửi SIGKILL.
4. Kết quả: không có OutOfMemoryError, không có heap dump, chỉ có event "OOMKilled" trong Kubernetes.

~~~text
RAM limit 2 GB, Xmx = 2 GB
heap dùng 1.7 GB (chưa OOM heap)
RSS = heap 1.7 GB + metaspace 150 MB
     + thread stacks + code cache + direct buffers
     => ~2.1 GB > limit => kernel OOMKill pod (exit 137)
~~~

OOMKilled khác OOM "Java heap space": không có exception trong log JVM, chỉ có kube event "OOMKilled". {{HeapDumpOnOutOfMemoryError}} vô dụng cho loại chết này vì JVM bị giết trước khi kịp làm gì.

### MaxRAMPercentage hoạt động thế nào
1. Khi khởi động, JVM đọc memory limit của container từ cgroup (nhờ {{UseContainerSupport}}).
2. Nếu không có {{-Xmx}}, heap tối đa = limit × MaxRAMPercentage / 100. Pod 1 GB với mặc định 25% chỉ được 256 MB heap — khá dè sẻn cho service nặng.
3. {{-XX:InitialRAMPercentage}} quyết định heap ban đầu; đặt bằng Max để lộ thiếu RAM ngay lúc khởi động.
4. Nếu đặt cả Xmx thì Xmx thắng, phần trăm bị bỏ qua.

~~~text
Pod limit 2048 MB, MaxRAMPercentage=65
heap tối đa  = 2048 x 0.65 ~ 1331 MB
chừa native  ~ 717 MB  (metaspace, stack, code cache, direct, GC, malloc)
~~~

- Thực hành: 50–75%, luôn kiểm tra heap% + native dự đoán dưới 100%.
- {{-XX:MaxDirectMemorySize}} giới hạn direct buffer; {{-XX:MaxMetaspaceSize}} giới hạn metaspace — hai mục native hay "phình" nhất nên có trần khi đã đo.
- {{-Xss256k}} khi có hàng nghìn platform thread: giảm phần địa chỉ reserve và giới hạn mức stack tối đa mỗi thread có thể chiếm. Lưu ý stack chỉ tốn RAM thật cho trang đã dùng, và stack nhỏ có thể gây StackOverflowError với call stack sâu (Spring/Hibernate) — chỉ giảm sau khi test.

### Kiểm tra JVM thực sự thấy gì
~~~bash
java -XX:MaxRAMPercentage=65 -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|UseContainerSupport"
jcmd <pid> VM.flags                 # flag đang chạy
kubectl describe pod <pod>          # Last State: OOMKilled, Exit Code 137
~~~

### Pitfall production
- Kube event OOMKilled lặp lại là dấu hiệu đầu tiên; đừng chỉ đọc log JVM.
- Heap nằm dưới limit không đồng nghĩa an toàn: RSS vẫn tăng theo native; alert theo memory của container (working set), không chỉ heap.
- Heap 65% thường là mức an toàn cho app Spring Boot/Netty vốn tốn native đáng kể.

### Lỗi hay gặp
- **Copy Xmx từ máy ảo cũ sang pod**: triệu chứng là pod restart liên tục với exit 137. Cách tránh: dùng MaxRAMPercentage thay cho Xmx cố định.
- **Để mặc định 25%**: triệu chứng là heap nhỏ, GC chạy dày, CPU cao dù pod còn thừa RAM. Cách tránh: đặt 60–70% rồi đo.
- **Request thấp hơn limit nhiều**: pod bị xếp lên node chật, dễ bị evict khi node thiếu RAM. Cách tránh: service quan trọng đặt request = limit.
- **Tăng limit mà không tìm gốc**: nếu native tăng do leak (thread, direct buffer) thì chỉ là chết chậm hơn. Cách tránh: bật NMT và so sánh theo thời gian.

### Trả lời miệng 1 phút
"Trong container, RSS của JVM không chỉ là heap mà còn metaspace, thread stack, code cache, direct buffer và cấu trúc của GC. Nếu đặt Xmx bằng memory limit thì heap được phép chiếm hết, native đẩy tổng vượt limit và kernel giết pod với exit 137, không có OutOfMemoryError hay heap dump nào. Vì vậy tôi không đặt Xmx cố định mà dùng MaxRAMPercentage: JVM đọc limit từ cgroup và lấy một phần trăm làm heap, mặc định 25% thì quá ít, tôi thường bắt đầu 60–65%. Trade-off là heap lớn hơn thì ít GC hơn nhưng ít chỗ cho native hơn. Kinh nghiệm của tôi là tăng dần theo RSS đo được lúc load test, kèm alert theo memory container chứ không chỉ heap."

> Senior tip: template tôi chia sẻ trong team: heap 65%, native 35% trong pod — chưa bị OOMKilled trong 2 năm. Tăng heap theo bước 50 → 60 → 65% sau khi đo RSS thật, không nhảy 75% ngay từ đầu.`,
  follow: [
    'OOMKilled (exit 137) khác OOM Java heap space thế nào?',
    'MaxRAMPercentage = 25% với pod 1 GB RAM là bao nhiêu MB heap?'
  ],
  tags: ['Kubernetes', 'MaxRAMPercentage', 'OOMKilled', 'container'],
  refs: [
    { type: 'doc', title: 'The java Command (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
    { type: 'doc', title: 'Kubernetes: Resource Management for Pods and Containers', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' },
  ]
},
{
  id: 'jvm-004',
  topic: 'jvm',
  level: 'senior',
  q: 'Các loại OutOfMemoryError và cách chẩn đoán từng loại (heap dump, MAT) như thế nào?',
  a: `**Tóm tắt:** OutOfMemoryError hay gặp: {{Java heap space}}, {{GC overhead limit exceeded}}, {{Metaspace}}, {{unable to create native thread}}, {{Direct buffer memory}}. Mỗi loại cạn một vùng nhớ khác nhau nên cần công cụ khác: heap dump + MAT cho heap; NMT cho native; đếm thread + ulimit cho native thread. Bật {{HeapDumpOnOutOfMemoryError}} từ đầu là bắt buộc, vì dump đúng lúc OOM là bằng chứng quý nhất.

### Hiểu nhanh
OutOfMemoryError giống đèn cảnh báo "hết" trên ô tô: có đèn hết xăng, hết dầu nhớt, hết nước làm mát. Cùng là "hết" nhưng đổ nhầm thứ thì xe vẫn hỏng. Thông điệp sau dấu hai chấm của OOM chính là chữ in trên đèn: nó cho biết hết **cái gì**. Heap dump giống hộp đen máy bay: chụp lại toàn bộ heap đúng lúc sự cố để sau này mổ xẻ, và MAT là phần mềm đọc hộp đen đó.

### Thuật ngữ
- **Heap dump (.hprof)**: ảnh chụp mọi object trong heap tại một thời điểm.
- **MAT (Eclipse Memory Analyzer)**: công cụ mở heap dump, tìm object giữ nhiều bộ nhớ nhất.
- **Shallow size**: kích thước của riêng một object.
- **Retained size**: lượng bộ nhớ được giải phóng nếu object đó biến mất (nó + mọi thứ chỉ nó giữ).
- **Dominator Tree**: cây cho biết object nào "độc quyền giữ" những object nào.
- **GC Roots**: điểm xuất phát của GC (static field, biến trên stack thread...), object đến được từ đây thì còn sống.
- **NMT (Native Memory Tracking)**: tính năng JVM theo dõi bộ nhớ ngoài heap theo hạng mục.
- **ulimit / cgroup pids**: giới hạn số process/thread mà OS cho phép.

### Bảng tổng hợp

| Error | Ý nghĩa | Công cụ |
|---|---|---|
| Java heap space | hết chỗ cấp phát object | heap dump → MAT (Leak Suspects, Dominator Tree) |
| GC overhead limit exceeded | GC chiếm ~98% thời gian mà giải phóng dưới 2% heap; chỉ Parallel GC ném lỗi này (G1/ZGC thì ra "Java heap space") | GC log + heap dump |
| Metaspace | metadata class vượt MaxMetaspaceSize | dump + đếm classloader; tăng theo redeploy = classloader leak |
| Unable to create native thread | OS từ chối tạo thread (ulimit, cgroup pids, hết RAM cho stack) | jstack đếm thread; ulimit -u; cgroup pids |
| Direct buffer memory | allocateDirect vượt MaxDirectMemorySize | NMT; kiểm Netty pool; tinh chỉnh cap |
| Requested array size exceeds VM limit | xin mảng lớn hơn giới hạn của JVM | tìm code tạo mảng cực lớn |

### Quy trình chẩn đoán (từng bước)
1. **Đọc thông điệp**: quyết định đi hướng heap hay native. Vì sao: tăng Xmx không giúp gì cho Metaspace hay native thread.
2. **Lấy bằng chứng**: dump tự động khi OOM, hoặc dump chủ động trên pod đã rút khỏi traffic.
3. **Mở MAT → Leak Suspects**: báo cáo nghi vấn tự động, điểm khởi đầu nhanh.
4. **Dominator Tree** sắp theo retained size: object giữ nhiều heap nhất nằm trên cùng.
5. **Path to GC Roots** (loại weak/soft): chỉ ra chuỗi tham chiếu nào đang giữ, từ đó tìm dòng code.
6. Với native: NMT {{baseline}} rồi {{summary.diff}} để biết hạng mục nào tăng.

~~~bash
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dumps ...
jcmd <pid> GC.heap_dump /tmp/dumps/heap.hprof    # dump chủ động (khuyên dùng)
jmap -dump:live,format=b,file=heap.hprof <pid>   # cách cũ, tương đương
~~~

~~~text
Ví dụ Dominator Tree:
Class Name                          Shallow   Retained
OrderCache (static INSTANCE)           24 B    1.2 GB   <- nghi phạm
  ConcurrentHashMap                    64 B    1.2 GB
    Node[]                           16 MB    1.2 GB
~~~
Retained khác shallow: bám theo retained mới tìm đúng gốc, vì kẻ giữ bộ nhớ thường có shallow size rất nhỏ.

### Pitfall
- OOM heap nhưng dump không thấy object to: có thể là đỉnh cấp phát một khối lớn liền kề (đọc cả file, buffer lớn) mà heap không đủ, hoặc object đã chết sau OOM; tìm qua stack trace của OOM và GC log.
- "Unable to create native thread" thường do executor tạo thread không giới hạn ({{newCachedThreadPool}}) — tìm xem executor nào sinh thread.
- "Direct buffer": giảm pool direct của Netty hoặc tăng MaxDirectMemorySize theo số đo của NMT.
- OOMKilled (exit 137) không phải OOME: không có heap dump, phải điều tra theo RSS.

### Lỗi hay gặp
- **Không bật HeapDumpOnOutOfMemoryError**: triệu chứng là sự cố xảy ra, restart xong không còn gì để điều tra. Cách tránh: bật từ ngày đầu.
- **HeapDumpPath trỏ vào filesystem tạm của container**: dump mất theo pod. Cách tránh: dùng volume bền, đủ chỗ bằng kích thước heap.
- **Catch OutOfMemoryError rồi chạy tiếp**: app hỏng ngầm. Cách tránh: {{-XX:+ExitOnOutOfMemoryError}} để restart sạch.
- **Đọc shallow size thay vì retained**: thấy toàn {{byte[]}} và {{String}} rồi bế tắc. Cách tránh: xem Dominator Tree và Path to GC Roots.

### Trả lời miệng 1 phút
"OutOfMemoryError có nhiều loại và thông điệp cho biết vùng nào cạn: Java heap space là heap, GC overhead limit exceeded là Parallel GC đang chạy gần như liên tục mà thu được rất ít, Metaspace thường do classloader leak, unable to create native thread là quá nhiều thread hoặc chạm ulimit, Direct buffer memory là bộ nhớ NIO ngoài heap. Với heap tôi lấy heap dump, mở MAT xem Leak Suspects, Dominator Tree theo retained size rồi Path to GC Roots để tìm ai đang giữ. Với native tôi dùng NMT và đếm thread. Trade-off là heap dump dừng JVM vài giây và file rất lớn, nên tôi dump trên pod đã rút traffic. Tôi luôn bật dump tự động khi OOM vì đó là bằng chứng đáng tin nhất."

> Senior tip: bật HeapDumpOnOutOfMemoryError ngay khi boot với HeapDumpPath đủ disk; dump có thể dừng JVM vài giây, nhưng đó là dump duy nhất đáng tin vì ở đúng trạng thái OOM — dump sau restart không có giá trị điều tra như vậy.`,
  follow: [
    'OOM "Java heap space" mà dump không thấy object to — bước tiếp theo?',
    'Vì sao JVM có message riêng "GC overhead limit exceeded"?'
  ],
  tags: ['OutOfMemoryError', 'MAT', 'heap dump'],
  refs: [
    { type: 'doc', title: 'Troubleshooting Memory Leaks (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html' },
    { type: 'doc', title: 'Eclipse Memory Analyzer (MAT)', url: 'https://eclipse.dev/mat/' },
  ]
},
{
  id: 'jvm-005',
  topic: 'jvm',
  level: 'senior',
  q: 'Memory leak trong Java: ví dụ thực tế thường gặp và cách tìm ra (heap dump, MAT)?',
  a: `**Tóm tắt:** Java có GC không có nghĩa là không leak: leak là object **không còn được dùng** nhưng **vẫn được tham chiếu** từ GC Roots, nên GC không được phép thu. Dạng phổ biến: cache static không eviction, listener không unregister, ThreadLocal trong thread pool, classloader leak khi redeploy, key mutable trong HashMap, resource không close. Quy trình chuẩn: xem xu hướng heap sau GC, dump 2 lần cách nhau, so sánh histogram, rồi MAT Dominator Tree + Path to GC Roots.

### Hiểu nhanh
GC giống người dọn nhà chỉ vứt những món **không ai nắm giữ**. Nếu bạn cột một món đồ cũ vào sợi dây buộc ở cột nhà (static field), người dọn sẽ không dám vứt, dù bạn chẳng bao giờ dùng nữa. Leak trong Java chính là hàng nghìn sợi dây bị quên như vậy: một Map static cứ thêm mà không xoá, một ThreadLocal không gỡ. GC làm đúng việc của nó; lỗi là do code vẫn "nắm" thứ không còn cần.

### Thuật ngữ
- **GC Roots**: điểm xuất phát mà GC coi là chắc chắn sống (static field, biến trên stack của thread đang chạy, JNI reference...).
- **Reachable**: đến được từ GC Roots qua chuỗi reference strong, nên GC không thu.
- **ThreadLocal**: biến riêng cho từng thread, lưu trong map của chính thread đó.
- **Classloader leak**: classloader cũ của ứng dụng không được thu sau redeploy, kéo theo toàn bộ class và static của nó.
- **Histogram**: bảng đếm số instance và tổng byte theo từng class trong heap.
- **Caffeine**: thư viện cache Java có giới hạn kích thước và thời gian sống.
- **CLOSE_WAIT**: trạng thái socket mà phía bên kia đã đóng nhưng ứng dụng mình chưa close.

### Dạng thực tế thường gặp
- **Static cache unbounded**: Map static put liên tục, không TTL/LRU — old gen tăng đều. Sửa: Caffeine với {{maximumSize}} + {{expireAfterWrite}}.
- **Listener không unregister**: đăng ký vào EventBus/cache nhưng khi component đóng không gỡ — mỗi lần tạo lại component, heap tăng thêm một tầng.
- **ThreadLocal trong pool**: {{set}} mà không {{remove}} — context (user, MDC) sống mãi theo thread của pool.
- **ClassLoader leak (Tomcat redeploy)**: JDBC driver đăng ký ở lần deploy 1 không deregister; ThreadLocal value tham chiếu class webapp ⇒ WebappClassLoader không được giải phóng.
- **Key mutable trong HashMap**: key bị sửa sau khi put ⇒ hashCode đổi, entry không tìm lại được nhưng vẫn nằm trong map (leak logic).
- **Resource không close**: Connection/InputStream trong nhánh exception không có finally — pool cạn connection, socket kẹt CLOSE_WAIT.

~~~java
// Leak kinh điển: ThreadLocal trong thread pool của Tomcat
private static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();

void handle(Request r) {
    CTX.set(load(r));          // thread của pool sống mãi
    try {
        process(r);
    } finally {
        CTX.remove();          // THIẾU dòng này => context cũ dính theo thread
    }
}
~~~

### Quy trình tìm (từng bước)
1. **Xem xu hướng heap sau GC**: old gen sau mỗi lần GC tăng đều tới OOM sau vài giờ/ngày là leak chậm; dao động lên xuống nhanh chỉ là burst. Vì sao xem "sau GC": trước GC heap đầy rác nên con số không nói lên gì.
2. **Heap dump 2 lần** cách nhau 30 phút đến 1 giờ; so sánh histogram (MAT Compare Basket hoặc {{jmap -histo}}) — class tăng đều là nghi phạm. Vì sao hai lần: một lần chỉ cho thấy "cái gì to", hai lần cho thấy "cái gì đang lớn lên".
3. **MAT Dominator Tree**: object có retained heap lớn nhất — phần lớn trường hợp bắt được static Map, cache, ThreadLocalMap, classloader.
4. **Path to GC Roots** (loại weak/soft): tìm chuỗi đang giữ object; từ tên field suy ra dòng code. Loại weak/soft vì chúng không ngăn GC thu.

~~~text
Old gen sau GC (MB)
1600 |                                 *     <- OOM sắp tới
1200 |                     *    *
 800 |          *    *
 400 |  *  *
     +----------------------------------- giờ
       leak: đường "sau GC" đi lên dạng bậc thang
~~~

~~~bash
jmap -dump:live,format=b,file=dump-1.hprof <pid>
jmap -histo <pid> | head -30
~~~

### Lỗi hay gặp
- **Kết luận leak chỉ vì heap cao**: heap dùng cao trước GC là bình thường. Cách tránh: chỉ nhìn đường old gen sau GC qua nhiều giờ.
- **Dump trên pod đang nhận traffic**: dump dừng JVM vài giây tới vài chục giây, gây timeout. Cách tránh: rút pod khỏi load balancer trước.
- **Dùng HashMap làm cache "tạm"**: triệu chứng là OOM sau vài tuần chạy. Cách tránh: mọi cache phải có giới hạn và metric hit/size.
- **Restart định kỳ để "chữa" leak**: che triệu chứng, leak vẫn nằm đó và nhanh hơn khi tải tăng. Cách tránh: tìm root bằng dump.

### Trả lời miệng 1 phút
"Trong Java, leak là object không còn dùng nhưng vẫn reachable từ GC Roots, nên GC không được thu. Hay gặp nhất là cache static không có giới hạn, ThreadLocal trong thread pool không remove, listener không gỡ, và classloader leak khi redeploy. Tôi điều tra bằng cách nhìn heap sau GC theo thời gian: đi lên dạng bậc thang là leak. Sau đó lấy hai heap dump cách nhau khoảng một giờ trên pod đã rút traffic, so sánh histogram để xem class nào tăng đều, rồi dùng Dominator Tree và Path to GC Roots trong MAT để tìm field đang giữ. Trade-off là dump tốn pause và đĩa. Sửa thì thường là thay Map bằng Caffeine có maximumSize hoặc thêm remove trong finally."

> Senior tip: thiết lập alarm theo xu hướng (so sánh heap sau full GC giữa hai thời điểm cách nhau 1 giờ) bắt được leak sớm hơn alert theo mốc cố định rất nhiều; Dominator Tree trong MAT là nơi tôi luôn mở đầu khi điều tra dump.`,
  follow: [
    'Path to GC Roots — exclude weak/soft references nghĩa gì, vì sao?',
    'Chụp heap dump trong production có rủi ro gì (pause, disk)?'
  ],
  tags: ['memory leak', 'MAT', 'heap dump'],
  refs: [
    { type: 'doc', title: 'Troubleshooting Memory Leaks (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html' },
    { type: 'doc', title: 'Eclipse Memory Analyzer (MAT)', url: 'https://eclipse.dev/mat/' },
  ]
}
,
{
  id: 'jvm-006',
  topic: 'jvm',
  level: 'lead',
  q: 'CPU 100% trên production: quy trình điều tra của bạn (top -H, jstack, async-profiler, JFR) như thế nào?',
  a: `**Tóm tắt:** Tìm thread đang đốt CPU: {{top -H -p PID}} lấy thread id nóng nhất → tìm nid tương ứng trong jstack (JDK 17 trở về trước in nid dạng hex nên phải đổi sang hex trước; các bản JDK mới hơn in nid thập phân — nhìn có tiền tố 0x hay không là biết), đọc frame đầu để biết hàm nóng. Cần phân tích sâu hơn thì dùng async-profiler (flame graph) hoặc JFR. Phải trả lời được: CPU bị đốt bởi code nghiệp vụ, JIT compiler, GC thread, hay native (TLS, nén).

### Hiểu nhanh
CPU 100% giống hoá đơn tiền điện tăng vọt. Đầu tiên bạn tìm **phòng nào** đang tốn điện (process), rồi **thiết bị nào** trong phòng (thread), rồi xem thiết bị đó đang làm gì (stack trace). jstack giống chụp một tấm ảnh: thấy ai đang làm gì đúng khoảnh khắc đó. async-profiler giống camera quay liên tục 30 giây rồi thống kê ai chiếm nhiều thời gian nhất — đáng tin hơn một tấm ảnh.

### Thuật ngữ
- **top -H**: lệnh Linux hiển thị từng thread của process kèm %CPU.
- **TID / nid**: id của thread ở tầng OS; jstack ghi nó là {{nid}}.
- **jstack**: công cụ in stack trace của mọi thread Java tại một thời điểm.
- **async-profiler**: profiler lấy mẫu, overhead thấp, thấy cả frame native và kernel.
- **Flame graph**: biểu đồ các stack được lấy mẫu; frame càng rộng càng chiếm nhiều sample.
- **JFR**: Java Flight Recorder, bộ ghi sự kiện tích hợp trong JDK.
- **Busy-wait**: vòng lặp liên tục kiểm tra điều kiện mà không ngủ, đốt CPU vô ích.
- **Megamorphic call**: lời gọi interface có quá nhiều implementation thực tế, JIT khó inline.

### Quy trình tiêu chuẩn (từng bước)
1. **Xác định process đốt CPU nhất** (top/htop). Vì sao: trên node có thể có sidecar, agent, không chắc là JVM.
2. **Lấy thread nóng nhất của process đó**:

~~~bash
top -H -p <pid>                          # threads, xem %CPU; giả sử TID nóng nhất là 4321
printf %x 4321                           # = 10e1 (JDK 17 trở về trước in nid hex)
jstack <pid> | grep -A 12 "nid=0x10e1"
jstack <pid> | grep -A 12 "nid=4321"     # JDK mới hơn: nid thập phân, kèm [4321] sau #N
~~~

Frame đầu của thread RUNNABLE thường chỉ ra method đang đốt CPU. Nên chụp 3 lần cách nhau vài giây: frame lặp lại ở cả 3 lần mới đáng tin.

3. **Phân loại nguyên nhân**: tên thread cho biết nhiều điều — "GC Thread#", "G1 Conc#" là GC (kiểm {{jstat -gcutil}} và GC log); "C2 CompilerThread" là JIT ({{-Xlog:jit*}}, {{-XX:+PrintCompilation}}); "http-nio-..." là code nghiệp vụ.
4. **Flame graph khi stack không đủ**:

~~~bash
asprof -d 30 -e cpu -f flame.html <pid>   # async-profiler 3.x (bản cũ: profiler.sh)
# frame rộng nhất (nhiều sample nhất) = chỗ đốt CPU nhiều nhất
# mặc định đã gồm cả native và kernel frame
~~~

5. **JFR** cho service nhạy trên prod: {{jcmd <pid> JFR.start duration=60s filename=cpu.jfr}}; phân tích bằng JDK Mission Control (Hot Methods, Allocation, Threads).

~~~text
top -H -p 1234
  PID   %CPU  COMMAND
  4321  98.7  http-nio-8080-e   -> code nghiệp vụ
  1250  12.0  C2 CompilerThre   -> JIT
  1240   3.1  GC Thread#0       -> GC
~~~

### Nguyên nhân thường gặp
- GC thread nóng → full GC liên tục, heap thiếu hoặc leak: đi hướng heap, không phải sửa thuật toán.
- JIT compiler thread nóng: thường chỉ trong vài phút sau deploy; kéo dài thì nghi code bị deoptimize rồi compile lại liên tục (polymorphism megamorphic, code cache đầy).
- Busy-wait trong code: spin-loop chờ, poll timeout 0 ms, retry không backoff.
- Regex catastrophic backtracking: thread kẹt trong {{java.util.regex.Pattern}}.
- Native: TLS handshake, nén/deflate — jstack không hiện native frame; async-profiler thấy được.

### Lỗi hay gặp
- **Quên đổi TID sang hex trên JDK 17**: grep không ra, tưởng thread không phải Java. Cách tránh: kiểm tra định dạng nid trong dump trước.
- **Chỉ chụp một jstack**: frame tình cờ, kết luận sai. Cách tránh: 3 lần, hoặc dùng profiler.
- **Restart ngay để "chữa cháy"**: mất toàn bộ bằng chứng. Cách tránh: chụp jstack và 30 giây profile trước khi restart.
- **Đổ lỗi GC mà không xem GC log**: tối ưu nhầm chỗ. Cách tránh: xem tên thread nóng và tỉ lệ thời gian GC.

### Trả lời miệng 1 phút
"Khi CPU 100%, tôi xác định process rồi dùng top -H để lấy thread đốt nhiều nhất, đổi TID sang hex nếu JDK 17 trở về trước, tìm nid đó trong jstack và đọc frame trên cùng; chụp vài lần để chắc. Tên thread cho tôi phân loại ngay: GC thread thì sang hướng heap và GC log, compiler thread thì là JIT, worker HTTP thì là code nghiệp vụ. Nếu stack chưa rõ, tôi chạy async-profiler 30 giây lấy flame graph, nó overhead thấp và thấy cả frame native. Trade-off: jstack rẻ nhưng chỉ là ảnh chụp, profiler chính xác hơn nhưng cần cài agent. Theo kinh nghiệm, CPU cao mà GC và JIT bình thường thì đa phần là busy-wait hoặc regex backtracking."

> Senior tip: tôi bắt đầu bằng async-profiler (lấy mẫu, không cần safepoint, an toàn trên prod) trước khi soi jstack tỉ mỉ; CPU 100% mà GC và JIT đều bình thường thì rất thường là busy-wait — tìm vòng while thiếu sleep/backoff trong review code.`,
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
  a: `**Tóm tắt:** Parent delegation: khi cần load class, một class loader **hỏi parent trước** (application → platform → bootstrap); parent không tìm thấy thì nó mới tự load. Mục đích: class lõi như {{java.lang.String}} chỉ load một lần từ JDK và code bên ngoài không thể giả mạo. ClassLoader leak: class của webapp bị giữ bởi tham chiếu static, ThreadLocal hoặc JDBC driver không deregister ⇒ WebappClassLoader cũ không được GC, metaspace phình sau mỗi lần redeploy.

### Hiểu nhanh
Hãy tưởng tượng một công ty có ba cấp: nhân viên (application loader), trưởng phòng (platform loader), giám đốc (bootstrap). Khi cần một tài liệu, nhân viên luôn hỏi lên trên trước: "Sếp có bản chính thức chưa?". Chỉ khi cấp trên nói không có, nhân viên mới tự soạn. Nhờ vậy không ai trong công ty tự in một "quy chế công ty" giả. ClassLoader leak giống một nhân viên đã nghỉ việc (webapp cũ) nhưng vẫn còn một sợi dây ai đó buộc vào bàn của anh ta, nên cả bàn làm việc với hàng nghìn tài liệu (class) không thể dọn đi.

### Thuật ngữ
- **ClassLoader**: object chịu trách nhiệm tìm và nạp bytecode thành class trong JVM.
- **Bootstrap loader**: loader gốc viết bằng native, nạp {{java.base}} ({{java.lang}}, {{java.util}}...).
- **Platform loader**: từ Java 9 thay cho extension loader, nạp các module JDK khác.
- **Application (system) loader**: nạp class từ classpath/module path của ứng dụng.
- **WebappClassLoader**: loader riêng Tomcat tạo cho mỗi webapp để các app cô lập nhau.
- **Metaspace**: vùng native chứa metadata của class; class chỉ được unload khi loader của nó bị GC.
- **DriverManager**: registry static của JDBC, giữ reference tới các driver đã đăng ký.

### Parent delegation hoạt động thế nào (từng bước)
1. Code gọi tới class {{com.shop.Order}} lần đầu; JVM nhờ loader của class đang chạy load nó.
2. Loader đó kiểm tra đã load chưa (cache). Có rồi thì trả về. Vì sao: mỗi loader chỉ định nghĩa một class một lần.
3. Chưa có thì **ủy quyền lên parent**: application → platform → bootstrap.
4. Bootstrap tìm trong {{java.base}}; không có thì trả về cho platform tìm; không có nữa thì application loader tự {{findClass}} từ classpath.
5. Kết quả: {{java.lang.String}} luôn đến từ bootstrap, dù ai đó cố đặt một file String.class trong jar của mình.

~~~text
loadClass(name):
  1. đã load chưa? có -> trả về
  2. hỏi parent.loadClass(name); parent tìm thấy => dùng của parent
  3. parent không có => tự findClass(name)

Bootstrap  (java.base: java.lang, java.util ...)
   ^
Platform   (java.sql, java.xml ...)
   ^
Application (classpath: spring, app code)
   ^
WebappClassLoader (Tomcat: WEB-INF/classes, WEB-INF/lib) - mỗi webapp một cái
~~~

- Vì sao thiết kế vậy: **an toàn** (app không inject được {{java.lang.String}} giả) và **nhất quán** (một bản {{java.base}} dùng chung toàn JVM).
- Tomcat cố ý **đảo thứ tự** cho WebappClassLoader: vẫn để class của JDK cho bootstrap/platform, nhưng tìm trong WEB-INF trước rồi mới hỏi các loader chung, để mỗi webapp dùng đúng phiên bản thư viện của mình.
- JVM coi "cùng class" là (tên class, classloader định nghĩa nó). Vì thế cùng một tên class có thể được load nhiều lần bởi các loader khác nhau, và khi đó chúng là **hai class khác nhau** — nguồn gốc lỗi {{ClassCastException: Order cannot be cast to Order}}.
- Java 9 module system đổi cấu trúc loader (platform thay extension) nhưng vẫn giữ logic ủy quyền.

### ClassLoader leak khi redeploy (từng bước)
1. Webapp v1 chạy, WebappClassLoader v1 nạp hàng nghìn class.
2. Undeploy: Tomcat bỏ reference tới loader v1 và chờ GC thu.
3. Nhưng còn một reference từ nơi sống lâu hơn webapp: JDBC driver đăng ký vào {{DriverManager}} (static, thuộc loader cha); một ThreadLocal value nằm trong thread pool của Tomcat; một thread do app tạo ra mà không dừng.
4. Một object duy nhất của webapp còn bị giữ là đủ: object → class → loader v1 → **mọi** class và static field của v1. Metaspace không giảm.
5. Sau vài lần redeploy: OOM Metaspace.

~~~text
WebappClassLoader v1 bị giữ bởi chuỗi:
DriverManager.registeredDrivers (static) -> com.mysql.Driver (load bởi v1) -> v1
=> Metaspace phình dần mỗi redeploy
Tomcat thường log: "The web application [app] appears to have started a thread named ..."
~~~

Cách sửa tiêu chuẩn:
- Gắn vào lifecycle: đóng Spring context, deregister JDBC driver, clear ThreadLocal, dừng thread/executor trong {{ServletContextListener.contextDestroyed}}.
- Tomcat có cơ chế "leak prevention" bắt được nhiều nguồn phổ biến; vẫn phải đọc log "appears to have started a thread" sau redeploy.
- Tránh static mutable trong webapp; cache dùng lifecycle của container.

### Lỗi hay gặp
- **Đặt JDBC driver trong WEB-INF/lib**: triệu chứng là metaspace tăng sau mỗi redeploy. Cách tránh: đặt driver ở thư mục lib của Tomcat hoặc deregister khi shutdown.
- **Tạo thread/scheduler tự quản lý mà không dừng**: thread giữ loader cũ. Cách tránh: dùng executor có shutdown trong lifecycle.
- **Nhầm ClassNotFoundException với NoClassDefFoundError**: cái đầu là tìm không thấy khi load động, cái sau là lúc compile có nhưng lúc chạy thiếu hoặc static initializer đã lỗi. Cách tránh: đọc "Caused by".
- **Hot redeploy trên production**: nguồn leak liên tục. Cách tránh: deploy bằng thay container/process mới.

### Trả lời miệng 1 phút
"Parent delegation nghĩa là class loader luôn hỏi parent trước: application hỏi platform, platform hỏi bootstrap, chỉ khi cấp trên không có thì mới tự load. Nhờ vậy class lõi như String chỉ có một bản và không bị giả mạo. JVM nhận diện class bằng tên cộng loader, nên cùng tên ở hai loader là hai class khác nhau. Tomcat đảo thứ tự để mỗi webapp dùng thư viện riêng. Leak xảy ra khi redeploy: chỉ cần một reference từ chỗ sống lâu như DriverManager, ThreadLocal trong pool của Tomcat hay một thread không dừng trỏ vào object của app cũ là cả loader và mọi class của nó bị giữ, metaspace tăng mỗi lần redeploy. Tôi xử lý bằng dọn dẹp trong lifecycle, và trên production tôi chọn thay cả process thay vì hot redeploy."

> Senior tip: so sánh {{jcmd <pid> GC.class_histogram}} hoặc {{jcmd <pid> VM.classloader_stats}} trước và sau redeploy là dấu hiệu sớm của loader leak: số class của webapp tăng dần sau mỗi lần redeploy — phát hiện trước OOM Metaspace nhiều ngày.`,
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
  a: `**Tóm tắt:** HotSpot biên dịch theo tầng (tiered): interpreter → C1 (biên dịch nhanh, kèm thu profile) → C2 (tối ưu mạnh dựa trên profile). Escape analysis cho phép object không "thoát" khỏi method được scalar replacement (không cấp phát trên heap) và lock elision. Warm-up: hiệu năng chỉ đạt đỉnh sau khi method nóng được C2 biên dịch (cỡ vài nghìn lần gọi). GraalVM native image là AOT: khởi động khoảng vài chục ms + RSS thấp, nhưng peak performance thường kém JIT với workload chạy lâu.

### Hiểu nhanh
JIT giống một nhân viên mới: tuần đầu làm theo sách hướng dẫn từng bước (interpreter), chậm nhưng đúng. Việc nào lặp lại nhiều, anh ta ghi lại thao tác tắt (C1), rồi khi đã quan sát đủ thói quen của khách thì viết hẳn quy trình tối ưu cho đúng những tình huống hay gặp (C2). Nếu khách đổi thói quen, quy trình tối ưu không còn đúng, anh ta quay về đọc sách (deoptimization). Native image giống thuê người đã được đào tạo sẵn từ trước: vào làm là nhanh ngay, nhưng không học thêm được thói quen của khách nên đỉnh cao thường thấp hơn.

### Thuật ngữ
- **Interpreter**: chạy từng lệnh bytecode, khởi động ngay nhưng chậm.
- **C1 / C2**: hai JIT compiler của HotSpot; C1 nhanh, tối ưu nhẹ; C2 chậm hơn nhưng tối ưu mạnh.
- **Profile**: thống kê lúc chạy (kiểu thực tế, nhánh hay chạy) mà C2 dùng để tối ưu.
- **Inline**: chép thân method được gọi vào chỗ gọi để bỏ chi phí gọi hàm và mở thêm tối ưu.
- **Escape analysis**: phân tích object có bị lộ ra ngoài method/thread hay không.
- **Scalar replacement**: thay object bằng các biến local riêng lẻ, không cần cấp phát trên heap.
- **Deoptimization**: bỏ code đã tối ưu khi giả định không còn đúng, quay về chạy chậm rồi biên dịch lại.
- **AOT (ahead-of-time)**: biên dịch trước khi chạy, như GraalVM native image.

### Tiered compilation (từng bước)
1. Method mới chạy bằng **interpreter**, JVM đếm số lần gọi và số vòng lặp (back-edge). Vì sao: không tốn công biên dịch code chỉ chạy một lần.
2. Vượt ngưỡng (cỡ vài trăm lần gọi) → **C1** biên dịch nhanh, kèm đoạn đếm để thu profile.
3. Nóng hơn nữa (cỡ vài nghìn tới vài chục nghìn lần gọi, tùy vòng lặp) → **C2** biên dịch lại dùng profile: inline, escape analysis, loại bỏ nhánh không bao giờ chạy.
4. Nếu giả định sai (class mới được load, nhánh "chưa từng chạy" bỗng chạy) → deoptimize, quay lại bước 1–2.
5. Mã máy được cất trong **code cache** (mặc định 240 MB với tiered). Đầy thì JIT ngừng biên dịch, hiệu năng rơi dần với service chạy lâu.

~~~text
latency
  ^
  |\\  interpreter
  | \\__ C1
  |    \\______ C2 (đỉnh hiệu năng)
  +------------------------------> thời gian sau deploy
     0      30s          vài phút
~~~

~~~bash
-XX:+PrintCompilation -Xlog:jit*   # xem method nào được compile, tier mấy
-XX:ReservedCodeCacheSize=512m      # nếu service chạy dài dễ đầy cache
jcmd <pid> Compiler.codecache       # code cache đang dùng bao nhiêu
~~~

### Escape analysis (C2)
~~~java
// object chỉ sống trong method — không escape
int sum() {
    Point p = new Point();      // C2 có thể scalar replacement: không cấp trên heap
    p.x = 1; p.y = 2;
    return p.x + p.y;           // tương đương: int x = 1, y = 2; return x + y;
}
~~~
- Object "escape" khi bị return, gán vào field/static, hoặc truyền vào method mà JIT không inline được. Khi đó bắt buộc cấp phát thật.
- Scalar replacement: object không escape trở thành tập biến local (có thể nằm trong register) — giảm allocation, giảm việc cho GC.
- Lock elision: {{synchronized}} trên object không escape bị JIT bỏ đi vì không thread nào khác thấy được nó.
- Chỉ áp dụng cho code đã đủ nóng để C2 biên dịch, thường là hot loop; đây là tối ưu, không phải cam kết.

### Warm-up
- Khi mới start, code chạy interpreter/C1 — hiệu năng thấp rõ rệt tới khi C2 biên dịch xong hot path.
- Đo benchmark ngay sau restart cho ra số "xấu" — phải warm-up vài nghìn request trước khi đo (JMH làm việc này tự động).
- Có thể chỉnh ngưỡng compile, quan sát qua JFR event {{jdk.Compilation}}, {{jdk.Deoptimization}}.
- JDK mới bắt đầu giảm warm-up bằng AOT cache: JDK 24 (JEP 483) lưu sẵn class đã load và link; JDK 25 bổ sung lưu cả method profile (JEP 515) để JIT có dữ liệu ngay từ đầu.

### GraalVM native image: trade-off

| Tiêu chí | JVM JIT | Native image |
|---|---|---|
| Start-up | vài giây (Spring Boot 2–10 s) | vài chục tới dưới 100 ms |
| RSS | cao hơn | thấp hơn nhiều |
| Peak perf | cao nhất cho hot path sau warm-up | thường thấp hơn (Oracle GraalVM có PGO để thu hẹp) |
| Reflection/Proxy | chạy tự do | phải khai báo (closed-world) |
| Debug/profiler | đầy đủ | hạn chế hơn |
| Build | nhanh | vài phút, tốn nhiều RAM |

- Native image hợp với serverless, cron job, CLI — nơi startup và memory là điểm yếu; giữ JVM cho service chạy dài, đủ thời gian warm-up.
- Spring Boot 3 AOT + GraalVM đã khả thi cho app vừa và nhỏ; thư viện ít phổ biến cần tự khai báo reflection/proxy.

### Lỗi hay gặp
- **Benchmark bằng vòng for + System.nanoTime**: đo phần lớn là interpreter, hoặc JIT xoá luôn code không dùng kết quả. Cách tránh: JMH có warm-up, fork, Blackhole.
- **Code cache đầy trên service chạy lâu**: log "CodeCache is full. Compiler has been disabled", CPU tăng dần. Cách tránh: theo dõi và tăng ReservedCodeCacheSize.
- **Chuyển native image chỉ vì "nhanh hơn"**: throughput ổn định giảm, build CI chậm, lỗi reflection lúc chạy. Cách tránh: benchmark đúng workload.
- **Nhận traffic ngay khi pod vừa lên**: p99 tăng vọt vài phút đầu. Cách tránh: warm-up trước khi readiness báo sẵn sàng.

### Trả lời miệng 1 phút
"HotSpot chạy code bằng interpreter trước, method nóng được C1 biên dịch nhanh kèm thu profile, rồi C2 dùng profile đó để tối ưu mạnh như inline và escape analysis; giả định sai thì deoptimize và biên dịch lại. Escape analysis giúp object không thoát khỏi method được thay bằng biến local, không cấp phát heap, và lock trên nó bị bỏ. Hệ quả là warm-up: vài phút đầu sau deploy latency cao hơn. GraalVM native image biên dịch trước nên khởi động vài chục mili giây và tốn ít RAM, nhưng closed-world, build lâu và peak throughput thường thấp hơn JIT. Tôi dùng native cho serverless hay CLI, còn service chạy lâu thì giữ JVM và làm warm-up trước khi nhận traffic."

> Senior tip: rule của tôi: workload chạy dài (hàng giờ) giữ JVM — peak perf tốt sau warm-up; serverless/cron burst cân nhắc native image. Benchmark riêng cho workload của mình trước khi quyết — startup nhanh và peak throughput cao là bài toán đổi chỗ, không phải win-win.`,
  follow: [
    'Object "escaping" nghĩa là gì, điều kiện nào để escape analysis dùng được?',
    'Native image đánh mất gì so với JIT hot path?'
  ],
  tags: ['JIT', 'C2', 'escape analysis', 'GraalVM'],
  refs: [
    { type: 'doc', title: 'The java Command (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
    { type: 'doc', title: 'GraalVM Native Image', url: 'https://www.graalvm.org/latest/reference-manual/native-image/' },
  ]
}
,
{
  id: 'jvm-009',
  topic: 'jvm',
  level: 'mid',
  q: 'Stop-the-world, safepoint là gì, và cách đọc GC log để phát hiện vấn đề?',
  a: `**Tóm tắt:** Stop-the-world (STW) là khoảng thời gian **mọi thread ứng dụng phải dừng** để JVM làm một việc cần trạng thái toàn cục nhất quán (một số pha GC, deoptimization, thread dump, heap dump; trước JDK 15 còn có thu hồi biased locking). Thread chỉ dừng được tại **safepoint** — điểm mà JVM biết chính xác reference nào nằm ở đâu. Đọc GC log để xem pause của young/mixed có vượt mục tiêu không, allocation rate, promotion rate, và đặc biệt là Full GC (trên G1 là cảnh báo lớn nhất).

### Hiểu nhanh
Hãy nghĩ tới một buổi kiểm kê siêu thị: quản lý hô "mọi người dừng tay" để đếm hàng cho chính xác. Nhân viên không thể dừng giữa lúc đang bê thùng hàng lơ lửng; họ phải đặt thùng xuống chỗ an toàn rồi mới dừng — chỗ đó chính là **safepoint**. Thời gian kiểm kê thực tế = thời gian chờ người chậm nhất đặt thùng xuống + thời gian đếm. GC log là sổ ghi chép mỗi lần kiểm kê: lúc nào, mất bao lâu, kho còn bao nhiêu hàng.

### Thuật ngữ
- **Stop-the-world (STW)**: mọi thread Java bị tạm dừng trong một khoảng.
- **Safepoint**: vị trí trong code mà thread có thể dừng an toàn, JVM biết đủ trạng thái reference.
- **Time-to-safepoint (TTSP)**: thời gian từ lúc JVM yêu cầu dừng tới khi thread cuối cùng dừng.
- **Allocation rate**: tốc độ ứng dụng tạo object mới (MB/s).
- **Promotion rate**: tốc độ object được chuyển từ young lên old.
- **To-space exhausted / evacuation failure**: G1 không còn region trống để copy object sống, thường dẫn tới Full GC.
- **Unified logging (-Xlog)**: hệ thống log của JVM từ JDK 9, thay cho các flag PrintGC cũ.
- **Humongous allocation**: cấp phát object lớn từ nửa region G1 trở lên.

### Safepoint hoạt động thế nào (từng bước)
1. JVM cần làm việc toàn cục (ví dụ young GC) nên bật cờ "yêu cầu safepoint".
2. Mỗi thread đang chạy code đã JIT sẽ kiểm tra cờ ở các điểm poll (cuối vòng lặp, khi return method). Vì sao không dừng ở bất kỳ đâu: giữa hai lệnh máy, JVM không biết chắc register nào đang giữ reference.
3. Thread đang chạy native/blocking I/O được coi là đã ở safepoint (nó không đụng heap Java).
4. Khi thread cuối cùng tới safepoint, JVM làm việc (GC...), rồi thả tất cả chạy tiếp.
5. Pause người dùng cảm nhận = TTSP + thời gian làm việc. Một vòng lặp dài không có poll (counted loop rất lớn) có thể kéo dài TTSP; từ JDK 10, C2 dùng loop strip mining để chèn poll vào các vòng lặp này, giảm đáng kể vấn đề.

~~~text
t=0     JVM yêu cầu safepoint
thread A ----| dừng ngay
thread B --------| dừng
thread C ----------------------| (vòng lặp dài, tới muộn)
              <---- TTSP ----->  <-- GC làm việc -->  chạy tiếp
Pause thật = TTSP + GC
~~~

Log {{-Xlog:safepoint}} cho thấy thời gian "reaching" (TTSP) và "at safepoint"; TTSP cao nghĩa là có thread chậm tới safepoint.

### Đọc GC log G1

~~~text
[gc] Pause Young (Normal) 512M->128M(1024M) 14.2ms   # dưới MaxGCPauseMillis: OK
[gc] Pause Young (Mixed) 300M->150M(1024M) 60ms      # mixed dọn thêm old region
[gc] Pause Full (G1 Compaction Pause) 800M->600M(1024M) 800ms  # CẢNH BÁO lớn trên G1
[gc] To-space exhausted                               # thường đi trước Full GC
~~~
Cách đọc một dòng: {{512M->128M(1024M)}} nghĩa là heap đang dùng 512 MB trước GC, còn 128 MB sau GC, tổng heap đã commit 1024 MB; con số cuối là thời gian pause.

### Cần nhìn gì trong log (từng bước)
1. **Pause vượt MaxGCPauseMillis thường xuyên**: xem kích thước young, humongous allocation, số GC thread.
2. **Full GC xuất hiện**: G1 không đủ chỗ (to-space exhausted) — tăng heap, giảm humongous, hoặc cho marking bắt đầu sớm hơn.
3. **Allocation rate** (MB tạo ra giữa hai lần young GC chia thời gian): cao bất thường thì xem lại code tạo rác (String concat trong vòng lặp, copy DTO).
4. **Promotion rate lên old**: cao bất thường nghĩa là object sống lâu hơn dự kiến; old đầy nhanh, phải xem mixed GC có theo kịp không.
5. **Metaspace tăng theo mỗi lần deploy**: classloader leak.

~~~bash
# Java 9+
-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags
~~~

Phân tích tổng quan: GCeasy, GCViewer để vẽ biểu đồ pause, tỉ lệ thời gian GC, heap sau GC.

### Lỗi hay gặp
- **Chỉ nhìn GC pause mà bỏ qua TTSP**: GC log báo 5 ms nhưng ứng dụng đứng 300 ms. Cách tránh: bật log safepoint, đọc cả thời gian reaching.
- **Nhầm Pause Young (Mixed) với Full GC**: hoảng hốt không cần thiết. Cách tránh: chỉ "Pause Full" mới là full GC.
- **Không xoay vòng file log**: đĩa đầy. Cách tránh: thêm {{filecount=5,filesize=20m}}.
- **Tune flag khi chưa có log 24 giờ**: sửa dựa trên một lần đo. Cách tránh: thu log qua một chu kỳ tải đầy đủ.

### Trả lời miệng 1 phút
"Stop-the-world là lúc JVM dừng mọi thread ứng dụng để làm việc cần trạng thái nhất quán như một số pha GC, deoptimization hay heap dump. Thread chỉ dừng ở safepoint, nơi JVM biết chính xác reference nằm đâu, nên pause thật bằng thời gian chờ thread chậm nhất tới safepoint cộng thời gian GC. Khi đọc GC log tôi xem pause young và mixed có vượt mục tiêu không, allocation rate, promotion rate, và đặc biệt bất kỳ dòng Pause Full nào trên G1, vì đó là dấu hiệu heap không theo kịp. Trade-off là log chi tiết thì nặng hơn nhưng với unified logging có xoay vòng thì chi phí rất nhỏ, nên tôi luôn bật gc và safepoint trên production."

> Senior tip: rule của tôi: Full GC trên G1 (ngoài System.gc() thủ công) là dấu hiệu capacity đang thiếu — kéo 24h GC log trước mọi tuning, đo trước rồi tinh chỉnh; tăng heap là bước sau khi đã loại trừ leak, không phải tune tham số mù.`,
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
  a: `**Tóm tắt:** Compressed oops nén con trỏ 64-bit thành 4 byte khi heap dưới khoảng 32 GB (mặc định bật); vượt ngưỡng đó JVM tắt nén, mỗi reference thành 8 byte và heap cần thêm khoảng 20–30% cho cùng dữ liệu. Object header truyền thống gồm mark word (8 B) + klass pointer (4 B khi nén) = 12 B, cộng field, rồi làm tròn lên bội số của 8. JDK 25 có compact object headers (JEP 519, {{-XX:+UseCompactObjectHeaders}}) giảm header còn 8 B. Công cụ đo chuẩn: JOL. String deduplication cho các String cùng nội dung dùng chung một mảng byte bên trong.

### Hiểu nhanh
Compressed oops giống việc đánh số phòng trong một khách sạn: nếu khách sạn có dưới 4 tỷ "ô" 8 byte (khoảng 32 GB), số phòng vừa vặn trong 4 chữ số kiểu nén, nên mỗi tấm thẻ (reference) nhỏ gọn. Khách sạn to hơn thì phải dùng thẻ dài gấp đôi, và vì có hàng triệu tấm thẻ nên tổng cộng tốn thêm rất nhiều chỗ. Object header giống phần nhãn dán trên mỗi thùng hàng: thùng nhỏ thì nhãn chiếm tỉ lệ lớn. String deduplication giống việc nhiều người cùng giữ bản photo của một tài liệu giống hệt nhau, cất bớt các bản trùng chỉ giữ một bản dùng chung.

### Thuật ngữ
- **oop (ordinary object pointer)**: con trỏ tới object trong heap của HotSpot.
- **Compressed oops**: lưu reference 32-bit rồi nhân 8 (dịch 3 bit) + base để ra địa chỉ thật.
- **Mark word**: 8 byte đầu header, chứa hash code, tuổi GC, trạng thái lock.
- **Klass pointer**: con trỏ tới metadata class của object.
- **Padding**: byte đệm để kích thước object là bội của 8.
- **JOL (Java Object Layout)**: thư viện OpenJDK in ra layout thật của object.
- **Compact strings**: từ Java 9, String Latin-1 lưu 1 byte mỗi ký tự thay vì 2.
- **String deduplication**: GC tìm các String cùng nội dung và cho chúng dùng chung mảng byte.

### Compressed oops hoạt động thế nào (từng bước)
1. Mọi object được căn theo 8 byte, nên 3 bit cuối của địa chỉ luôn là 0.
2. JVM lưu địa chỉ đã bỏ 3 bit đó vào 4 byte: 2^32 × 8 byte = 32 GB địa chỉ được.
3. Khi dùng, JVM dịch trái 3 bit (và cộng base nếu cần) để ra địa chỉ thật — chi phí rất rẻ.
4. Heap vượt ngưỡng (thực tế hơi dưới 32 GB) thì không nén được nữa: mỗi reference 8 byte.
- Bẫy kinh điển: tăng heap từ 31 GB lên 33 GB — chỉ vì mất compressed oops mà dữ liệu thực dùng phình 20–30%; nhiều trường hợp heap 31 GB có nén chứa được nhiều dữ liệu hơn heap 33–40 GB không nén.
- Heap trên 32 GB: cân nhắc chia nhỏ (nhiều instance) hoặc chấp nhận chi phí; kiểm tra bằng {{java -Xmx32g -XX:+PrintFlagsFinal -version | grep UseCompressedOops}}.

### Object header + ước lượng
~~~text
header truyền thống (compressed refs): mark 8 B + klass 4 B = 12 B
data fields + padding tới bội 8 B
new Object()      : 12 -> 16 B
Integer           : 12 + 4 (int)              = 16 B
class chỉ có long : 12 + (4 đệm) + 8 (long)   = 24 B  (không phải 8)
byte[100]         : 12 + 4 (length) + 100 = 116 -> 120 B
Compact headers (JDK 25, JEP 519): header 8 B
new Object() -> 8 B ; Integer -> 8 + 4 = 12 -> 16 B
~~~

- JOL ({{org.openjdk.jol:jol-core}}) in layout chính xác từng field và padding: {{ClassLayout.parseClass(Order.class).toPrintable()}}.
- HashMap: mỗi entry gồm Node (~32 B) + ô trong mảng bảng + key/value đóng gói (Long ~24 B) ⇒ khoảng 44–56+ B mỗi entry trước cả dữ liệu thật. HashMap<Long, Object> 1 triệu entry dễ tốn 50+ MB, không phải 8 byte/entry như tưởng.
- Compact object headers: trải qua JEP 450 (experimental, JDK 24) rồi JEP 519 (product, JDK 25, vẫn phải bật bằng flag). App nhiều object nhỏ có thể giảm heap đáng kể (thường được nhắc ở mức 10–20%); đo trước khi bật.

### String deduplication
- {{-XX:+UseStringDeduplication}}: ban đầu chỉ cho G1, từ JDK 18 hỗ trợ cả Serial, Parallel, ZGC, Shenandoah.
- Cơ chế: GC chọn các String sống qua ngưỡng tuổi ({{StringDeduplicationAgeThreshold}}, mặc định 3), một thread nền băm nội dung và cho các String trùng trỏ chung một mảng {{byte[]}}; object String vẫn là các object riêng.
- Giảm 20–40% heap trong app có nhiều URL, header, config, token trùng lặp; đo trước/sau.
- Java 9+ String dùng {{byte[]}} nội bộ (compact strings): String Latin-1 mỗi ký tự 1 byte — "1 tỷ ký tự ASCII ~ 1 GB" chứ không phải 2 GB.

### Lỗi hay gặp
- **Đặt Xmx 34g "cho rộng rãi"**: triệu chứng là heap dùng nhiều hơn hẳn so với 31g, GC chậm hơn. Cách tránh: dừng dưới 32 GB hoặc nhảy hẳn lên mức lớn hơn nhiều.
- **Ước lượng memory bằng "số field × 8"**: thiếu header, padding, boxing. Cách tránh: đo bằng JOL và heap dump.
- **Cache Map<Long, Long> triệu entry**: tốn gấp nhiều lần dữ liệu thật. Cách tránh: cấu trúc primitive (mảng, thư viện primitive collection) hoặc nén key.
- **Bật String dedup mà không đo**: thêm CPU nền cho GC mà không lợi gì nếu chuỗi ít trùng. Cách tránh: so sánh heap sau GC trước và sau.

### Trả lời miệng 1 phút
"Trên JVM 64-bit, reference mặc định được nén còn 4 byte nhờ compressed oops: object căn 8 byte nên bỏ được 3 bit cuối, 32 bit đủ địa chỉ cho khoảng 32 GB. Vượt ngưỡng đó mỗi reference thành 8 byte, nên heap 33 GB có khi chứa ít dữ liệu hơn heap 31 GB. Object có header 12 byte với compressed refs, cộng field rồi làm tròn bội 8, nên Integer là 16 byte và một entry HashMap tốn cỡ 50 byte. JDK 25 có compact object headers giảm header còn 8 byte. String deduplication cho các String trùng nội dung dùng chung mảng byte. Trade-off là các tối ưu này tốn chút CPU, nên tôi luôn đo bằng JOL và heap dump trước khi quyết định."

> Senior tip: đo bằng công cụ (JOL + heap dump), đừng ước bằng trí nhớ: HashMap 1 triệu entry thường đòi 60–100 MB heap trước cả phần data — heap 2 GB có thể cạn chỉ với vài cache không eviction; tính được header + ref + padding là kỹ năng ghi điểm trong phỏng vấn JVM.`,
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
  a: `**Tóm tắt:** Với mục tiêu p99 dưới 10 ms: chọn Generational ZGC (Java 21+, pause dưới 1 ms gần như không phụ thuộc kích thước heap); heap khoảng 1.5–2× live set để GC không phải chạy dồn dập; kiểm soát cả các nguồn STW **ngoài GC** (time-to-safepoint dài, code cache đầy, {{System.gc()}} trong thư viện, heap dump); đo bằng GC log + JFR + load test trước khi đưa lên production.

### Hiểu nhanh
Giả sử bạn vận hành một quầy thu ngân phải phục vụ mỗi khách dưới 10 giây. G1 giống việc thỉnh thoảng đóng quầy vài chục giây để dọn dẹp; ZGC giống có thêm một nhân viên vừa dọn vừa để quầy mở, chỉ chặn khách một tích tắc. Nhưng dù dọn dẹp tốt đến đâu, khách vẫn có thể chờ lâu nếu máy POS treo (safepoint dài), máy in hết giấy (code cache đầy) hay có ai đó bấm nút "kiểm kê toàn bộ" (System.gc). Muốn đạt 10 giây phải xử lý tất cả nguồn chờ, không chỉ việc dọn dẹp.

### Thuật ngữ
- **p99**: 99% request nhanh hơn con số này; đo được "đuôi" chậm mà trung bình che mất.
- **Live set**: lượng dữ liệu còn sống sau một lần GC đầy đủ, tức dữ liệu thật app cần.
- **Generational ZGC**: ZGC tách young/old (JEP 439, JDK 21), dọn object chết trẻ rẻ hơn.
- **Concurrent GC**: GC làm việc song song với app, tốn CPU nhưng ít dừng app.
- **Allocation stall**: ZGC buộc thread cấp phát phải chờ vì GC dọn không kịp tốc độ tạo rác.
- **TTSP**: thời gian chờ mọi thread tới safepoint.
- **Code cache**: vùng chứa mã máy JIT; đầy thì JIT ngừng.
- **Deoptimization**: bỏ mã đã tối ưu, quay về chạy chậm.

### Quyết định chính

| Yếu tố | Chọn | Lý do |
|---|---|---|
| GC | Generational ZGC | pause dưới 1 ms, gần như không phụ thuộc heap size |
| Heap size | 1.5–2x live set | đủ khoảng trống để GC concurrent theo kịp |
| young size | để ZGC tự điều chỉnh | generational ZGC tự quản young |
| Allocation rate | đo theo request, giảm String concat/copy DTO | GC concurrent vẫn tốn CPU khi tạo rác nhiều |

### Triển khai từng bước
1. **Bật ZGC trên Java 21+**: pause thường 0.1–0.5 ms. Vì sao cần đủ core: GC thread chạy song song, giành CPU với app; CPU sát trần thì ZGC dọn không kịp và gây allocation stall — tệ hơn cả pause.
2. **Kích thước heap**: không đặt bằng toàn bộ RAM; 1.5–2× live set đủ cho đa số trường hợp (đo live set qua JFR {{jdk.GCHeapSummary}} hoặc heap sau GC). Heap quá sát live set thì GC chạy liên tục.
3. **Loại các nguồn STW ngoài GC**:
   - Safepoint: {{-Xlog:safepoint}} — kiểm tra TTSP; vòng lặp counted dài có thể làm TTSP tăng.
   - Code cache đầy: JIT ngừng compile, code chạy chậm dần — reserve đủ, theo dõi {{jdk.CodeCacheFull}}.
   - {{System.gc()}} từ thư viện: với ZGC, nó chạy một chu kỳ concurrent (chỉ thread gọi phải chờ); với G1 dùng {{-XX:+ExplicitGCInvokesConcurrent}} để tránh Full GC STW, hoặc {{-XX:+DisableExplicitGC}}.
   - Heap dump ({{HeapDumpOnOutOfMemoryError}}, jcmd): dump có thể dừng hàng chục giây — nhớ điều này khi gặp spike khó hiểu.
4. **Đo**: GC log (phân bố pause), JFR (allocation, safepoint, deoptimization) và load test với burst 2× peak trước khi lên production.

~~~bash
# Java 21
-XX:+UseZGC -XX:+ZGenerational -Xlog:gc*,safepoint:file=gc.log:time
# JDK 23+: chỉ cần -XX:+UseZGC (generational là mặc định, JDK 24 bỏ flag ZGenerational)
~~~

~~~text
Ngân sách p99 = 10 ms cho một request
  xử lý nghiệp vụ + DB      ~6 ms
  mạng / serialize          ~2 ms
  GC pause (ZGC)            ~0.5 ms
  dự phòng safepoint, JIT   ~1.5 ms
Một lần Full GC 800 ms của G1 làm vỡ ngân sách cho mọi request đang chạy
~~~

### Khi không nên dùng ZGC
- Heap nhỏ (dưới vài GB) và ưu tiên throughput: G1 đủ tốt, ZGC tốn thêm CPU cho thread concurrent.
- Batch job không quan tâm latency: Parallel GC cho throughput cao hơn.
- CPU quota đã sát trần ở peak: cần thêm CPU trước khi đổi collector.

### Lỗi hay gặp
- **Đổi sang ZGC rồi thấy p99 không giảm**: nguồn chậm thật là DB, lock hay TTSP. Cách tránh: đo từng tầng trước khi gán lỗi cho GC.
- **Allocation stall**: log có "Allocation Stall", thread bị chặn dù pause rất ngắn. Cách tránh: thêm heap hoặc CPU, giảm allocation rate.
- **Vẫn để -XX:+ZGenerational khi lên JDK 24+**: cảnh báo flag lỗi thời. Cách tránh: dọn flag khi nâng JDK.
- **Đo p99 trên benchmark ngắn**: chưa thấy chu kỳ GC old. Cách tránh: load test vài giờ.

### Trả lời miệng 1 phút
"Với p99 dưới 10 ms, tôi chọn Generational ZGC trên Java 21 trở lên, vì nó làm marking và compaction đồng thời, pause dưới một mili giây gần như không phụ thuộc heap. Heap tôi đặt khoảng 1.5 tới 2 lần live set để GC có chỗ thở, và đảm bảo đủ CPU vì GC thread chạy song song với app, thiếu CPU sẽ gây allocation stall. Nhưng GC chỉ là một nguồn; tôi còn kiểm tra time-to-safepoint, code cache, System.gc trong thư viện và heap dump. Trade-off là ZGC tốn thêm CPU và throughput có thể thấp hơn G1 một chút. Tôi luôn đo bằng GC log, JFR và load test có burst trước khi đưa lên production."

> Senior tip: target p99 dưới 10 ms cần đo cả 3 tầng: GC pause (GC log), runtime event (JFR), scheduling/network (tracing ở tầng APM). ZGC giảm pause GC nhưng spike vẫn có thể đến từ safepoint, deopt, thread scheduling — đo từng tầng để không gán sai nguyên nhân cho GC.`,
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

### Hiểu nhanh
JFR giống **hộp đen máy bay** gắn sẵn trong JVM: lúc nào cũng ghi lại những gì xảy ra (GC, lock, I/O chậm, method nóng) vào một cuộn băng có giới hạn, cũ thì tự xoá. Bình thường không ai mở ra xem; chỉ khi có sự cố (p99 tăng lúc 2 giờ sáng) ta mới "rút hộp đen" bằng {{JFR.dump}} để đọc lại vài giờ trước đó. JMC là máy đọc hộp đen, vẽ ra biểu đồ và tự chỉ điểm vấn đề. Nhờ chi phí rất thấp nên có thể để nó chạy suốt đời process.

### Thuật ngữ
- **JFR (Java Flight Recorder)**: bộ ghi sự kiện tích hợp trong HotSpot, ghi file .jfr.
- **JMC (JDK Mission Control)**: ứng dụng desktop mở và phân tích file .jfr.
- **Event**: một bản ghi có thời điểm, thời lượng, thread và có thể kèm stack trace (ví dụ một lần GC pause).
- **Recording**: một phiên ghi với cấu hình riêng (tên, settings, maxage, maxsize).
- **Settings default / profile**: hai cấu hình có sẵn; default nhẹ cho chạy liên tục, profile chi tiết cho điều tra ngắn.
- **Threshold**: chỉ ghi event kéo dài hơn ngưỡng (ví dụ lần chờ lock trên 20 ms).
- **Continuous profiling**: profiling chạy liên tục trên production thay vì chỉ bật khi có sự cố.
- **Event Streaming**: API đọc event JFR theo thời gian thực từ trong chính ứng dụng (JDK 14+).

### JFR hoạt động thế nào (từng bước)
1. JVM phát event ở những chỗ nó vốn đã biết (bắt đầu/kết thúc GC, safepoint, class load) — gần như miễn phí vì không cần đo thêm.
2. Event được ghi vào **buffer cục bộ của từng thread**, không khoá chung. Vì sao: tránh tranh chấp giữa các thread.
3. Buffer đầy thì được đẩy vào buffer toàn cục, rồi định kỳ ghi xuống **file chunk** trên đĩa.
4. Chunk cũ hơn {{maxage}} hoặc vượt {{maxsize}} bị xoá — nên đĩa không bao giờ đầy với recording đã giới hạn.
5. Khi cần, {{JFR.dump}} gom các chunk hiện có thành một file .jfr để phân tích.

~~~text
thread-1 buffer --+
thread-2 buffer --+--> global buffer --> chunk 10:00 | chunk 10:10 | ... | chunk 16:00
thread-N buffer --+                       (chunk cũ hơn maxage=6h bị xoá)
                                         jcmd JFR.dump --> incident.jfr --> JMC / jfr
~~~

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

### Lỗi hay gặp
- **Recording không giới hạn**: triệu chứng là đĩa pod đầy sau vài ngày. Cách tránh: luôn đặt {{maxage}} và {{maxsize}}.
- **Dùng settings=profile chạy liên tục**: overhead cao hơn cần thiết, nhất là allocation và lock. Cách tránh: default cho chạy nền, profile chỉ vài phút khi điều tra.
- **File .jfr nằm trong filesystem tạm của container**: pod restart là mất. Cách tránh: dump ra volume bền và copy đi ngay.
- **Chia sẻ file JFR tuỳ tiện**: lộ biến môi trường chứa secret. Cách tránh: xử lý như dữ liệu nhạy cảm, không truyền secret qua tham số dòng lệnh.

### Trả lời miệng 1 phút
"JFR là bộ ghi sự kiện có sẵn trong JDK, miễn phí từ JDK 11. Event được ghi vào buffer theo từng thread rồi đẩy xuống các chunk trên đĩa, chunk cũ tự xoá theo maxage và maxsize, nên tôi để nó chạy liên tục như hộp đen với cấu hình default, overhead khoảng 1%. Khi có sự cố, tôi gọi jcmd JFR.dump để lấy vài giờ gần nhất rồi mở bằng JMC, hoặc dùng lệnh jfr print và jfr view ngay trên server. Event tôi xem đầu tiên là GC pause, safepoint, execution sample, lock và socket I/O. Trade-off là cấu hình profile chi tiết hơn nhưng tốn hơn, nên chỉ chạy ngắn. Tôi còn nối alert với job tự dump đúng pod đang có p99 cao."

> Senior tip: tôi bật JFR default với {{maxage=6h}} trên mọi pod và nối với alerting: khi p99 vượt ngưỡng, một job tự gọi {{JFR.dump}} trên đúng pod đó. Nhờ vậy những spike 30 giây lúc 2 giờ sáng vẫn có dữ liệu để đọc vào sáng hôm sau, thường lộ ra là safepoint dài, lock trên connection pool, hoặc một đợt allocation lớn do batch.`,
  follow: [
    'JFR và async-profiler khác nhau thế nào, khi nào dùng cái nào?',
    'Dùng JFR Event Streaming để đẩy số liệu GC pause sang Prometheus thế nào?',
    'Không có GUI trên server, bạn phân tích file .jfr bằng cách nào?'
  ],
  tags: ['JFR', 'JMC', 'profiling', 'production'],
  refs: [
    { type: 'doc', title: 'JDK Flight Recorder API Programmer Guide (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/jfapi/' },
    { type: 'doc', title: 'Diagnostic Tools (JDK 21 Troubleshooting)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html' },
  ]
},
{
  id: 'jvm-013',
  topic: 'jvm',
  level: 'senior',
  q: 'Đọc heap dump: dominator tree, shallow vs retained size, GC roots path — quy trình tìm leak bằng MAT?',
  a: `**Tóm tắt:** Shallow size là kích thước của riêng object (header + field). Retained size là lượng bộ nhớ được giải phóng nếu object đó bị thu hồi: chính nó cộng với mọi object chỉ đến được qua nó. Dominator tree sắp xếp object theo quan hệ "mọi đường từ GC root tới B đều đi qua A", nên object đứng đầu một nhánh có retained size lớn chính là thứ đang giữ bộ nhớ. Quy trình: lấy dump đúng lúc → Leak Suspects → Dominator Tree sắp theo retained → Path to GC Roots (loại weak/soft) để biết **ai** đang giữ → đối chiếu với code. Leak tăng chậm thì so sánh hai dump cách nhau vài giờ.

### Hiểu nhanh
Heap dump giống một bức ảnh chụp toàn bộ kho hàng kèm sơ đồ "ai đang giữ món nào". Shallow size là trọng lượng của riêng chiếc hộp; retained size là trọng lượng chiếc hộp **cộng mọi thứ chỉ có nó đang giữ** — nếu bỏ chiếc hộp đi thì cả đống đồ đó cũng được dọn. Dominator tree trả lời câu hỏi: "Nếu tôi cắt sợi dây này, bao nhiêu đồ sẽ rơi?". Path to GC Roots là lần ngược sợi dây lên tới cái móc cố định trên tường (static field, thread) để biết ai buộc nó vào đó.

### Thuật ngữ
- **Heap dump (.hprof)**: ảnh chụp mọi object và reference trong heap.
- **Shallow size**: kích thước bản thân object (header + field), không tính object nó trỏ tới.
- **Retained size**: bộ nhớ được giải phóng nếu object đó bị thu, gồm mọi object chỉ đến được qua nó.
- **Dominator**: A dominate B khi mọi đường từ GC root tới B đều đi qua A.
- **GC root**: điểm xuất phát chắc chắn sống: static field, biến trên stack thread, JNI reference...
- **OQL**: ngôn ngữ truy vấn kiểu SQL trên heap dump trong MAT.
- **Histogram**: bảng số instance và tổng byte theo class.
- **Weak/Soft reference**: reference không ngăn GC thu object, nên không phải nguyên nhân leak.

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

### Lỗi hay gặp
- **Sắp xếp theo shallow size**: đầu bảng toàn {{byte[]}}, {{char[]}}, {{String}} và không biết ai giữ. Cách tránh: sắp theo retained trong Dominator Tree.
- **Không loại weak/soft khi tìm Path to GC Roots**: ra đường đi qua {{WeakHashMap}} hay cache soft, kết luận sai. Cách tránh: chọn "exclude weak/soft references".
- **Dump đúng lúc pod đang phục vụ**: STW vài giây, timeout dây chuyền. Cách tránh: rút pod khỏi load balancer trước.
- **Gửi dump qua chat/email**: lộ dữ liệu khách hàng. Cách tránh: lưu chỗ mã hoá, giới hạn quyền, xoá sau khi xong.

### Trả lời miệng 1 phút
"Shallow size là kích thước của riêng object, retained size là lượng bộ nhớ được giải phóng nếu object đó biến mất. Dominator tree xây dựa trên quan hệ mọi đường từ GC root tới B đều đi qua A, nên object đứng đầu với retained lớn chính là kẻ giữ bộ nhớ, thường là một collection có shallow rất nhỏ. Quy trình của tôi: lấy dump đúng lúc, mở Leak Suspects, sang Dominator Tree sắp theo retained, rồi Path to GC Roots loại weak và soft để biết field nào đang giữ, sau đó đối chiếu code. Với leak chậm tôi so sánh histogram của hai dump cách nhau vài giờ. Trade-off là dump dừng JVM và chứa dữ liệu nhạy cảm, nên tôi làm trên pod đã rút traffic và xử lý file cẩn thận."

> Senior tip: với leak tăng chậm, tôi không dump liên tục trên production vì mỗi lần là một lần STW. Tôi theo dõi xu hướng old gen sau GC qua metric, rồi chỉ chụp hai dump trên một pod đã rút khỏi traffic, cách nhau vài giờ. So sánh histogram giữa hai dump gần như luôn chỉ thẳng vào class đang tích tụ, sau đó Path to GC Roots cho biết đoạn code nào giữ nó.`,
  follow: [
    'Khi nào bạn dùng Unreachable Objects Histogram?',
    'Heap dump 20 GB, bạn phân tích bằng cách nào mà không làm treo máy?',
    'Retained size của các object cộng lại không bằng heap đang dùng — vì sao?'
  ],
  tags: ['heap dump', 'MAT', 'dominator tree', 'retained size', 'GC roots'],
  refs: [
    { type: 'doc', title: 'Eclipse Memory Analyzer (MAT)', url: 'https://eclipse.dev/mat/' },
    { type: 'doc', title: 'Troubleshooting Memory Leaks (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html' },
  ]
},
{
  id: 'jvm-014',
  topic: 'jvm',
  level: 'senior',
  q: 'Native Memory Tracking: RSS cao hơn heap nhiều — metaspace, thread stack, direct buffer, code cache, glibc malloc arenas. Phân tích như thế nào?',
  a: `**Tóm tắt:** RSS của process Java gồm heap, cộng native memory do JVM cấp phát (metaspace, code cache, thread stack, cấu trúc dữ liệu của GC, symbol, direct buffer...), cộng phần native mà JVM không theo dõi (thư viện JNI, overhead và phân mảnh của malloc). NMT ({{-XX:NativeMemoryTracking=summary}}) chỉ thấy phần JVM tự cấp phát. Quy trình: bật NMT, lấy baseline, sau vài giờ xem {{summary.diff}} để biết hạng mục nào tăng. Nếu tổng committed của NMT ổn định mà RSS vẫn tăng, hãy nghi phần nằm ngoài NMT, thường là glibc malloc arena hoặc thư viện native.

### Hiểu nhanh
Hãy coi RSS là hoá đơn tổng tiền thuê nhà của JVM. Heap chỉ là tiền phòng chính; còn tiền điện (thread stack), tiền nước (metaspace), phí gửi xe (direct buffer), phí quản lý (cấu trúc của GC). NMT là bảng kê chi tiết mà **chính JVM tự ghi**, nên nó chỉ thấy các khoản JVM tự chi. Những khoản do "người ở ghép" chi (thư viện native, glibc malloc giữ lại bộ nhớ) thì không có trong bảng kê; nếu tổng hoá đơn tăng mà bảng kê đứng yên thì thủ phạm nằm ngoài JVM.

### Thuật ngữ
- **RSS**: lượng RAM thật process đang chiếm, con số Kubernetes dùng để OOMKill.
- **NMT (Native Memory Tracking)**: tính năng HotSpot theo dõi bộ nhớ native do chính JVM cấp phát.
- **Reserved / committed**: reserved là vùng địa chỉ đã giữ chỗ; committed là phần đã được cấp bộ nhớ thật (gần với RSS hơn).
- **Metaspace**: vùng native chứa metadata class.
- **Direct buffer**: bộ nhớ ngoài heap cho NIO/Netty.
- **glibc malloc arena**: vùng quản lý bộ nhớ riêng mà thư viện C cấp cho các thread để giảm tranh chấp; giữ lại bộ nhớ đã free.
- **pmap**: lệnh Linux liệt kê các vùng nhớ của process và phần đang resident.
- **jemalloc**: allocator thay thế cho glibc malloc, thường ít phân mảnh hơn.

### Quy trình phân tích (từng bước)
1. Bật NMT lúc khởi động. Vì sao: NMT phải theo dõi từ lần cấp phát đầu tiên, không bật giữa chừng được.
2. Khi app đã ổn định, lấy {{baseline}}.
3. Chờ vài giờ dưới tải thật, chạy {{summary.diff}} để thấy hạng mục nào tăng.
4. So tổng committed của NMT với RSS: khớp thì vấn đề nằm trong JVM; RSS cao hơn nhiều và tiếp tục tăng thì nhìn ra ngoài NMT.
5. Xử lý theo từng hạng mục như bảng dưới.

~~~text
RSS 3.2 GB
= Java Heap committed       2.0 GB
+ NMT ngoài heap            0.7 GB  (Thread 0.3, Class 0.2, Code 0.1, GC 0.1)
+ phần NMT không thấy       0.5 GB  (malloc arena, thư viện native)  <- nếu phần này tăng mãi, nghi glibc
~~~

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

### Lỗi hay gặp
- **Tìm leak trong heap dump khi heap vẫn ổn**: mất cả ngày vô ích. Cách tránh: so RSS với heap trước, chênh lớn thì đi hướng native.
- **Bật NMT detail trên production lâu dài**: overhead đáng kể. Cách tránh: summary cho chạy nền, detail chỉ khi cần biết ai cấp phát.
- **Tăng memory limit để chữa OOMKilled**: leak native vẫn tăng, chỉ chết chậm hơn. Cách tránh: dùng summary.diff tìm hạng mục tăng.
- **Không close GZIPInputStream/Inflater**: RSS tăng dần ngoài NMT. Cách tránh: try-with-resources cho mọi stream nén.

### Trả lời miệng 1 phút
"RSS của Java gồm heap, phần native do JVM cấp phát như metaspace, thread stack, code cache, cấu trúc GC và direct buffer, cộng phần native ngoài tầm theo dõi của JVM như thư viện JNI và glibc malloc. Tôi bật Native Memory Tracking mức summary lúc khởi động, lấy baseline khi app ổn định, vài giờ sau xem summary.diff để biết hạng mục nào tăng: Thread tăng thì đếm thread, Class tăng thì nghi classloader leak, Other tăng thì là direct buffer. Nếu NMT đứng yên mà RSS vẫn tăng thì tôi nghi malloc arena và thử MALLOC_ARENA_MAX hoặc jemalloc. Trade-off là NMT tốn chút overhead, detail tốn nhiều hơn. Trong container tôi luôn chừa phần native khi đặt heap."

> Senior tip: công thức tôi dùng là RSS = heap + phần NMT ngoài heap + phần ngoài NMT, và luôn tính đủ ba con số trước khi kết luận. Case hay gặp: pod 4 GB bị OOMKilled dù heap chỉ 2,5 GB, NMT cho thấy Thread chiếm vài trăm MB vì một HTTP client tạo thread mới cho mỗi request. Trường hợp đó phải sửa code, tăng memory limit chỉ làm lỗi xảy ra chậm hơn.`,
  follow: [
    'Vì sao glibc malloc arena làm RSS phình, MALLOC_ARENA_MAX đánh đổi gì?',
    'NMT summary và detail khác nhau thế nào, khi nào cần detail?',
    'Pod bị OOMKilled nhưng log không có OutOfMemoryError — bạn điều tra thế nào?'
  ],
  tags: ['NMT', 'native memory', 'RSS', 'metaspace', 'malloc arena'],
  refs: [
    { type: 'doc', title: 'Native Memory Tracking (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html' },
    { type: 'doc', title: 'The java Command (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
  ]
},
{
  id: 'jvm-015',
  topic: 'jvm',
  level: 'lead',
  q: 'Bộ JVM flags baseline cho service Spring Boot trên container: heap %, GC, OOM dump, GC log, exit on OOM — lý do từng flag?',
  a: `**Tóm tắt:** Baseline của tôi cho Spring Boot 3 trên Java 21 trong container: để JVM tự đọc memory limit của cgroup và đặt heap theo phần trăm ({{-XX:MaxRAMPercentage}} khoảng 60–75), chọn GC một cách tường minh (G1, hoặc Generational ZGC khi cần latency thấp), bật GC log có xoay vòng, heap dump khi OOM vào volume bền, {{-XX:+ExitOnOutOfMemoryError}} để process chết hẳn thay vì sống dở, và JFR chạy nền. Không thêm flag nào mà không đo được tác dụng của nó.

### Hiểu nhanh
Bộ JVM flags baseline giống **danh sách kiểm tra trước khi cất cánh** của phi công: không phải để bay nhanh hơn, mà để khi có sự cố thì máy bay phản ứng đúng và để lại đủ dữ liệu điều tra. Heap theo phần trăm giống chia hành lý theo cân nặng cho phép của vali; heap dump và JFR giống hộp đen; ExitOnOutOfMemoryError giống quy tắc "động cơ hỏng thì hạ cánh ngay, đừng cố bay tiếp". Mỗi flag phải trả lời được câu hỏi "nó bảo vệ mình khỏi điều gì?".

### Thuật ngữ
- **cgroup**: cơ chế Linux giới hạn CPU/RAM cho container; JVM đọc limit từ đây.
- **MaxRAMPercentage / InitialRAMPercentage**: heap tối đa / ban đầu tính theo phần trăm memory limit.
- **Server-class machine**: máy JVM coi là "server" (từ 2 CPU và khoảng 1792 MB RAM trở lên); dưới mức đó JVM chọn SerialGC.
- **Unified logging (-Xlog)**: hệ thống log của JVM từ JDK 9, có xoay vòng file.
- **ExitOnOutOfMemoryError**: JVM thoát ngay khi gặp OutOfMemoryError đầu tiên.
- **JAVA_TOOL_OPTIONS**: biến môi trường JVM tự đọc để thêm flag, tiện cho container.
- **restartPolicy**: quy tắc Kubernetes khởi động lại container khi process thoát.
- **Graceful shutdown**: dừng nhận request mới và chờ request đang chạy xong rồi mới tắt.

### Khi pod khởi động, JVM quyết định thế nào (từng bước)
1. Đọc memory/CPU limit từ cgroup. Vì sao quan trọng: không đọc thì JVM tưởng có cả RAM của node.
2. Tính heap = limit × MaxRAMPercentage (trừ khi có Xmx).
3. Chọn GC: có flag thì theo flag; không có thì G1 nếu là server-class, ngược lại SerialGC.
4. Mở GC log, JFR, NMT theo flag — chỉ bật được ở bước này, không bật giữa chừng (NMT) hoặc phải gọi jcmd sau (JFR).
5. Khi OOM: ghi heap dump vào HeapDumpPath, rồi thoát (exit code 3) để kubelet khởi động lại.

~~~text
Pod limit 2 GiB, 2 vCPU, MaxRAMPercentage=70
heap max  ~ 1434 MiB
native    ~ 614 MiB  (metaspace, thread, code cache, direct, GC, malloc)
GC        = G1 (vì có -XX:+UseG1GC; nếu 1 vCPU mà không ghi rõ -> SerialGC)
~~~

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

### Lỗi hay gặp
- **Không ghi rõ GC trên pod 1 vCPU**: triệu chứng là pause dài bất ngờ, log khởi động cho thấy SerialGC. Cách tránh: luôn đặt {{-XX:+UseG1GC}} hoặc ZGC.
- **Không có ExitOnOutOfMemoryError**: service "sống dở", health check xanh nhưng scheduler đã chết. Cách tránh: thoát và để orchestrator restart.
- **HeapDumpPath trên filesystem tạm**: dump mất khi container restart. Cách tránh: mount volume bền, đủ dung lượng.
- **Đặt cả Xmx và MaxRAMPercentage**: Xmx thắng, phần trăm vô tác dụng, đổi limit pod không có hiệu lực. Cách tránh: chỉ dùng một cách.

### Trả lời miệng 1 phút
"Baseline của tôi cho Spring Boot trên container là: heap theo phần trăm memory limit, khoảng 70%, Initial bằng Max để lộ thiếu RAM ngay khi khởi động; ghi rõ G1 hoặc Generational ZGC vì pod ít CPU sẽ âm thầm chạy SerialGC; GC log có xoay vòng; heap dump khi OOM vào volume bền; ExitOnOutOfMemoryError để process chết hẳn thay vì sống dở; JFR chạy nền và NMT summary. Mỗi flag phải có lý do: hoặc bảo vệ khỏi OOMKilled, hoặc để lại bằng chứng, hoặc tránh trạng thái hỏng ngầm. Trade-off là heap lớn hơn thì ít chỗ cho native. Tôi không copy flag từ blog cũ, và luôn kiểm tra log khởi động hoặc jcmd VM.flags để xem JVM thực sự chọn gì."

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

### Hiểu nhanh
Hãy tưởng tượng object là một quả bóng bay, reference là sợi dây. **Strong** là bạn nắm chặt dây: bóng không bay đi được. **Soft** là buộc dây lỏng vào ghế: chỉ khi phòng quá chật (heap căng) người dọn mới cắt. **Weak** là chỉ dán băng keo: người dọn đi qua lần đầu là gỡ. **Phantom** là chỉ còn tấm ảnh chụp quả bóng: bạn không lấy lại được bóng, chỉ dùng để biết "bóng đã bay đi" mà dọn dẹp đồ đi kèm. Dùng SoftReference làm cache giống chất đồ đầy phòng rồi trông chờ người dọn tự quyết vứt món nào: họ vứt hàng loạt đúng lúc phòng đông khách nhất.

### Thuật ngữ
- **Strong reference**: reference thông thường, giữ object sống.
- **SoftReference**: GC chỉ thu khi bộ nhớ căng, chắc chắn thu trước khi ném OOM.
- **WeakReference**: GC thu ở lần đầu thấy object chỉ còn weak reference.
- **PhantomReference**: không lấy được object ({{get()}} luôn null), chỉ để nhận tín hiệu object đã chết.
- **ReferenceQueue**: hàng đợi GC đưa Reference object vào sau khi referent bị thu.
- **Referent**: object mà Reference trỏ tới.
- **Cleaner**: API JDK 9+ đăng ký hành động dọn dẹp chạy khi object chết.
- **W-TinyLFU**: thuật toán evict của Caffeine, giữ entry được truy cập thường xuyên.

### Vòng đời một WeakReference có queue (từng bước)
1. Tạo {{new WeakReference<>(obj, queue)}}; obj vẫn còn strong reference ở nơi khác nên sống bình thường.
2. Strong reference cuối cùng bị bỏ; giờ obj chỉ còn weak.
3. Lần GC kế tiếp phát hiện điều đó, xoá liên kết ({{get()}} trả null) và thu obj. Vì sao ngay lần đầu: weak không có quyền giữ object.
4. GC đưa chính object WeakReference vào queue.
5. Thread dọn dẹp {{poll()}} queue, xoá entry tương ứng khỏi map — đúng cách {{WeakHashMap}} tự dọn.

~~~text
strong:  [code] ==> obj          (luôn sống)
soft:    [ref] --> obj          (sống tới khi heap căng)
weak:    [ref] --> obj          (chết ở GC kế tiếp nếu không còn strong)
phantom: [ref] ..x obj          (get() = null; chỉ báo tin qua queue)
~~~

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

### Lỗi hay gặp
- **Cache bằng SoftReference**: triệu chứng là heap luôn gần đầy, GC dày, và cache trống trơn đúng giờ cao điểm khiến DB quá tải. Cách tránh: Caffeine có {{maximumSize}} và metric.
- **Dùng WeakHashMap làm cache theo key String literal**: entry không bao giờ bị xoá (literal được intern, luôn reachable). Cách tránh: chỉ dùng WeakHashMap khi key là object có vòng đời do code khác quản lý.
- **Action của Cleaner tham chiếu tới this**: object không bao giờ chết, tài nguyên native rò rỉ. Cách tránh: action là static nested class/record chỉ giữ dữ liệu cần dọn.
- **Dựa vào Cleaner/finalize thay cho close()**: tài nguyên được trả rất muộn hoặc không bao giờ. Cách tránh: try-with-resources là đường chính.

### Trả lời miệng 1 phút
"Java có bốn mức reference. Strong giữ object sống. Soft chỉ bị thu khi heap căng và chắc chắn bị thu trước OOM. Weak bị thu ở lần GC đầu tiên thấy object chỉ còn weak, dùng trong WeakHashMap hay gắn metadata cho object của người khác. Phantom thì get luôn trả null, chỉ để biết object đã chết qua ReferenceQueue và dọn tài nguyên native; từ JDK 9 tôi dùng Cleaner thay vì tự viết. Tôi tránh SoftReference cache vì việc evict do GC quyết theo áp lực heap chứ không theo kích thước hay giá trị: cache làm heap luôn đầy rồi bị xả hàng loạt lúc tải cao. Thay vào đó tôi dùng Caffeine có giới hạn kích thước, expire và thống kê hit rate."

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

### Hiểu nhanh
Khởi động một service Spring Boot giống mở cửa một nhà hàng mỗi sáng: phải bày bàn ghế (load class), sắp xếp nhân viên (tạo bean), và đầu bếp mất một lúc mới vào nhịp (JIT warm-up). **CDS** giống để sẵn bàn ghế đã bày từ hôm trước. **Spring AOT** giống in sẵn bảng phân công thay vì sáng nào cũng họp. **CRaC** giống chụp ảnh nhà hàng lúc đang chạy nhịp nhàng rồi "dịch chuyển tức thời" về đúng trạng thái đó. **Native image** giống xây hẳn một quầy bán đồ ăn nhanh: mở là bán ngay, nhưng thực đơn cố định, khó thay đổi.

### Thuật ngữ
- **CDS (Class Data Sharing)**: lưu class đã parse vào file archive (.jsa) để lần sau nạp nhanh hơn.
- **AppCDS**: CDS mở rộng cho cả class của ứng dụng, không chỉ của JDK.
- **AOT cache**: bản nâng cấp CDS từ JDK 24, lưu cả class đã load và link (và từ JDK 25 có cả method profile).
- **Spring AOT**: bước build sinh sẵn code Java cho bean definition thay vì dùng reflection lúc chạy.
- **CRaC (Coordinated Restore at Checkpoint)**: chụp snapshot JVM đã warm rồi khôi phục, dựa trên CRIU của Linux.
- **Closed-world**: giả định của native image rằng mọi code có thể chạy đều biết trước lúc build.
- **Reachability metadata**: file khai báo reflection, proxy, resource cho native image.
- **Scale-to-zero**: tắt hết instance khi không có tải, khởi động lại khi có request.

### Bốn hướng xếp theo mức đánh đổi (từng bước)
1. **CDS/AppCDS**: gần như không đổi code; cắt phần load/verify class. Vì sao làm trước tiên: rẻ nhất, rủi ro thấp nhất.
2. **Spring AOT**: thêm bước build, đổi lại cấu hình bị "đóng băng" theo bản build.
3. **CRaC**: phải dùng JDK có CRaC và viết hook đóng/mở tài nguyên; được cả khởi động nhanh lẫn JIT đã warm.
4. **Native image**: đổi toàn bộ cách build và chạy; khởi động nhanh nhất, RAM thấp nhất, nhưng peak throughput thường thấp hơn.

~~~text
Ví dụ minh hoạ thứ tự độ lớn (Spring Boot cỡ vừa, số thật tuỳ app)
JVM thường            ~ 6-8 s
+ CDS/AOT cache       ~ 4-5 s
+ Spring AOT          ~ 3-4 s
CRaC restore          ~ 0.1-0.3 s  (JIT đã warm)
Native image          ~ 0.05-0.1 s (không JIT)
~~~

### Thời gian khởi động đi đâu
Load và verify hàng chục nghìn class; Spring quét classpath và tạo bean bằng reflection; JIT chưa warm nên code chạy bằng interpreter. CDS và AOT nhắm vào hai phần đầu. Chỉ CRaC và native image giải quyết được cả warm-up.

### CDS / AppCDS
- Từ JDK 12 đã có sẵn archive cho class của JDK, bật mặc định. AppCDS (mở cho mọi người từ JDK 10) thêm class của ứng dụng vào archive.
- Cách đơn giản (JDK 13+): chạy thử một lần với {{-XX:ArchiveClassesAtExit=app.jsa}}, các lần sau chạy với {{-XX:SharedArchiveFile=app.jsa}}. Từ JDK 19 có {{-XX:+AutoCreateSharedArchive}} để tự tạo và tự tạo lại archive.
- Spring Boot 3.3+ hỗ trợ sẵn: giải nén jar ({{java -Djarmode=tools -jar app.jar extract}}), chạy training với {{-Dspring.context.exit=onRefresh}} để app khởi động xong thì thoát và ghi archive.
- Archive chỉ dùng được với **đúng** bản JDK và classpath lúc tạo; lệch thì JVM bỏ qua archive (chỉ cảnh báo). Vì vậy phải tạo archive ngay trong lúc build Docker image.
- CDS không lưu code đã JIT. Mức cải thiện thường vào khoảng vài chục phần trăm thời gian khởi động. JDK 24 (JEP 483) mở rộng thành AOT cache, lưu cả class đã được load và link sẵn. JDK 25 làm gọn quy trình tạo cache ({{-XX:AOTCacheOutput}}, JEP 514) và lưu thêm method profile (JEP 515) để JIT có dữ liệu ngay từ đầu, giảm cả thời gian warm-up.

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

### Lỗi hay gặp
- **Tạo CDS archive trên máy dev rồi copy vào image**: JDK hoặc classpath lệch, JVM bỏ qua archive, chẳng nhanh hơn chút nào. Cách tránh: tạo archive trong chính bước build Docker, kiểm tra log {{-Xlog:cds}}.
- **Bật Spring AOT rồi đổi profile lúc chạy**: bean không như mong đợi. Cách tránh: build riêng cho từng cấu hình hoặc không dùng AOT trên JVM.
- **CRaC snapshot giữ connection DB cũ**: sau restore mọi query lỗi. Cách tránh: implement {{org.crac.Resource}} hoặc dùng tích hợp lifecycle của Spring.
- **Chuyển native image cho service chạy lâu**: throughput giảm, build CI chậm, lỗi reflection lúc chạy. Cách tránh: chỉ chọn khi startup/RAM thật sự là nút thắt.

### Trả lời miệng 1 phút
"Thời gian khởi động đến từ load class, Spring tạo bean bằng reflection, và JIT chưa warm. CDS hay AppCDS lưu class đã parse vào archive, gần như không phải đổi code, giảm vài chục phần trăm; từ JDK 24 thành AOT cache và JDK 25 lưu cả method profile. Spring AOT sinh sẵn bean definition lúc build nhưng đóng băng profile và điều kiện. CRaC chụp snapshot JVM đã warm rồi restore trong vài trăm mili giây, nhưng cần JDK hỗ trợ và hook đóng mở kết nối, snapshot còn chứa secret. Native image khởi động vài chục mili giây, RAM thấp, nhưng closed-world và peak throughput thường thấp hơn. Với service K8s chạy lâu tôi dừng ở CDS và warm-up tốt; serverless hay CLI mới đầu tư CRaC hoặc native."

> Senior tip: trước khi tối ưu startup, hãy hỏi "ai đang chờ startup?". Với service K8s rolling update, 20 giây khởi động thường không ai thấy; thứ gây sự cố là pod nhận traffic khi JIT chưa warm, khiến p99 tăng vọt trong vài phút đầu. Hãy đo bằng {{BufferingApplicationStartup}} kèm endpoint startup của actuator để xem bean nào chậm: nhiều khi chỉ một bean gọi mạng lúc khởi động đã chiếm nửa thời gian.`,
  follow: [
    'AppCDS archive bị vô hiệu khi nào, và bạn tích hợp nó vào Docker build thế nào?',
    'CRaC snapshot chứa những gì, xử lý connection pool và secret thế nào khi restore?',
    'Spring AOT ràng buộc gì với @Profile và @ConditionalOnProperty?'
  ],
  tags: ['CDS', 'AppCDS', 'Spring AOT', 'CRaC', 'GraalVM', 'startup'],
  refs: [
    { type: 'doc', title: 'Class Data Sharing (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/vm/class-data-sharing.html' },
    { type: 'doc', title: 'JEP 483: Ahead-of-Time Class Loading and Linking', url: 'https://openjdk.org/jeps/483' },
    { type: 'doc', title: 'JEP 515: Ahead-of-Time Method Profiling', url: 'https://openjdk.org/jeps/515' },
    { type: 'doc', title: 'Spring Framework: JVM Checkpoint Restore', url: 'https://docs.spring.io/spring-framework/reference/integration/checkpoint-restore.html' },
  ]
},
{
  id: 'jvm-018',
  topic: 'jvm',
  level: 'senior',
  q: 'async-profiler: CPU vs wall-clock vs alloc vs lock mode, đọc flame graph để tìm hot path như thế nào?',
  a: `**Tóm tắt:** async-profiler là profiler lấy mẫu cho HotSpot. Nó lấy stack trace mà không cần chờ safepoint, nên không bị safepoint bias như các profiler JVMTI cổ điển, và thấy được cả frame native lẫn kernel. Chọn mode theo câu hỏi cần trả lời: **cpu** — ai đang đốt CPU; **wall** — thread đang ở đâu theo thời gian thực, kể cả lúc chờ I/O hay lock (dùng để tìm latency); **alloc** — ai cấp phát nhiều (nguồn áp lực GC); **lock** — ai chờ lock lâu. Trên flame graph, chiều rộng là tỷ lệ sample chứ trục X không phải thời gian; hãy tìm frame rộng, đặc biệt là các "đỉnh phẳng" (self time) ở trên cùng.

### Hiểu nhanh
Profiler lấy mẫu giống một người cầm sổ đi qua văn phòng **mỗi 10 ms** và ghi lại mỗi nhân viên đang làm gì. Sau 30 giây, việc nào xuất hiện nhiều lần nhất trong sổ chính là việc chiếm nhiều thời gian nhất. Mode **cpu** chỉ ghi người đang thực sự làm việc; **wall** ghi cả người đang ngồi chờ điện thoại (chờ DB, chờ lock); **alloc** ghi ai đang lấy nhiều giấy mới (tạo object); **lock** ghi ai đang xếp hàng chờ chìa khoá. Flame graph là bản tổng hợp cuốn sổ: khối càng rộng, việc đó càng hay bị bắt gặp.

### Thuật ngữ
- **Sampling profiler**: profiler chụp stack định kỳ thay vì đo mọi lời gọi, nên overhead thấp.
- **Safepoint bias**: lỗi của profiler cũ chỉ lấy stack ở safepoint, nên chỉ sai chỗ nóng.
- **perf_events**: cơ chế của Linux kernel để đếm chu kỳ CPU và lấy mẫu.
- **Wall-clock**: thời gian thực trôi qua, gồm cả lúc thread ngủ hoặc chờ.
- **TLAB**: vùng cấp phát riêng của mỗi thread trong Eden; async-profiler lấy mẫu allocation theo TLAB.
- **Flame graph**: biểu đồ stack chồng lên nhau, chiều rộng là tỉ lệ sample.
- **Self time**: thời gian tiêu tốn ngay trong method, không tính method con.
- **Inclusive time**: thời gian của method cộng mọi method nó gọi.

### Từ sample tới flame graph (từng bước)
1. Mỗi khoảng (mặc định 10 ms với cpu), async-profiler nhận tín hiệu và chụp stack của thread đang chạy — không cần chờ safepoint. Vì sao quan trọng: chụp đúng chỗ đang chạy, không bị lệch.
2. Các stack giống nhau được gộp lại và đếm số lần.
3. Mỗi frame vẽ thành một khối, khối con nằm trên khối cha; chiều rộng tỉ lệ số sample.
4. Bạn đọc từ dưới lên: tìm nhánh rộng thuộc code của mình, rồi tìm đỉnh phẳng (self time) trên nhánh đó.

~~~text
            [ writeValueAsString 40% ]      [ regex 10% ]
       [ OrderController.get ......... 55% ][ Report 15% ]
  [ DispatcherServlet ................................ 70% ]
[ Thread.run ................................................ 100% ]
   rộng = nhiều sample; đỉnh phẳng 40% = ứng viên tối ưu số 1
~~~

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

### Lỗi hay gặp
- **Dùng cpu mode để tìm latency**: flame graph không có gì nổi bật vì thread chủ yếu đang chờ. Cách tránh: dùng wall với {{-t}}.
- **Đọc trục X như thời gian**: kết luận "cái này chạy trước". Cách tránh: nhớ trái phải chỉ là thứ tự tên, chỉ chiều rộng có ý nghĩa.
- **Container chặn perf_events**: lệnh báo lỗi quyền hoặc ra kết quả rỗng. Cách tránh: {{-e itimer}}/{{ctimer}} hoặc cấp quyền phù hợp.
- **Tối ưu theo một lần chụp 5 giây**: mẫu quá ít, nhiễu. Cách tránh: chụp 30–60 giây dưới tải đại diện, so sánh trước/sau.

### Trả lời miệng 1 phút
"async-profiler là profiler lấy mẫu cho HotSpot, nó chụp stack mà không cần safepoint nên không bị safepoint bias và thấy cả frame native lẫn kernel. Tôi chọn mode theo câu hỏi: cpu để biết ai đốt CPU, wall để biết request đang chờ ở đâu, alloc để biết ai sinh rác làm GC dày, lock để biết ai tranh chấp khoá. Trên flame graph, chiều rộng là tỉ lệ sample chứ trục ngang không phải thời gian; tôi đi từ dưới lên tìm nhánh code của mình rồi nhìn các đỉnh phẳng là self time. Trade-off với JFR là async-profiler mạnh về native và wall-clock, còn JFR chạy nền liên tục với nhiều loại event. Khi điều tra latency tôi luôn chạy wall trước cpu."

> Senior tip: khi điều tra latency, tôi chạy wall với {{-t}} trước cpu. CPU profile chỉ thấy phần thời gian thread thực sự chạy; nếu 80% thời gian của request là chờ connection pool thì tối ưu hot method trên flame graph cpu chỉ cải thiện phần nhỏ còn lại. Và luôn chụp flame graph trước và sau khi sửa để chứng minh tác động bằng số.`,
  follow: [
    'async-profiler và JFR: khi nào bạn chọn cái nào?',
    'Safepoint bias là gì và vì sao nó làm profiler cổ điển chỉ sai chỗ?',
    'Flame graph có nhiều frame màu vàng (C++ của JVM) — bạn hiểu điều đó thế nào?'
  ],
  tags: ['async-profiler', 'flame graph', 'profiling', 'CPU', 'wall-clock', 'alloc', 'lock'],
  refs: [
  ]
},
{
  id: 'concurrency-021',
  topic: 'concurrency',
  level: 'mid',
  q: 'Một thread Java có những trạng thái nào (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)? Chuyển trạng thái xảy ra khi nào, và khi đọc thread dump bạn suy ra được gì từ trạng thái?',
  a: `**Tóm tắt:** {{Thread.State}} có 6 giá trị: NEW (đã tạo, chưa start), RUNNABLE (đang chạy hoặc sẵn sàng chạy, kể cả khi đang chờ I/O ở tầng OS), BLOCKED (chờ vào monitor của {{synchronized}}), WAITING (chờ không thời hạn: {{wait()}}, {{join()}}, {{LockSupport.park()}}), TIMED_WAITING (chờ có thời hạn: {{sleep}}, {{wait(ms)}}, {{parkNanos}}), TERMINATED (run đã kết thúc). Các điểm interviewer hay vặn: Java không có trạng thái "RUNNING" riêng; thread đang đọc socket vẫn là RUNNABLE; thread chờ {{ReentrantLock}} là WAITING chứ không phải BLOCKED.

### Hiểu nhanh
Hãy nghĩ thread như một nhân viên trong văn phòng. NEW: đã ký hợp đồng nhưng chưa đi làm. RUNNABLE: đang ở bàn làm việc — có thể đang gõ phím, cũng có thể đang chờ máy in (Java không phân biệt). BLOCKED: đứng xếp hàng trước phòng họp có người đang dùng ({{synchronized}}). WAITING: ngồi chờ đến khi có người gọi tên, không hẹn giờ. TIMED_WAITING: đặt báo thức "chờ tối đa 5 phút". TERMINATED: đã nghỉ việc, không thể gọi quay lại. Đọc thread dump giống nhìn ảnh chụp cả văn phòng: 180 người cùng đứng ở một cửa là biết chỗ nghẽn.

### Thuật ngữ
- **Thread.State**: enum 6 giá trị mô tả trạng thái thread theo góc nhìn của JVM.
- **Monitor**: khoá gắn với object, dùng bởi synchronized; chờ monitor là BLOCKED.
- **Parking**: cơ chế {{LockSupport.park()}} cho thread ngủ; là nền của ReentrantLock, BlockingQueue, Future.get.
- **Thread dump**: ảnh chụp trạng thái và stack của mọi thread ({{jstack}}, {{jcmd Thread.print}}).
- **nid (native id)**: id của thread ở mức hệ điều hành, dùng để ghép với {{top -H}}.
- **Carrier thread**: platform thread đang chạy một virtual thread.
- **IllegalThreadStateException**: lỗi khi gọi start() lần hai trên cùng một Thread.

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
- Thread **RUNNABLE** ở {{socketRead}} hoặc {{NioSocketImpl.read}}: đang chờ mạng nhưng vẫn hiện RUNNABLE, đừng kết luận là đang tốn CPU. Muốn biết thread nào đốt CPU, ghép {{top -H}} với nid trong dump (JDK cũ như 8, 11 in nid dạng hex, JDK mới in dạng thập phân; xem kỹ định dạng trước khi so).
- Chụp 3 dump cách nhau vài giây: thread đứng yên một chỗ qua cả 3 lần mới là nghi phạm.

### Câu trả lời sai phổ biến
- "Có trạng thái RUNNING và READY": đó là trạng thái của OS; Java gộp cả hai thành RUNNABLE.
- "Thread chờ ReentrantLock là BLOCKED": sai, là WAITING (parking), vì Lock dùng {{LockSupport.park}}. BLOCKED chỉ dành cho monitor của synchronized.
- "sleep làm thread BLOCKED": sai, là TIMED_WAITING.

### Virtual thread (Java 21)
{{getState()}} vẫn trả về 6 trạng thái này. Virtual thread chờ I/O hay chờ lock thì được unmount khỏi carrier và nằm ở WAITING/TIMED_WAITING, không chiếm platform thread. Thread dump thường không liệt kê đủ virtual thread; dùng {{jcmd <pid> Thread.dump_to_file -format=json <file>}}.

### Lỗi hay gặp
- **Thấy nhiều RUNNABLE rồi kết luận "CPU cao do code"**: thực ra thread đang chờ socket. Cách tránh: đo CPU bằng {{top -H}}, async-profiler; dump chỉ cho biết đang đứng ở đâu.
- **Bỏ qua thread WAITING ở getConnection**: triệu chứng là API timeout hàng loạt trong khi CPU thấp. Cách tránh: nhận ra pool connection cạn, xem metric Hikari (pending, active) và tìm chỗ giữ connection lâu.
- **Chỉ chụp một dump**: không phân biệt được thread kẹt với thread tình cờ đi ngang. Cách tránh: chụp 3 lần cách nhau vài giây.
- **Gọi start() lần hai để "chạy lại" thread**: ném IllegalThreadStateException. Cách tránh: tạo Thread mới hoặc submit lại vào executor.

### Trả lời miệng 1 phút
"Thread Java có sáu trạng thái: NEW khi mới tạo, RUNNABLE sau khi start, gồm cả đang chạy, chờ CPU lẫn đang chờ I/O ở tầng OS; BLOCKED khi chờ vào monitor của synchronized; WAITING khi chờ không thời hạn như wait, join, park; TIMED_WAITING khi có thời hạn như sleep hay wait có timeout; và TERMINATED khi run kết thúc. Điểm hay bị hỏi vặn là thread chờ ReentrantLock là WAITING chứ không phải BLOCKED, và thread đọc socket vẫn là RUNNABLE. Khi đọc dump tôi chụp ba lần, nhóm thread theo stack giống nhau: nhiều BLOCKED cùng một lock là tranh chấp, nhiều WAITING ở getConnection là cạn connection pool, còn CPU thì phải đo bằng top -H hoặc profiler."

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

### Hiểu nhanh
Hãy tách hai khái niệm: **việc** và **người làm**. Runnable là tờ giấy ghi việc ("dọn kho"), Callable là tờ giấy ghi việc kèm yêu cầu báo cáo kết quả ("đếm hàng trong kho, báo lại số"). Thread là người làm. ExecutorService là công ty dịch vụ có sẵn một đội người làm: bạn chỉ việc đưa tờ giấy, họ tự phân người và trả cho bạn một "phiếu hẹn" (Future) để lấy kết quả. Virtual thread là đội cộng tác viên rất đông và rất rẻ, hợp với việc chủ yếu là ngồi chờ. Gọi {{run()}} thay vì {{start()}} giống như bạn cầm tờ giấy giao việc rồi **tự mình làm luôn** — việc vẫn xong, nhưng không có ai làm song song.

### Thuật ngữ
- **Runnable**: interface có method {{run()}}, không trả kết quả, không ném checked exception.
- **Callable**: interface có method {{call()}}, trả kết quả và ném được exception.
- **Future**: đại diện kết quả sẽ có trong tương lai; {{get()}} chờ lấy kết quả.
- **ExecutionException**: lỗi bọc exception mà task ném ra, nhận được khi gọi {{Future.get()}}.
- **ExecutorService**: dịch vụ quản lý một nhóm thread và hàng đợi task.
- **Platform thread**: thread Java gắn 1-1 với thread của OS.
- **Virtual thread**: thread nhẹ do JVM quản lý (Java 21+), hợp với task chờ I/O.
- **@Async**: annotation của Spring để chạy method trên executor khác.

### Luồng start() (từng bước)
~~~text
main: t.start()
  1. JVM kiểm tra trạng thái NEW (không phải thì ném IllegalThreadStateException)
  2. Gọi native tạo thread OS mới, cấp stack riêng
  3. Thread chuyển NEW -> RUNNABLE, start() trả về ngay cho main
  4. Thread mới gọi run() -> chạy lambda
main vẫn chạy tiếp song song      |      worker chạy run()

main: t.run()   -> chỉ là lời gọi method: run() chạy trên chính main, xong mới tới dòng sau
~~~

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

### Lỗi hay gặp
- **Gọi run() thay vì start()**: triệu chứng là "song song" mà thời gian tổng bằng tổng từng việc, log thấy tên thread là main/http-nio. Cách tránh: dùng executor thay vì tự quản Thread; review mọi chỗ {{.run()}} trên object Thread.
- **new Thread() trong mỗi request**: triệu chứng là số thread tăng vọt khi spike, "unable to create native thread". Cách tránh: executor bounded dùng chung, hoặc virtual thread kèm giới hạn tài nguyên.
- **submit() mà không bao giờ get()**: exception của task biến mất. Cách tránh: try/catch + log trong task, hoặc dùng execute() để exception tới UncaughtExceptionHandler.
- **Future.get() không timeout**: thread gọi treo mãi khi task treo. Cách tránh: {{get(timeout, unit)}}.

### Trả lời miệng 1 phút
"Thread là người làm, còn Runnable và Callable là việc: Runnable không trả kết quả, Callable trả kết quả và ném được exception, lấy qua Future. start() mới tạo thread OS mới rồi gọi run trên thread đó; gọi thẳng run() chỉ là gọi method trên thread hiện tại, không lỗi gì nhưng mất song song, nên bug này hay chỉ lộ khi load test. Trong service thật tôi không new Thread mà submit vào ExecutorService có giới hạn, thread có tên và có shutdown; với Java 21 và task chờ I/O thì dùng virtual thread, nhưng vẫn giới hạn tài nguyên phía sau bằng semaphore hoặc connection pool. Với Spring thì dùng ThreadPoolTaskExecutor hoặc bật spring.threads.virtual.enabled."

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

### Hiểu nhanh
Hãy tưởng tượng bạn đang giữ chìa khoá phòng họp. {{sleep()}} là ngủ gật ngay trong phòng mà vẫn cầm chìa: không ai vào được. {{wait()}} là ra ghế chờ và **trả lại chìa khoá của đúng phòng đó** để người khác vào làm việc, ai xong thì gọi bạn. {{join()}} là đứng chờ một đồng nghiệp làm xong việc của họ — chìa khoá nào bạn đang cầm thì vẫn cầm. {{yield()}} là nói "ai cần thì cứ dùng máy tính trước" — lời mời lịch sự, người khác có thể chẳng để ý.

### Thuật ngữ
- **Monitor**: khoá gắn với mỗi object, dùng bởi synchronized, wait, notify.
- **IllegalMonitorStateException**: lỗi khi gọi wait/notify mà không giữ monitor của object đó.
- **Lost wakeup**: tín hiệu notify đến trước khi thread kịp chờ, nên thread ngủ mãi.
- **Spurious wakeup**: thread tự thức dậy dù không ai notify.
- **Scheduler**: phần của OS quyết định thread nào được chạy trên CPU.
- **Thread.onSpinWait()**: gợi ý cho CPU rằng thread đang chờ bận (spin), giúp CPU tối ưu (Java 9+).
- **Awaitility**: thư viện test chờ điều kiện xảy ra thay vì sleep cố định.

### Ai giữ lock khi đang chờ
~~~text
Thread A giữ lock L1 và L2:
  Thread.sleep(1000)  -> vẫn giữ L1, L2 (mọi thread cần L1/L2 bị BLOCKED)
  L2.wait()           -> nhả L2, VẪN giữ L1  (cẩn thận deadlock)
  other.join()        -> vẫn giữ L1, L2
  Thread.yield()      -> vẫn giữ L1, L2, có thể chạy tiếp ngay
~~~

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

### Lỗi hay gặp
- **sleep() hoặc gọi API/DB bên trong synchronized**: triệu chứng là thread dump đầy BLOCKED ở cùng một lock, throughput tụt về vài request/giây. Cách tránh: chỉ giữ lock cho thao tác bộ nhớ ngắn, I/O để ngoài.
- **Gọi wait() mà không giữ monitor**: ném IllegalMonitorStateException ngay khi chạy. Cách tránh: wait/notify luôn nằm trong {{synchronized (cùng object)}}.
- **join(timeout) rồi tưởng thread kia đã xong**: hết giờ join không ném lỗi, code chạy tiếp với dữ liệu chưa sẵn sàng. Cách tránh: kiểm tra {{isAlive()}}, hoặc dùng {{Future.get(timeout)}} vốn ném TimeoutException.
- **Dùng sleep/yield trong test để "chờ thread kia"**: test flaky, chạy chậm. Cách tránh: CountDownLatch hoặc Awaitility.

### Trả lời miệng 1 phút
"Trong bốn hàm này chỉ wait nhả lock, và chỉ nhả monitor của chính object được gọi wait, nên nó bắt buộc phải gọi khi đang giữ monitor đó, nếu không sẽ ném IllegalMonitorStateException. Lý do là kiểm tra điều kiện và đi ngủ phải nguyên tử để không mất tín hiệu. sleep chỉ tạm dừng thread và giữ nguyên mọi lock, nên sleep trong synchronized là bug kinh điển làm mọi thread khác BLOCKED. join chờ thread khác kết thúc, bên trong dùng wait trên object Thread nên chỉ nhả monitor của Thread đó. yield chỉ là gợi ý cho scheduler. Trong code mới tôi thay join bằng Future hay CountDownLatch, và không dùng sleep để đồng bộ."

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

### Hiểu nhanh
Mỗi object Java có sẵn một ổ khoá riêng, và mỗi class cũng có một ổ khoá riêng (ổ khoá của object {{Class}}). {{synchronized}} trên instance method giống khoá cửa **từng căn hộ**: hai người vào hai căn hộ khác nhau không chặn nhau. {{static synchronized}} giống khoá cổng **toà nhà**: nhưng khoá cổng toà nhà và khoá cửa căn hộ là hai ổ khác nhau, nên một người cầm chìa cổng và một người cầm chìa căn hộ vẫn đi song song được. Bug xảy ra khi đồ dùng chung của cả toà nhà (field static) lại chỉ được bảo vệ bằng chìa của từng căn hộ.

### Thuật ngữ
- **Object lock (instance lock)**: monitor của một object cụ thể, ví dụ {{this}}.
- **Class lock**: monitor của object {{Class}} ({{Foo.class}}), dùng bởi static synchronized.
- **Monitor**: khoá gắn với mỗi object, có owner và hàng chờ.
- **Reentrant**: thread đang giữ lock có thể lấy lại chính lock đó khi gọi lồng nhau.
- **monitorenter / monitorexit**: lệnh bytecode để vào/ra block synchronized.
- **ACC_SYNCHRONIZED**: cờ trong bytecode đánh dấu method synchronized.
- **Value-based class**: class như Integer, LocalDate mà identity không nên được dựa vào (không nên dùng làm lock).
- **Lock inflation**: JVM nâng lock nhẹ lên monitor đầy đủ khi có tranh chấp.

### Cách JVM chọn object để khoá (từng bước)
1. Gặp {{synchronized}} instance method → lock = {{this}} của lần gọi đó.
2. Gặp {{static synchronized}} → lock = object {{Foo.class}} (mỗi class loader một object).
3. Gặp {{synchronized (x)}} → lock = object mà x trỏ tới **tại thời điểm vào block**.
4. Hai thread chỉ chặn nhau khi bước trên trả về **cùng một object**. Vì sao: mỗi object có monitor riêng, JVM không có khái niệm "khoá cả class kèm mọi instance".

~~~text
           Foo.class (class lock)      a1 (object lock)      a2 (object lock)
T1: Foo.staticSync()  -> giữ
T2: a1.syncMethod()                      -> giữ        (không chờ T1)
T3: a2.syncMethod()                                           -> giữ (không chờ ai)
T4: a1.otherSync()                       -> CHỜ T2
~~~

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

### Lỗi hay gặp
- **Instance synchronized bảo vệ field static**: triệu chứng là trùng ID, đếm sai khi có hơn một instance (test tạo new, prototype bean). Cách tránh: khoá theo phạm vi dữ liệu, hoặc AtomicLong.
- **synchronized trên String literal hoặc Integer**: triệu chứng là chậm hoặc deadlock "vô lý" giữa hai module không liên quan vì dùng chung object được intern/cache. Cách tránh: {{private final Object lock = new Object()}}.
- **Gán lại field dùng làm lock**: hai thread khoá hai object khác nhau, mất loại trừ. Cách tránh: lock luôn là field final.
- **Dùng synchronized để chống trùng trên nhiều pod**: mỗi JVM một lock, vẫn trùng. Cách tránh: UPDATE có điều kiện, unique constraint, hoặc lock ở DB.

### Trả lời miệng 1 phút
"synchronized luôn khoá một object cụ thể: instance method khoá this, static method khoá object Class, còn block khoá object tôi chỉ định. Hai thread chỉ chặn nhau khi cùng khoá một object, nên static synchronized và instance synchronized của cùng class chạy song song được, và hai instance khác nhau cũng không chặn nhau. Bug hay gặp là dùng instance synchronized để bảo vệ field static: chỉ cần có hai instance là sinh trùng dữ liệu. Nguyên tắc của tôi là lock phải cùng phạm vi với dữ liệu, dùng private final Object làm lock, không khoá trên String hay Integer, và nhớ synchronized chỉ có tác dụng trong một JVM, nhiều pod thì phải khoá ở DB."

> Senior tip: khi thấy synchronized trên method public của một Spring bean, tôi hỏi hai câu: dữ liệu được bảo vệ nằm ở đâu, và service chạy mấy instance? Nếu dữ liệu ở DB thì lock trong JVM vô nghĩa khi có nhiều pod; nếu dữ liệu là field static thì khoá this là sai phạm vi. Hai câu đó bắt được phần lớn bug đồng bộ trong code nghiệp vụ.`,
  follow: [
    'Vì sao không nên synchronized trên String literal hoặc Integer?',
    'synchronized có reentrant không, và điều đó quan trọng khi nào?'
  ],
  tags: ['synchronized', 'class lock', 'object lock', 'monitor'],
  refs: [
    { type: 'doc', title: 'JLS 8.4.3.6: synchronized Methods', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.6' },
    { type: 'doc', title: 'JLS 14.19: The synchronized Statement', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.19' },
  ]
},
{
  id: 'concurrency-025',
  topic: 'concurrency',
  level: 'lead',
  q: '{{count++}} chạy từ nhiều thread cho kết quả sai: vì sao? Nêu các cách sửa trong một JVM, và khi service chạy nhiều instance (trừ tồn kho, đếm lượt dùng voucher) thì bạn làm thế nào với DB hoặc Redis?',
  a: `**Tóm tắt:** {{count++}} gồm ba bước đọc, cộng, ghi và không nguyên tử. Hai thread cùng đọc một giá trị cũ thì một lần cộng bị mất (lost update). {{volatile}} không sửa được vì nó chỉ đảm bảo visibility. Trong một JVM có thể dùng {{synchronized}}/Lock, {{AtomicInteger.incrementAndGet()}} (CAS), hoặc {{LongAdder}} khi ghi nhiều đọc ít. Khi chạy nhiều instance thì mọi lock trong JVM đều vô dụng: phải đưa phép kiểm tra và cập nhật về chính nơi lưu dữ liệu, như một câu {{UPDATE}} có điều kiện trong DB, optimistic locking bằng version, {{SELECT ... FOR UPDATE}}, hoặc {{DECR}}/Lua script trên Redis.

### Hiểu nhanh
{{count++}} giống hai thu ngân cùng cập nhật một tờ sổ tồn kho: cả hai cùng nhìn thấy "còn 5", mỗi người bán một món, rồi cùng ghi "còn 4". Thực tế bán 2 món mà sổ chỉ trừ 1. Trong một máy (một JVM) có thể bắt mọi người xếp hàng dùng sổ (lock) hoặc dùng "máy đếm tự động" (Atomic). Nhưng khi có 3 cửa hàng (3 pod) dùng chung một kho, mỗi cửa hàng có lock riêng chẳng giúp gì: phải để **chính kho** (DB/Redis) làm phép "kiểm tra còn hàng rồi trừ" trong một bước duy nhất.

### Thuật ngữ
- **Race condition**: kết quả phụ thuộc vào thứ tự chạy ngẫu nhiên giữa các thread.
- **Lost update**: hai lần cập nhật chồng lên nhau, một lần bị mất.
- **Read-modify-write**: thao tác đọc, tính, ghi — không nguyên tử nếu không được bảo vệ.
- **Check-then-act**: kiểm tra điều kiện rồi hành động; sai nếu điều kiện đổi giữa hai bước.
- **Optimistic locking**: không khoá trước, khi ghi kiểm tra version; xung đột thì retry.
- **Pessimistic locking**: khoá dòng trước khi đọc ({{SELECT ... FOR UPDATE}}) để người khác chờ.
- **Lua script (Redis)**: đoạn script chạy nguyên tử trên Redis server.
- **Fencing token**: số tăng dần đi kèm lock phân tán, giúp từ chối lần ghi của người giữ lock đã hết hạn.

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

### Lỗi hay gặp
- **Đọc lên, kiểm tra trong Java, rồi UPDATE giá trị mới** ({{SET qty = 4}}): triệu chứng là bán vượt tồn kho khi có flash sale. Cách tránh: {{SET qty = qty - 1 WHERE qty > 0}} và kiểm tra affected rows.
- **Optimistic locking cho dòng cực nóng**: triệu chứng là hàng loạt OptimisticLockException, retry dồn dập, DB càng tải. Cách tránh: UPDATE có điều kiện, hoặc giữ chỗ trên Redis.
- **GET rồi DECR trên Redis từ app**: vẫn là check-then-act, voucher bị dùng quá lượt. Cách tránh: một Lua script, hoặc {{DECR}} rồi kiểm tra kết quả âm thì hoàn lại.
- **Distributed lock không fencing**: GC pause dài làm lock hết hạn, hai instance cùng ghi. Cách tránh: fencing token hoặc điều kiện version trong câu ghi DB.

### Trả lời miệng 1 phút
"count++ gồm ba bước đọc, cộng, ghi nên không nguyên tử: hai thread cùng đọc 5 thì cùng ghi 6 và mất một lần tăng; volatile không sửa được vì nó chỉ lo visibility. Trong một JVM tôi dùng AtomicInteger cho giá trị cần chính xác, LongAdder cho metric ghi nhiều, hoặc lock khi phải cập nhật nhiều biến cùng lúc; và cẩn thận check-then-act, phải gộp kiểm tra và trừ vào một thao tác CAS. Khi chạy nhiều instance, lock trong JVM vô dụng, tôi đưa tính nguyên tử về DB: UPDATE có điều kiện như used nhỏ hơn max_uses rồi xem affected rows; xung đột hiếm thì optimistic locking, logic phức tạp thì SELECT FOR UPDATE. Khi một dòng quá nóng mới chuyển phần giữ chỗ sang Redis Lua kèm job đối soát."

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

### Hiểu nhanh
- **Deadlock** giống hai xe đối đầu trên cầu một làn: cả hai đứng im, không ai lùi.
- **Livelock** giống hai người lịch sự nhường đường ở hành lang hẹp: cùng bước sang trái, rồi cùng sang phải, cứ thế mãi — rất bận rộn mà không ai đi qua được.
- **Starvation** giống một người xếp hàng mà người quen của bảo vệ cứ chen lên trước: hàng vẫn chạy, chỉ riêng người đó mãi không tới lượt.
- **Fair lock** là quầy phát số thứ tự: công bằng tuyệt đối, nhưng mỗi lần gọi số phải chờ người đó đi từ ghế lên quầy, nên tổng số khách phục vụ mỗi giờ ít hơn.

### Thuật ngữ
- **Livelock**: các thread liên tục đổi trạng thái để phản ứng với nhau nhưng không ai hoàn thành việc.
- **Starvation**: một thread không bao giờ (hoặc rất lâu) mới được cấp tài nguyên.
- **Fair lock**: lock trao quyền theo thứ tự chờ (FIFO).
- **Barging (chen ngang)**: thread vừa tới lấy được lock ngay, bỏ qua các thread đang xếp hàng — hành vi của lock non-fair.
- **Backoff / jitter**: chờ một khoảng trước khi thử lại / cộng thêm độ trễ ngẫu nhiên để các bên lệch nhịp.
- **Retry storm**: rất nhiều client cùng retry một lúc, làm hệ thống đang quá tải càng quá tải.
- **Bulkhead**: tách tài nguyên (pool, queue) theo nhóm để nhóm này không làm đói nhóm khác.
- **Circuit breaker**: tạm ngừng gọi một dependency đang lỗi để nó có thời gian hồi phục.

### Vì sao lock non-fair nhanh hơn (từng bước)
1. Thread A nhả lock. Trong hàng chờ có B đang ngủ (park).
2. **Non-fair**: C đang chạy sẵn trên CPU, gọi lock() đúng lúc đó → CAS thành công ngay, làm xong việc trong vài micro giây. B được đánh thức sau và có thể vẫn kịp lấy lock khi C nhả.
3. **Fair**: C bắt buộc xếp sau B. JVM phải unpark B, chờ OS lập lịch B (thường cỡ micro giây đến hàng chục micro giây) — trong thời gian đó lock nằm không, không ai dùng.
4. Vì sao quan trọng: dưới tranh chấp cao, khoảng "lock nằm không" lặp lại ở mọi lần chuyển giao, nên throughput tổng của fair lock có thể thấp hơn nhiều.

~~~text
Non-fair: A nhả --> C (đang chạy) lấy ngay --> C nhả --> B (vừa thức) lấy
Fair:     A nhả --> [chờ đánh thức B ... lock trống] --> B lấy --> C phải xếp sau
~~~

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

### Lỗi hay gặp
- **tryLock + retry không backoff**: triệu chứng là CPU cao, request chuyển tiền ngược chiều cứ chạy mãi không xong. Cách tránh: khoá theo thứ tự id, hoặc backoff ngẫu nhiên.
- **Retry ngay lập tức khi timeout ở client**: triệu chứng là sau một sự cố nhỏ, lưu lượng tăng gấp 3–4 lần và hệ thống sập hẳn. Cách tránh: exponential backoff + jitter, giới hạn số lần retry, circuit breaker.
- **Một pool chung cho mọi loại việc**: report nặng chiếm hết thread, API thanh toán ngắn bị đói. Cách tránh: bulkhead, mỗi loại việc một pool/semaphore.
- **Bật fair lock "cho chắc"**: throughput giảm mạnh mà vấn đề gốc (giữ lock quá lâu) vẫn còn. Cách tránh: rút ngắn critical section trước, đo rồi mới cân nhắc fair.

### Trả lời miệng 1 phút
"Deadlock là các thread đứng im chờ nhau mãi, CPU thấp, JVM phát hiện được trong thread dump. Livelock là các thread vẫn chạy, liên tục nhả ra rồi thử lại theo nhau, CPU cao mà không ai tiến; ví dụ hai thread chuyển tiền ngược chiều dùng tryLock không có backoff, hay retry storm trong hệ phân tán. Starvation là hệ thống vẫn chạy nhưng một số thread mãi không tới lượt, ví dụ do lock non-fair hoặc một tenant chiếm hết pool. Fair lock trao lock theo thứ tự chờ nên chống starvation, nhưng mất khả năng chen ngang và mỗi lần chuyển giao phải đánh thức thread đang ngủ, nên throughput giảm đáng kể. Tôi chỉ dùng nó khi đo thấy starvation thật, sau khi đã thử rút ngắn thời gian giữ lock."

> Senior tip: livelock tôi gặp nhiều nhất không nằm trong code Java mà ở chính sách retry: client timeout 1 giây và retry ngay 3 lần, service vốn đang chậm vì quá tải lại càng quá tải hơn. Exponential backoff có jitter và circuit breaker chính là "fair lock" của hệ phân tán. Còn starvation trong JVM thường lộ ra qua p99.9 của một nhóm request tăng vọt; lúc đó tôi thử giảm thời gian giữ lock trước, fair lock là lựa chọn sau cùng.`,
  follow: [
    'Vì sao lock non-fair lại cho throughput cao hơn fair lock?',
    'Retry storm có phải livelock không? Bạn thiết kế retry thế nào để tránh?'
  ],
  tags: ['livelock', 'starvation', 'fair lock', 'ReentrantLock', 'deadlock'],
  refs: [
    { type: 'doc', title: 'ReentrantLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html' },
    { type: 'book', title: 'Java Concurrency in Practice', url: 'https://jcip.net/' },
  ]
},
{
  id: 'concurrency-027',
  topic: 'concurrency',
  level: 'senior',
  q: 'Viết singleton thread-safe theo các cách eager, lazy holder và enum, rồi so sánh. Singleton có thể bị phá bằng reflection, serialization, clone hoặc nhiều class loader như thế nào, và cách nào chống được?',
  a: `**Tóm tắt:** Có ba cách đáng dùng: **eager** (field {{static final}} khởi tạo khi class được khởi tạo), **holder idiom** (lazy nhờ class lồng chỉ được khởi tạo khi truy cập lần đầu) và **enum** (JVM đảm bảo đúng một instance, chống reflection và serialization mà không phải làm gì thêm). Cả ba đều thread-safe nhờ JVM khoá trong lúc khởi tạo class (JLS 12.4.2), không cần volatile hay synchronized. Singleton bị phá bằng: reflection gọi constructor private, deserialization tạo object mới, {{clone()}} nếu class là Cloneable, và việc mỗi class loader có một bản class riêng. Enum chặn được reflection và serialization; còn class loader thì không có cách nào chặn trong code.

### Hiểu nhanh
Singleton giống con dấu của công ty: cả công ty chỉ được có một con dấu. **Eager** là khắc sẵn con dấu ngay khi thành lập công ty. **Holder** là chỉ khắc khi có người cần đóng dấu lần đầu, và có một quy trình đảm bảo dù 10 người cùng xin thì cũng chỉ khắc một con. **Enum** là con dấu do nhà nước cấp: không ai làm giả được (reflection), không ai photo ra thành con mới được (serialization). Còn "nhiều class loader" giống công ty có nhiều chi nhánh độc lập: mỗi chi nhánh tự khắc một con dấu riêng, và không có quy định nào trong code ngăn được điều đó.

### Thuật ngữ
- **Eager initialization**: tạo instance ngay khi class được khởi tạo.
- **Lazy initialization**: chỉ tạo instance khi có truy cập lần đầu.
- **Holder idiom**: dùng class lồng static để JVM khởi tạo lazy và thread-safe.
- **Class initialization lock**: khoá JVM dùng để phần khởi tạo static chạy đúng một lần (JLS 12.4.2).
- **Reflection**: API cho phép gọi constructor/method private lúc runtime.
- **readResolve**: method đặc biệt của serialization để thay object vừa đọc bằng object khác.
- **ClassLoader**: thành phần nạp class; cùng một file class nạp bởi hai loader là hai class khác nhau.
- **ExceptionInInitializerError**: lỗi khi phần khởi tạo static ném exception.

### Vòng đời khởi tạo class (vì sao không cần lock)
1. Lần đầu có thread gọi {{CoreBankClient.get()}} → JVM thấy class {{Holder}} chưa khởi tạo.
2. Thread đó lấy khoá khởi tạo của Holder, chạy {{static final I = new CoreBankClient()}}.
3. Thread khác gọi get() cùng lúc → thấy Holder đang được khởi tạo → **chờ**.
4. Khởi tạo xong → JVM đánh dấu "initialized", đánh thức các thread chờ; kết quả được publish an toàn (có happens-before).
5. Các lần sau → class đã khởi tạo, đọc field như bình thường, không còn chi phí khoá.

~~~text
T1: get() -> Holder chưa init -> lấy khoá init -> new CoreBankClient() -> xong, mở khoá
T2: get() -> Holder đang init bởi T1 -> chờ ......................... -> nhận cùng instance
T3: get() (sau đó) -> Holder đã init -> trả về ngay, không khoá
~~~

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

### Lỗi hay gặp
- **Constructor singleton gọi DB/mạng**: lỗi một lần là class hỏng vĩnh viễn (ExceptionInInitializerError rồi NoClassDefFoundError) tới khi restart. Cách tránh: khởi tạo nhẹ, kết nối lazy bên trong method, có retry.
- **Singleton Serializable không có readResolve**: sau khi deserialize (cache phân tán, session replication) có hai instance, trạng thái lệch nhau. Cách tránh: readResolve, hoặc dùng enum.
- **Singleton tĩnh giữ trạng thái mutable trong ứng dụng Spring**: test khó mock, test chạy song song ảnh hưởng nhau. Cách tránh: dùng bean singleton của Spring.
- **Hai instance do DevTools/app server dùng nhiều class loader**: cache "toàn cục" bị nhân đôi, cấu hình lệch. Cách tránh: đặt class ở loader dùng chung hoặc bỏ singleton tĩnh.

### Trả lời miệng 1 phút
"Tôi dùng ba cách: eager với static final, holder idiom khi cần lazy, và enum khi cần chống phá. Cả ba thread-safe nhờ JVM bảo đảm phần khởi tạo class chạy đúng một lần dưới khoá và publish an toàn, nên không cần volatile hay synchronized. Singleton bị phá bằng reflection gọi constructor private, deserialization tạo object mới, clone nếu class là Cloneable, và nhiều class loader. Enum chặn được reflection và serialization; với class thường thì kiểm tra trong constructor và thêm readResolve; còn class loader thì không chặn được trong code. Lưu ý thực tế là constructor ném exception thì class hỏng tới khi restart, và trong Spring tôi để container quản lý singleton thay vì tự viết."

> Senior tip: trong phỏng vấn, tôi trả lời gọn: "enum nếu cần chống reflection và serialization, holder nếu cần lazy, còn trong Spring thì không tự viết singleton". Interviewer thường vặn tiếp chuyện ExceptionInInitializerError; biết rằng class khởi tạo lỗi là "hỏng vĩnh viễn" tới khi restart cho thấy bạn đã thật sự debug chuyện này trên production.`,
  follow: [
    'Vì sao enum singleton không bị phá bằng reflection?',
    'Constructor của singleton ném exception thì những lần gọi sau chuyện gì xảy ra?',
    'Spring singleton bean khác singleton pattern thế nào?'
  ],
  tags: ['singleton', 'holder idiom', 'enum', 'reflection', 'serialization', 'class loader'],
  refs: [
    { type: 'doc', title: 'JLS 12.4.2: Detailed Initialization Procedure', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.2' },
    { type: 'doc', title: 'JLS 8.9: Enum Classes', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9' },
  ]
},
{
  id: 'jvm-019',
  topic: 'jvm',
  level: 'mid',
  q: 'JDK, JRE và JVM khác nhau thế nào? Mô tả đường đi từ file {{.java}} tới lúc code chạy ở tốc độ native: javac, bytecode, class loading, verify, interpreter, JIT.',
  a: `**Tóm tắt:** JVM là máy ảo thực thi bytecode (HotSpot là bản cài đặt phổ biến nhất). JRE = JVM + thư viện chuẩn, đủ để chạy chương trình. JDK = JRE + công cụ phát triển ({{javac}}, {{jar}}, {{jlink}}, {{jcmd}}, {{jfr}}...). Từ Java 11, Oracle không còn phát hành JRE riêng (một số vendor như Eclipse Temurin vẫn có gói JRE); thường ta dùng JDK hoặc tạo runtime tối giản bằng {{jlink}}. Đường đi: {{javac}} biên dịch .java thành bytecode (.class) độc lập nền tảng → class loader nạp, verify, link và khởi tạo class khi cần → interpreter chạy bytecode → method nóng được JIT (C1 rồi C2) biên dịch thành mã máy để thay thế.

### Hiểu nhanh
Hãy tưởng tượng bạn viết một công thức nấu ăn bằng một "ngôn ngữ bếp chung" (bytecode) thay vì tiếng của từng nước. **JVM** là đầu bếp đọc được ngôn ngữ chung đó, ở bất kỳ bếp nào (Linux, Windows, ARM). **JRE** là đầu bếp kèm bộ dụng cụ cơ bản (thư viện chuẩn) — đủ để nấu. **JDK** là tất cả những thứ đó cộng thêm dụng cụ cho người viết công thức (javac để dịch, jcmd/jstack để kiểm tra bếp). Lúc đầu đầu bếp đọc từng dòng công thức (interpreter); món nào nấu nhiều lần thì anh ta nhớ thuộc lòng và làm thật nhanh (JIT).

### Thuật ngữ
- **Bytecode**: tập lệnh trung gian trong file .class, độc lập hệ điều hành và CPU.
- **Constant pool**: bảng hằng số và tên tham chiếu (class, method, field) trong file .class.
- **Class loader**: thành phần tìm và nạp file .class vào JVM.
- **Verify**: bước kiểm tra bytecode hợp lệ, không phá vỡ an toàn kiểu.
- **Interpreter**: chạy bytecode từng lệnh một.
- **JIT (C1/C2)**: biên dịch method nóng thành mã máy lúc chạy.
- **Deoptimization**: bỏ mã máy đã tối ưu khi giả định sai, quay về interpreter.
- **jlink**: công cụ tạo runtime Java tối giản chỉ gồm các module cần dùng.

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

### Lỗi hay gặp
- **Image Docker dùng full JDK cho production**: image to, nhiều công cụ thừa. Cách tránh: dùng image JRE của vendor hoặc tạo runtime bằng {{jlink}}; nhớ giữ {{jcmd}} nếu cần chẩn đoán.
- **Compile bằng JDK mới nhưng chạy trên JRE cũ**: lỗi {{UnsupportedClassVersionError}}. Cách tránh: đặt {{--release}} đúng phiên bản runtime.
- **NoClassDefFoundError chỉ xuất hiện ở nhánh hiếm**: thiếu dependency nhưng test không chạm tới. Cách tránh: kiểm tra dependency scope, test cả các nhánh lỗi.
- **Đánh giá hiệu năng ngay sau deploy**: số liệu xấu do chưa warm-up. Cách tránh: đo sau vài phút hoặc warm-up trước khi nhận traffic.

### Trả lời miệng 1 phút
"JVM là máy ảo chạy bytecode, JRE là JVM cộng thư viện chuẩn để chạy ứng dụng, còn JDK là JRE cộng công cụ như javac, jar, jlink, jcmd. Đường đi là: javac dịch file java thành bytecode, khi code cần tới class lần đầu thì class loader nạp nó, JVM verify, prepare, resolve rồi chạy static initializer. Bytecode chạy bằng interpreter trước, method nóng được C1 biên dịch nhanh kèm profile, rồi C2 tối ưu mạnh; giả định sai thì deoptimize. Trade-off của thiết kế hai tầng là khởi động nhanh và tối ưu theo dữ liệu thật, nhưng phải trả giá bằng warm-up. Thực tế điều này giải thích vì sao p99 cao vài phút sau deploy và vì sao image dựng bằng jlink nhỏ hơn hẳn."

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

### Hiểu nhanh
Hãy tưởng tượng heap là một hội chợ và GC là ban tổ chức đi kiểm tra cuối ngày. Họ bắt đầu từ các **lối vào chính thức** (GC roots: thread đang chạy, static field) và đi theo mọi sợi dây nối giữa các gian hàng. Gian nào **đi tới được** thì còn hoạt động; gian nào không có đường nào tới thì bị dỡ, kể cả khi hai gian bỏ hoang nối dây với nhau. Leak xảy ra khi bạn quên tháo dây nối từ lối vào chính tới một gian không ai dùng nữa: ban tổ chức thấy vẫn đi tới được nên không dỡ.

### Thuật ngữ
- **Reachability analysis (tracing)**: đánh dấu object sống bằng cách đi từ GC roots theo reference.
- **GC roots**: tập điểm xuất phát chắc chắn sống: biến trên stack thread, static field, JNI reference, monitor đang giữ.
- **Reference counting**: cách quản lý bộ nhớ đếm số reference tới mỗi object, về 0 thì giải phóng.
- **Mark / sweep / compact / copy**: đánh dấu object sống / dọn chỗ trống / dồn object lại / chép object sống sang vùng mới.
- **Card table / remembered set**: cấu trúc ghi lại reference từ old sang young (hoặc giữa các region) để không phải quét cả heap.
- **Write barrier**: đoạn code JIT chèn vào mỗi lần gán reference để cập nhật các cấu trúc trên.
- **SATB / load barrier**: kỹ thuật để GC đánh dấu đồng thời mà không bỏ sót object (G1 / ZGC).
- **reachabilityFence**: API giữ một object sống tới một điểm trong code, chống JIT coi nó chết sớm.

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

### Lỗi hay gặp
- **Static Map làm sổ tạm mà quên xoá**: old gen tăng đều qua nhiều ngày. Cách tránh: xoá trong finally hoặc dùng cache có giới hạn và TTL.
- **ThreadLocal không remove trong thread pool**: dữ liệu request cũ sống mãi theo thread. Cách tránh: {{remove()}} trong finally.
- **Gán null khắp nơi để "giúp GC"**: code rối mà không giải quyết leak thật. Cách tránh: tìm root giữ object bằng MAT thay vì đoán.
- **Gọi System.gc() để giải phóng bộ nhớ**: với G1 gây Full GC dài. Cách tránh: bỏ lời gọi hoặc dùng {{-XX:+ExplicitGCInvokesConcurrent}}.

### Trả lời miệng 1 phút
"JVM xác định rác bằng reachability: bắt đầu từ GC roots là biến trên stack của thread đang sống, static field, JNI reference và monitor, đi theo mọi reference strong để đánh dấu; object không đến được là rác, kể cả khi chúng trỏ vòng vào nhau. JVM không dùng reference counting vì nó không thu được vòng tham chiếu, tốn chi phí cập nhật bộ đếm atomic ở mỗi lần gán, và có thể giải phóng dây chuyền gây pause. Tracing thì chi phí tỉ lệ với object còn sống, hợp với việc đa số object chết trẻ. Còn leak trong Java nghĩa là object vẫn reachable nhưng không còn dùng, như static map quên xoá hay ThreadLocal trong pool. GC chỉ thu cái không đến được, không thu cái bạn không cần."

> Senior tip: khi giải thích một vụ leak cho team, tôi luôn chỉ ra **root** cụ thể lấy từ MAT, thường là static field, ThreadLocal của thread pool, hoặc class loader. Câu hỏi "có GC rồi sao còn leak" được trả lời bằng một câu: GC thu những gì không còn đến được, chứ không thu những gì bạn không còn cần.`,
  follow: [
    'Card table / remembered set giải quyết vấn đề gì khi chỉ dọn young gen?',
    'Vì sao Reference.reachabilityFence tồn tại?'
  ],
  tags: ['GC roots', 'reachability', 'reference counting', 'memory leak'],
  refs: [
    { type: 'doc', title: 'HotSpot Garbage Collection Tuning Guide (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' },
    { type: 'doc', title: 'Troubleshooting Memory Leaks (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html' },
  ]
},
{
  id: 'jvm-021',
  topic: 'jvm',
  level: 'senior',
  q: 'Minor GC, major GC và full GC khác nhau thế nào? Object được promote lên old gen khi nào, và trên production bạn nhận ra "promote quá sớm" hay full GC qua GC log ra sao?',
  a: `**Tóm tắt:** Heap được chia thế hệ dựa trên giả thuyết "phần lớn object chết trẻ". **Minor (young) GC** dọn young gen (Eden + Survivor) khi Eden đầy; có stop-the-world nhưng nhanh vì chỉ copy số ít object còn sống. **Major GC** là việc thu dọn old gen; thuật ngữ này không được chuẩn hoá, với G1 nó thường là chu kỳ concurrent marking cộng các lần mixed GC. **Full GC** dọn toàn bộ heap (kèm class unloading) trong một lần stop-the-world; với G1 đây là phương án dự phòng khi các cơ chế khác không theo kịp, pause dài và là dấu hiệu có vấn đề. Object được promote khi sống qua số lần minor GC vượt tenuring threshold (tối đa 15), khi Survivor không đủ chỗ (promote sớm), còn object rất lớn ở G1 (humongous) được cấp thẳng vào region riêng thuộc old gen.

### Hiểu nhanh
Heap chia thế hệ giống cách một bệnh viện chia khu cấp cứu và khu điều trị dài ngày. Hầu hết bệnh nhân cấp cứu (object mới) về nhà rất nhanh, nên khu cấp cứu được dọn liên tục và nhanh (minor GC). Ai ở lâu thì chuyển lên khu dài ngày (old gen), dọn ít hơn nhưng mỗi lần dọn tốn công hơn. Nếu khu cấp cứu quá chật, bệnh nhân bị chuyển lên khu dài ngày quá sớm rồi xuất viện ngay hôm sau — khu dài ngày đầy giường trống ảo (**promote quá sớm**). Full GC giống phải đóng cả bệnh viện để sắp xếp lại: hiếm khi nên xảy ra.

### Thuật ngữ
- **Generational hypothesis**: giả thuyết phần lớn object chết trẻ, là nền tảng của việc chia young/old.
- **Eden / Survivor**: nơi object mới sinh / nơi giữ object sống sót qua young GC (có hai vùng luân phiên).
- **Promotion (tenuring)**: chuyển object từ young lên old.
- **Tenuring threshold**: số lần sống sót qua young GC trước khi bị promote (tối đa 15).
- **Premature promotion**: object sống trung bình bị đẩy lên old sớm rồi chết ở đó.
- **Mixed GC**: lần GC của G1 dọn young cộng một số region old nhiều rác.
- **IHOP**: ngưỡng chiếm dụng heap để G1 bắt đầu concurrent marking.
- **Humongous object**: object từ nửa region G1 trở lên, cấp thẳng vào region riêng thuộc old.

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

### Lỗi hay gặp
- **Đặt MaxGCPauseMillis quá thấp**: G1 thu nhỏ young, object bị promote sớm, mixed GC dày. Cách tránh: giữ mặc định 200 ms trừ khi đã đo.
- **Batch đọc 100.000 bản ghi vào List một lúc**: object sống trung bình tràn Survivor, old phình. Cách tránh: xử lý theo lô nhỏ, ghi kết quả ngay.
- **Tạo mảng byte lớn liên tục (đọc file, build response)**: log nhiều "G1 Humongous Allocation". Cách tránh: streaming, buffer tái sử dụng.
- **Tăng heap khi Full GC giải phóng rất ít**: chỉ trì hoãn OOM vì đó là leak. Cách tránh: xem old gen sau GC, lấy heap dump.

### Trả lời miệng 1 phút
"Minor GC dọn young gen khi Eden đầy, có dừng ứng dụng nhưng ngắn vì chỉ copy số ít object còn sống sang Survivor. Major GC là dọn old gen, thuật ngữ không chuẩn hoá; với G1 nó là concurrent marking cộng mixed GC. Full GC dọn toàn bộ heap trong một lần dừng dài, trên G1 là phương án dự phòng và là dấu hiệu có vấn đề. Object được promote khi sống qua tenuring threshold, tối đa 15 vì tuổi lưu trong 4 bit header, hoặc sớm hơn khi Survivor đầy; object humongous vào thẳng old. Trên GC log tôi nhìn old gen sau GC: đi ngang là khoẻ, bậc thang đi lên là leak, sát trần là heap nhỏ. Một dòng Pause Full mà giải phóng rất ít là tín hiệu tôi lấy heap dump ngay."

> Senior tip: chỉ số tôi xem đầu tiên không phải pause time mà là **old gen sau GC** (heap còn lại sau mixed/full GC). Đường này đi ngang là heap khoẻ; đi lên theo hình bậc thang là leak; đi ngang nhưng sát trần là heap quá nhỏ. Ba hình dạng, ba hướng xử lý khác nhau.`,
  follow: [
    'Vì sao MaxTenuringThreshold tối đa là 15?',
    'Humongous object trong G1 là gì và vì sao nó gây vấn đề?',
    'Full GC xảy ra trong G1 khi nào, và bạn xử lý thế nào?'
  ],
  tags: ['minor GC', 'major GC', 'full GC', 'promotion', 'tenuring', 'G1'],
  refs: [
    { type: 'doc', title: 'HotSpot Garbage Collection Tuning Guide (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' },
    { type: 'doc', title: 'Garbage-First (G1) Garbage Collector (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html' },
  ]
},
{
  id: 'jvm-022',
  topic: 'jvm',
  level: 'mid',
  q: 'Phân biệt {{StackOverflowError}} và {{OutOfMemoryError}}: nguyên nhân, cách tái hiện từng loại, có nên catch không, và sau khi lỗi xảy ra thì JVM/ứng dụng ở trạng thái nào?',
  a: `**Tóm tắt:** StackOverflowError xảy ra khi stack của **một thread** hết chỗ, gần như luôn do đệ quy quá sâu hoặc vô hạn. Chỉ thread đó bị ảnh hưởng, và stack được giải phóng ngay khi exception lan ngược ra. OutOfMemoryError xảy ra khi JVM không cấp phát được bộ nhớ trong một vùng **dùng chung** (heap, metaspace, direct memory, hay native memory để tạo thread). Nó nổ ở thread "xui xẻo" đang cấp phát lúc đó, không nhất thiết là thread gây ra, và thường cả ứng dụng đã ở trạng thái hỏng. Cả hai đều là {{Error}} (kế thừa {{VirtualMachineError}}) và không nên catch để chạy tiếp. Với OOM, hãy cấu hình heap dump và {{ExitOnOutOfMemoryError}} để process được restart sạch.

### Hiểu nhanh
Stack của một thread giống một chồng đĩa trên bàn của một đầu bếp: mỗi lần gọi method là đặt thêm một cái đĩa, method xong thì lấy đĩa ra. Đệ quy vô hạn là cứ chồng đĩa mãi tới khi chạm trần — **StackOverflowError** — và chỉ bàn của đầu bếp đó bị ảnh hưởng; dọn chồng đĩa là bàn lại sạch. Heap thì giống **kho chung** của cả nhà hàng: khi kho đầy (**OutOfMemoryError**), người lấy đồ tiếp theo bị báo lỗi, dù người làm đầy kho có thể là người khác. Và kho vẫn đầy sau khi báo lỗi, nên cả nhà hàng đang gặp nguy.

### Thuật ngữ
- **Stack frame**: vùng nhớ cho một lần gọi method (biến local, tham số, địa chỉ trả về).
- **-Xss**: kích thước stack tối đa cho mỗi platform thread.
- **Unwind**: exception lan ngược ra ngoài, lần lượt bỏ các frame.
- **Error vs Exception**: Error là lỗi nghiêm trọng của môi trường, ứng dụng thường không nên bắt.
- **VirtualMachineError**: lớp cha của StackOverflowError và OutOfMemoryError.
- **ExitOnOutOfMemoryError**: flag làm JVM thoát ngay khi có OOM để được restart sạch.
- **ArrayDeque**: hàng đợi hai đầu, dùng làm stack tường minh khi chuyển đệ quy thành vòng lặp.
- **OOMKilled (exit 137)**: kernel giết container vì vượt memory limit, không phải OutOfMemoryError.

### Hai lỗi diễn ra thế nào (từng bước)
1. **StackOverflowError**: mỗi lời gọi đẩy một frame lên stack của thread → đệ quy không dừng → chạm giới hạn Xss → JVM ném lỗi ngay tại lời gọi đó → exception unwind, các frame bị bỏ, stack trống lại. Vì sao JVM vẫn khoẻ: stack là riêng của thread, không ai khác dùng chung.
2. **OutOfMemoryError**: một thread xin cấp phát → heap không đủ → JVM chạy GC hết sức → vẫn không đủ → ném OOM cho **thread đang xin** → nhưng các object giữ heap vẫn còn đó, thread khác xin tiếp cũng sẽ OOM. Vì sao app nguy hiểm: lỗi nổ ở chỗ ngẫu nhiên, để lại trạng thái dở dang.

~~~text
StackOverflowError                    OutOfMemoryError
thread A: [f][f][f]...[f] X           heap chung: [######## đầy ########]
thread B: [g][h]  (bình thường)       thread A xin 1 MB -> OOM (nạn nhân)
=> chỉ A lỗi, stack A được dọn         thread B xin tiếp  -> OOM
                                      thủ phạm: cache static giữ 90% heap
~~~

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

### Lỗi hay gặp
- **catch (Throwable) trong worker loop**: nuốt OOM, service trông vẫn sống nhưng mất worker, dữ liệu dở dang. Cách tránh: ném lại {{VirtualMachineError}} và bật ExitOnOutOfMemoryError.
- **Tăng -Xss toàn JVM để chữa một đệ quy sâu**: mọi thread đều có thể chiếm thêm bộ nhớ stack. Cách tránh: viết lại bằng vòng lặp hoặc giới hạn độ sâu input.
- **Tăng Xmx khi gặp OOM Metaspace hay Direct buffer memory**: vô ích. Cách tránh: đọc thông điệp sau dấu hai chấm.
- **toString/equals đệ quy vòng tròn giữa hai entity (ví dụ Lombok @Data hai chiều)**: StackOverflowError khi log. Cách tránh: loại field quan hệ khỏi toString/equals.

### Trả lời miệng 1 phút
"StackOverflowError là stack của một thread hết chỗ, gần như luôn do đệ quy vô hạn hoặc quá sâu; chỉ thread đó bị ảnh hưởng và stack được giải phóng khi exception unwind, nên JVM vẫn khoẻ. OutOfMemoryError là một vùng dùng chung như heap, metaspace hay direct memory hết chỗ; nó nổ ở thread đang cấp phát, thường chỉ là nạn nhân, và vì bộ nhớ vẫn đầy nên cả app ở trạng thái hỏng. Cả hai đều là Error, tôi không catch để chạy tiếp. Với stack overflow tôi đọc cụm frame lặp, đổi đệ quy thành vòng lặp hoặc giới hạn độ sâu input. Với OOM tôi đọc thông điệp để biết vùng nào, bật heap dump và ExitOnOutOfMemoryError để process restart sạch rồi phân tích dump."

> Senior tip: với StackOverflowError, tôi coi input là nghi phạm đầu tiên: cây danh mục cha–con do người dùng tạo, rule engine đệ quy, JSON từ đối tác. Giới hạn độ sâu ở biên hệ thống rẻ hơn nhiều so với tăng Xss. Với OOM, câu hỏi đầu tiên luôn là "thông điệp nói vùng nào?"; rất nhiều lần team nhầm OOM Metaspace hay Direct buffer memory thành OOM heap rồi tăng Xmx một cách vô ích.`,
  follow: [
    'Vì sao thread ném OutOfMemoryError thường không phải thủ phạm?',
    'Tăng -Xss ảnh hưởng gì khi service có 500 thread?'
  ],
  tags: ['StackOverflowError', 'OutOfMemoryError', 'Xss', 'heap dump']
},
{
  id: 'concurrency-028',
  topic: 'concurrency',
  level: 'senior',
  q: 'Một thread publish dữ liệu qua cờ ready nhưng reader đôi lúc thấy cờ mới và value cũ. Bạn giải thích happens-before và sửa thế nào?',
  a: `**Tóm tắt:** khi writer và reader không có quan hệ happens-before, chương trình có **data race**: compiler, JIT và CPU được phép xếp lại thứ tự, nên reader không được đảm bảo thấy các lệnh ghi trước đó dù đã thấy cờ {{ready = true}}. Cách sửa: khai báo cờ là {{volatile}} và ghi payload **trước** khi bật cờ, hoặc đồng bộ cả hai phía bằng cùng một monitor hay một primitive concurrency (AtomicReference, BlockingQueue, CountDownLatch...).

### Hiểu nhanh
Giống bạn nhắn đồng nghiệp: "Tài liệu đã để trên bàn rồi" — nhưng tin nhắn tới nhanh hơn người chuyển tài liệu, đồng nghiệp chạy ra thì bàn vẫn trống (hoặc còn bản cũ). Cờ {{ready}} là tin nhắn, {{value}} là tài liệu. {{volatile}} trên cờ giống quy định của bưu tá: "chỉ được gửi tin nhắn sau khi tài liệu đã đặt xong, và người nhận đọc tin nhắn thì chắc chắn thấy tài liệu".

### Thuật ngữ
- **Happens-before**: quy tắc của Java Memory Model: nếu A happens-before B thì B thấy mọi thứ A đã ghi.
- **Data race**: hai thread truy cập cùng biến, ít nhất một bên ghi, không có happens-before giữa chúng.
- **Reordering**: đổi thứ tự lệnh để tối ưu, hợp lệ nếu một thread đơn lẻ không thấy khác biệt.
- **Release / acquire**: ghi volatile là "release" (đẩy mọi ghi trước đó ra), đọc volatile là "acquire" (thấy mọi thứ đã release).
- **Publish**: đưa dữ liệu cho thread khác nhìn thấy.
- **Invariant**: ràng buộc phải luôn đúng giữa nhiều field (ví dụ min ≤ max).
- **jcstress**: công cụ của OpenJDK để kiểm thử các kịch bản concurrency khó tái hiện.

### Vì sao reader thấy cờ mới mà value cũ (từng bước)
1. Writer chạy {{value = 42; ready = true;}}. Không có volatile, hai lệnh ghi này không có ràng buộc thứ tự với thread khác.
2. JIT hoặc CPU (đặc biệt ARM) có thể làm lệnh ghi {{ready}} hiện ra với core khác trước lệnh ghi {{value}}.
3. Reader thấy {{ready == true}}, đọc {{value}} và nhận 0 (giá trị cũ). JIT thậm chí có thể đưa lần đọc {{ready}} ra khỏi vòng lặp, khiến reader chờ mãi.
4. Khi {{ready}} là volatile: ghi volatile là release — mọi ghi trước đó (value = 42) phải hiện ra trước; đọc volatile là acquire — nếu reader thấy {{ready == true}} thì chắc chắn thấy {{value == 42}}. Đây là luật volatile cộng với tính bắc cầu của happens-before.

~~~text
Không volatile:                      Có volatile ready:
Writer: value=42 ; ready=true        Writer: value=42 --hb--> ready=true (release)
Core khác có thể thấy:                                            |
  ready=true, value=0   <- BUG       Reader: đọc ready==true (acquire) --hb--> đọc value==42
~~~

### Cách sửa

~~~java
int value;
volatile boolean ready;                  // cờ publish phải volatile

void publish() {
    value = 42;                          // 1. ghi payload TRƯỚC
    ready = true;                        // 2. bật cờ SAU (release)
}
int read() {
    return ready ? value : -1;           // đọc cờ TRƯỚC (acquire), rồi mới đọc payload
}
~~~
- Thứ tự là bắt buộc: writer ghi payload rồi mới bật cờ; reader kiểm tra cờ rồi mới đọc payload. Đảo thứ tự là mất bảo đảm.
- Sleep/yield không tạo quan hệ happens-before; test stress chạy ổn cũng không chứng minh chương trình đúng.

### Giới hạn
- Volatile không làm phép cộng hay read-modify-write thành atomic. Dùng AtomicLong, lock hoặc LongAdder tuỳ yêu cầu.
- Nếu invariant gồm nhiều field cần snapshot thống nhất, dùng lock hoặc publish **một object immutable** qua một volatile reference (hoặc AtomicReference).
- Nhiều writer cần giao thức ownership rõ ràng; một cờ volatile đơn lẻ không cộng dồn được cập nhật của nhiều người.
- Muốn reader chờ tới khi có dữ liệu (thay vì kiểm tra rồi trả -1): dùng CountDownLatch, CompletableFuture hoặc BlockingQueue thay vì vòng lặp bận.

Để kiểm tra các litmus test khó tái hiện, dùng jcstress; {{Thread.sleep}} không thay thế được synchronization.

### Lỗi hay gặp
- **Cờ volatile nhưng payload ghi sau cờ**: reader vẫn thấy value cũ. Cách tránh: luôn ghi payload trước, bật cờ cuối cùng.
- **Chỉ payload volatile, cờ không volatile**: reader đọc cờ không có acquire, không có bảo đảm. Cách tránh: biến được dùng làm "tín hiệu" mới là biến cần volatile.
- **Publish nhiều field liên quan bằng nhiều volatile riêng**: reader thấy tổ hợp lẫn lộn giữa bản cũ và bản mới. Cách tránh: gói thành object immutable, publish một reference.
- **Kết luận "đã đúng" vì chạy ổn trên laptop x86**: bug lộ trên ARM/Graviton. Cách tránh: lý luận bằng happens-before, kiểm bằng jcstress.

### Trả lời miệng 1 phút
"Nguyên nhân là không có happens-before giữa writer và reader, tức là data race: JIT và CPU được phép làm lệnh ghi cờ hiện ra trước lệnh ghi value, nên reader thấy ready bằng true nhưng value vẫn cũ. Cách sửa là khai báo ready là volatile, writer ghi value trước rồi mới bật cờ, reader đọc cờ trước rồi mới đọc value: ghi volatile có ngữ nghĩa release, đọc volatile có ngữ nghĩa acquire, cộng tính bắc cầu nên value chắc chắn nhìn thấy được. Nhưng volatile không làm thao tác ghép thành nguyên tử, và nếu cần snapshot nhiều field thì tôi publish một object immutable qua một reference volatile hoặc dùng lock. Tôi không dùng sleep hay test stress để chứng minh đúng, mà chỉ ra cạnh happens-before cụ thể và kiểm bằng jcstress khi cần."

> Senior tip: khi review concurrent code, hãy chỉ ra cạnh happens-before nối writer với reader. Nếu không chỉ ra được cạnh cụ thể, đừng dựa vào việc "máy x86 chạy ổn".`,
  follow: ['Vì sao volatile không bảo vệ count++?', 'Khi nào cần immutable snapshot thay vì nhiều volatile field?'],
  tags: ['JMM', 'happens-before', 'volatile']
},
{
  id: 'concurrency-029',
  topic: 'concurrency',
  level: 'lead',
  q: 'Parallel stream trong endpoint làm nghẽn các tác vụ ForkJoin khác. Bạn giải thích common pool và thiết kế lại thế nào?',
  a: `**Tóm tắt:** parallel stream chạy trên {{ForkJoinPool.commonPool()}} — một pool dùng chung cả JVM, chỉ có (số core − 1) worker. Blocking I/O (gọi HTTP, JDBC) bên trong parallel stream giữ worker suốt thời gian chờ, làm các task không liên quan (CompletableFuture async không truyền executor, parallel stream khác) bị đói. Thiết kế lại bằng cách tách workload I/O vào executor có giới hạn (bulkhead) hoặc async client, với giới hạn concurrency, timeout và queue hữu hạn.

### Hiểu nhanh
commonPool giống chiếc thang máy duy nhất của toà nhà, chỉ chở được 3 người một lúc. Parallel stream gọi I/O giống 3 người vào thang rồi **đứng chờ trong thang** nghe điện thoại 2 phút: thang không đi đâu được, cả toà nhà xếp hàng, kể cả những người chẳng liên quan gì tới cuộc điện thoại. Cách sửa: những ai phải chờ lâu thì đi thang riêng có giới hạn người (executor riêng), và thang chung chỉ để chở việc nhanh (tính toán thuần).

### Thuật ngữ
- **commonPool**: ForkJoinPool tĩnh dùng chung toàn JVM, parallelism mặc định = số core − 1.
- **Parallel stream**: stream xử lý phần tử song song trên commonPool.
- **Work stealing**: worker rảnh lấy task từ deque của worker khác.
- **Blocking I/O**: thread đứng chờ mạng/đĩa/DB trả kết quả, không làm được việc khác.
- **Bulkhead**: tách tài nguyên (pool, semaphore) theo từng dependency để một chỗ hỏng không kéo sập chỗ khác.
- **Starvation**: task chờ mãi không được chạy vì worker bị chiếm hết.
- **Compensation thread**: thread ForkJoinPool tạo thêm khi worker báo sắp block qua {{ForkJoinPool.managedBlock}}.
- **Rejection policy**: cách executor xử lý khi không nhận thêm task.

### Vì sao common pool dễ thành bẫy (từng bước)
1. ForkJoinPool tối ưu cho task CPU-bound nhỏ bằng work stealing: worker rảnh lấy task từ deque của worker bận.
2. Pod 4 vCPU → commonPool có 3 worker. Endpoint gọi {{ids.parallelStream().map(this::callPartner)}}, mỗi call 300 ms.
3. 3 worker cùng đứng chờ socket, không steal được việc khác. Bù thread (compensation) chỉ xảy ra khi code báo trước qua managedBlock, mà HTTP client hay JDBC driver không làm vậy, nên không thể coi commonPool là I/O executor.
4. Mọi CompletableFuture async không truyền executor và mọi parallel stream khác trong JVM phải xếp hàng sau → các endpoint không liên quan cũng timeout.
5. Ví dụ số: 100 id × 300 ms / 3 worker ≈ 10 giây cho một request; 5 request đồng thời là commonPool kẹt gần một phút.

~~~text
commonPool (3 worker, pod 4 vCPU)
worker-1: [callPartner ... chờ 300ms ...]
worker-2: [callPartner ... chờ 300ms ...]
worker-3: [callPartner ... chờ 300ms ...]
queue:    [CF.supplyAsync từ API khác][parallel sort][...] <- đói, timeout
~~~

### Cách sửa
- Dùng executor chuyên cho từng dependency: thread/queue hữu hạn, rejection policy rõ ràng và timeout.
- Đặt semaphore theo quota đối tác và số connection DB; song song không có nghĩa là không giới hạn.
- Truyền executor cho {{supplyAsync}}/{{thenApplyAsync}}. Parallel stream không nhận executor: cân nhắc vòng lặp tuần tự, hoặc đổi sang API cho phép chỉ định executor.
- Queue phải hữu hạn: queue vô hạn biến quá tải thành latency và bộ nhớ tăng liên tục.

~~~java
// Bulkhead cho đối tác: tối đa 20 call song song, queue 100, đầy thì fail fast
ExecutorService partnerPool = new ThreadPoolExecutor(20, 20, 0, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(100), new ThreadPoolExecutor.AbortPolicy());

List<CompletableFuture<Quote>> fs = ids.stream()
        .map(id -> CompletableFuture.supplyAsync(() -> callPartner(id), partnerPool)
                .orTimeout(2, TimeUnit.SECONDS))          // mỗi call có deadline
        .toList();
List<Quote> quotes = fs.stream().map(CompletableFuture::join).toList(); // join ở biên
~~~
Với Java 21 có thể thay pool bằng {{newVirtualThreadPerTaskExecutor()}} cộng một {{Semaphore(20)}} quanh callPartner — vẫn phải có giới hạn.

### Vận hành
- Theo dõi queue depth, active worker, số lần reject, latency của dependency và mức bão hoà của commonPool ({{getActiveThreadCount}}, {{getQueuedSubmissionCount}}).
- Không tạo executor mỗi request. Shutdown executor cùng lifecycle ứng dụng.
- Virtual thread giúp viết blocking code dễ scale, nhưng không tăng quota DB hay capacity đối tác.

### Lỗi hay gặp
- **I/O trong parallel stream**: triệu chứng là nhiều API chậm cùng lúc, thread dump thấy {{ForkJoinPool.commonPool-worker}} đứng ở socket read. Cách tránh: executor I/O riêng.
- **Tạo executor mới trong mỗi request**: số thread tăng mãi, rò bộ nhớ. Cách tránh: executor là bean dùng chung, có shutdown.
- **Executor riêng nhưng queue vô hạn**: không còn kẹt commonPool nhưng latency tăng dần rồi OOM. Cách tránh: queue bounded + AbortPolicy + trả 503.
- **Bỏ timeout cho call đối tác**: đối tác chậm là worker kẹt hết. Cách tránh: timeout ở HTTP client và orTimeout ở future.

### Trả lời miệng 1 phút
"Parallel stream chạy trên commonPool, pool dùng chung cả JVM chỉ có số core trừ một worker. Nếu trong lambda có HTTP hay JDBC thì worker đứng chờ I/O, không steal được việc khác, và ForkJoinPool không tự bù thread vì driver không báo trước; thế là mọi CompletableFuture async không truyền executor và các parallel stream khác bị đói, endpoint không liên quan cũng timeout. Tôi thiết kế lại bằng bulkhead: mỗi dependency một executor có số thread và queue hữu hạn, rejection rõ ràng, timeout cho từng call, semaphore theo quota đối tác; hoặc virtual thread cộng semaphore trên Java 21. Parallel stream tôi chỉ giữ cho tính toán thuần trên dữ liệu lớn, và theo dõi metric của commonPool để phát hiện ai đó lại block trong đó."

> Senior tip: đặt bulkhead theo từng dependency. Khi queue đã đầy, fail fast thường tốt hơn xếp thêm việc chắc chắn hết deadline.`,
  follow: ['Vì sao virtual thread vẫn cần semaphore?', 'CompletableFuture stage nào mặc định có thể chạy trên common pool?'],
  tags: ['ForkJoinPool', 'parallel stream', 'backpressure']
},
{
  id: 'jvm-023',
  topic: 'jvm',
  level: 'senior',
  q: 'Service có heap lớn và p99 nhạy: bạn chọn G1 hay Generational ZGC, và benchmark nào đủ tin cậy?',
  a: `**Tóm tắt:** G1 cân bằng throughput và pause, với một **mục tiêu** pause mềm ({{MaxGCPauseMillis}}); Generational ZGC hướng tới pause rất ngắn (dưới 1 ms) bằng cách làm gần hết việc **đồng thời** với ứng dụng, đổi lại tốn thêm CPU. Quyết định dựa trên SLO latency, phần CPU/RSS còn dư (headroom) và một benchmark chạy với đúng runtime, đúng tải — không dựa vào một con số pause duy nhất.

### Hiểu nhanh
Hãy so sánh hai cách dọn một siêu thị lớn. **G1** đóng từng khu vài chục mili giây để dọn nhanh, khách ở khu đó phải chờ một chút. **ZGC** cho nhân viên dọn ngay trong lúc khách mua sắm, gần như không ai phải chờ, nhưng cần thêm nhân viên (CPU) và mỗi khách đi lại hơi chậm hơn một chút (barrier). Nếu siêu thị đã thiếu nhân viên ở giờ cao điểm (CPU sát trần), thêm việc dọn song song chỉ làm mọi thứ chậm hơn. Vì vậy phải thử cả hai cách trong **đúng giờ cao điểm thật** rồi mới chọn.

### Thuật ngữ
- **SLO**: mục tiêu chất lượng dịch vụ, ví dụ "p99 dưới 50 ms".
- **p99 / p999**: 99% / 99.9% request nhanh hơn con số này — đo phần "đuôi" chậm.
- **Region**: ô nhớ G1 chia heap ra; G1 dọn theo từng nhóm region.
- **Mixed collection**: lần GC của G1 dọn young cộng một số region old nhiều rác.
- **Load barrier**: đoạn code nhỏ ZGC chèn vào mỗi lần đọc reference để sửa con trỏ trong lúc GC di chuyển object.
- **Generational ZGC**: ZGC tách young/old (JEP 439, JDK 21), mặc định của ZGC từ JDK 23.
- **Headroom**: phần tài nguyên (CPU, RAM) còn trống ở peak.
- **Canary**: triển khai thay đổi cho một nhóm nhỏ instance trước khi áp dụng toàn bộ.

### Trade-off (từng bước suy luận)
1. **G1** chia heap thành region, có young/mixed collection và concurrent marking; một số pha (copy object) vẫn stop-the-world. {{MaxGCPauseMillis}} (mặc định 200 ms) là mục tiêu để G1 chọn bao nhiêu region dọn mỗi lần, **không phải SLA**: khi heap chật hoặc allocation bùng nổ, pause vẫn có thể vượt.
2. **Generational ZGC** tận dụng tuổi object (dọn young thường xuyên, rẻ) và dùng load barrier để marking, relocate và compact trong khi ứng dụng chạy. JEP 439 đưa generational mode vào JDK 21; từ JDK 23 nó là mặc định, JDK 24 bỏ chế độ cũ.
3. **Concurrent work tiêu thụ CPU.** Nếu CPU quota đã sát trần, giảm pause có thể đổi thành throughput thấp hơn, thậm chí allocation stall (thread phải chờ GC vì dọn không kịp).
4. **RSS**: ZGC thường cần heap rộng hơn live set để có chỗ thở; cả hai đều có thêm metaspace, direct memory, thread stack nằm trong RSS ngoài heap.

| Tiêu chí | G1 | Generational ZGC |
|---|---|---|
| Pause điển hình | vài ms tới vài chục ms | dưới 1 ms |
| Phụ thuộc kích thước heap | pause tăng theo lượng object sống phải copy | gần như không |
| CPU overhead | thấp hơn | cao hơn (GC thread + barrier) |
| Throughput | thường tốt hơn chút | có thể thấp hơn chút |
| Khi nào hợp | đa số service | p99 bị GC pause chi phối, heap lớn |

### Quy trình chọn (benchmark đủ tin cậy)
1. **Cùng điều kiện**: cùng heap limit, cùng JDK build, cùng container quota (CPU/RAM), cùng dataset và tỷ lệ loại request. Vì sao: đổi một biến khác là kết quả vô nghĩa.
2. **Warm-up ổn định** trước khi đo; đo nhiều lần, ở cả peak, burst và ngay sau cold deploy.
3. **So nhiều chỉ số cùng lúc**: p99/p999, throughput, CPU, RSS, allocation rate, phân bố pause và tổng thời gian GC.
4. **Chạy đủ dài** (vài giờ) để thấy cả chu kỳ old gen, không chỉ young GC.
5. **Canary** một nhóm instance trên production, giữ sẵn cấu hình rollback.

~~~bash
-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags
# G1:  -XX:+UseG1GC -XX:MaxGCPauseMillis=100
# ZGC: -XX:+UseZGC   (JDK 21 thêm -XX:+ZGenerational; JDK 23+ không cần)
~~~

~~~text
Ví dụ kết quả load test 2 giờ, pod 4 vCPU, heap 8 GB (số minh hoạ)
              p99     p999    throughput   CPU peak   RSS
G1            38 ms   120 ms  10.000 rps   62%        9.6 GB
Gen ZGC       21 ms    35 ms   9.600 rps   78%        10.1 GB
=> ZGC thắng latency; chọn nếu SLO là p999 và còn CPU headroom ở peak
~~~
Đọc GC log cùng JFR; nhớ rằng metaspace, direct memory và thread stack cũng nằm trong RSS ngoài heap.

### Lỗi hay gặp
- **So sánh bằng benchmark 5 phút trên laptop**: chưa thấy chu kỳ old, CPU khác production. Cách tránh: chạy trong container cùng quota, vài giờ.
- **Chỉ nhìn pause trung bình**: G1 trung bình đẹp nhưng p999 xấu. Cách tránh: so phân bố pause và p999 của request.
- **Chuyển ZGC khi CPU peak đã 85%**: latency tổng tệ hơn, có allocation stall. Cách tránh: thêm CPU hoặc giữ G1.
- **Tăng Xmx bằng toàn bộ memory limit để ZGC "có chỗ"**: pod bị OOMKilled. Cách tránh: tính cả phần native.

### Trả lời miệng 1 phút
"G1 chia heap thành region, dọn theo từng nhóm với mục tiêu pause mềm, MaxGCPauseMillis không phải cam kết; còn Generational ZGC làm marking và relocation đồng thời nhờ load barrier nên pause dưới một mili giây, nhưng tốn thêm CPU và thường cần heap rộng hơn. Tôi không chọn theo một con số pause mà theo SLO, CPU và RSS headroom. Benchmark đáng tin phải cùng JDK, cùng heap và quota container, cùng dữ liệu và tỷ lệ request, có warm-up, chạy vài giờ, và so cả p99, p999, throughput, CPU, RSS. Sau đó canary trên production với cấu hình rollback. Nếu ZGC đạt latency nhưng làm CPU peak cạn thì tôi giữ G1."

> Senior tip: nếu mục tiêu pause đạt nhưng CPU headroom cạn ở peak, collector đó chưa phù hợp production. Đừng tăng Xmx bằng toàn bộ memory limit của container.`,
  follow: ['Vì sao MaxGCPauseMillis không phải cam kết?', 'Bạn theo dõi gì để biết ZGC đang lấy CPU khỏi ứng dụng?'],
  tags: ['G1', 'Generational ZGC', 'GC', 'latency'],
  refs: [{ type: 'doc', title: 'JEP 439: Generational ZGC', url: 'https://openjdk.org/jeps/439' }]
},
{
  id: 'jvm-024',
  topic: 'jvm',
  level: 'senior',
  q: 'Benchmark cho thấy allocation của object biến mất sau warm-up. Escape analysis và scalar replacement giải thích gì, và vì sao không phải hợp đồng?',
  a: `**Tóm tắt:** Khi method đã nóng, JIT C2 có thể chứng minh một object **không thoát (escape)** ra khỏi phạm vi nó phân tích được, rồi thay object đó bằng các biến scalar riêng lẻ (scalar replacement) — allocation biến mất — và bỏ luôn lock không ai khác quan sát được (lock elimination). Đây là **tối ưu runtime phụ thuộc profile**, không phải cam kết của ngôn ngữ hay bytecode: đổi JDK, đổi cách gọi, hay code phức tạp hơn một chút là nó có thể không còn xảy ra.

### Hiểu nhanh
Giả sử mỗi lần tính tiền bạn lấy một tờ giấy nháp mới (cấp phát object), ghi hai con số, cộng lại rồi vứt giấy. Một nhân viên giỏi sau vài nghìn lần sẽ nhận ra "tờ giấy này không bao giờ rời khỏi bàn", nên chỉ nhẩm trong đầu (biến trong register) — không tốn giấy nữa. Nhưng anh ta chỉ làm vậy khi **chắc chắn** tờ giấy không bị đưa cho ai; nếu một lần nào đó tờ giấy được chuyển sang phòng khác, anh ta phải quay lại dùng giấy thật. Benchmark thấy "allocation biến mất sau warm-up" chính là lúc nhân viên bắt đầu nhẩm.

### Thuật ngữ
- **Escape analysis**: phân tích xem reference tới object có thoát khỏi method/thread hiện tại không.
- **Scalar replacement**: thay object bằng các field riêng lẻ dưới dạng biến local/register.
- **Lock elimination (elision)**: bỏ synchronized trên object mà chỉ một thread có thể thấy.
- **Inline**: chép thân method được gọi vào nơi gọi; escape analysis chỉ thấy được những gì đã inline.
- **Profile**: thống kê lúc chạy (kiểu thực tế, nhánh hay chạy) do interpreter/C1 thu thập.
- **Deoptimization**: bỏ mã đã tối ưu khi giả định của profile không còn đúng.
- **JMH**: framework benchmark chính thức của OpenJDK, xử lý warm-up, fork và dead-code elimination.
- **Dead-code elimination**: JIT xoá code mà kết quả không được dùng.

### Quá trình (từng bước)
1. **Thu profile**: interpreter/C1 đếm số lần gọi và ghi lại kiểu thực tế; tiered compilation chuyển method nóng cho C2. Vì sao cần: trước đó chưa có tối ưu này, nên benchmark lạnh vẫn thấy allocation.
2. **Inline**: C2 inline các method nhỏ được gọi. Vì sao quan trọng: nếu object được truyền vào một method không inline, JIT phải coi như object đã escape.
3. **Escape analysis**: tìm xem reference có bị return, lưu vào field/static, đưa vào collection, truyền cho thread khác hay truyền tới lời gọi không phân tích được.
4. **Scalar replacement**: nếu object không escape, từng field được giữ trong register/biến local; không còn {{new}} trên heap.
5. **Lock elimination**: monitor trên object không escape không ai quan sát được nên bị bỏ.
6. **Deoptimize khi giả định đổi**: ví dụ một implementation mới được load, nhánh hiếm bắt đầu chạy — mã bị bỏ, quay lại chạy chậm rồi biên dịch lại, allocation có thể xuất hiện trở lại.

~~~java
record Point(int x, int y) {}

long sumDistance(int[] xs, int[] ys) {
    long total = 0;
    for (int i = 0; i < xs.length; i++) {
        Point p = new Point(xs[i], ys[i]);   // không escape: có thể scalar replace
        total += Math.abs(p.x()) + Math.abs(p.y());
    }
    return total;
}

List<Point> cache = new ArrayList<>();
void keep(int x, int y) {
    cache.add(new Point(x, y));              // escape vào field -> bắt buộc cấp phát thật
}
~~~

~~~text
Allocation rate đo bằng JFR trên method sumDistance (số minh hoạ)
0-10 s   (interpreter/C1)  : ~800 MB/s
sau C2 compile             : ~0 MB/s   <- scalar replacement
sau deopt (class mới load) : ~800 MB/s vài giây, rồi về ~0 khi C2 compile lại
~~~

### Đo đúng
- Dùng JFR ({{jdk.ObjectAllocationSample}}) hoặc async-profiler mode alloc để tìm hot allocation trên **workload thật**, không chỉ trong microbenchmark.
- JMH cần warm-up, nhiều fork và chống dead-code elimination ({{Blackhole}} hoặc trả kết quả về); benchmark một vòng lạnh thường chỉ đo interpreter.
- Có thể so sánh bằng cách tắt tạm tối ưu trong thí nghiệm ({{-XX:-DoEscapeAnalysis}}) để thấy phần chênh — chỉ dùng khi đo, không dùng trên production.
- Object escape hoặc code quá phức tạp (method quá lớn không inline được, nhiều nhánh hợp nhất object) có thể ngăn tối ưu. Đừng kết luận rằng record hay object nhỏ "luôn được cấp phát trên stack" — HotSpot không có stack allocation, chỉ có scalar replacement khi điều kiện cho phép.

### Lỗi hay gặp
- **Benchmark tự viết bằng vòng for**: số liệu dao động, có khi JIT xoá hết code. Cách tránh: dùng JMH.
- **Thiết kế API dựa vào giả định allocation miễn phí**: lên JDK khác hoặc đổi code nhỏ, GC tăng vọt. Cách tránh: đo trên workload thật, không coi tối ưu JIT là hợp đồng.
- **Tối ưu allocation khi GC không phải nút thắt**: code khó đọc mà không cải thiện gì. Cách tránh: chỉ làm khi allocation flame graph chứng minh nó chiếm đáng kể CPU/GC.
- **Truyền object vào method lớn hoặc qua interface nhiều implementation**: mất inline, object escape. Cách tránh: giữ hot path đơn giản, kiểm tra bằng profiler thay vì đoán.

### Trả lời miệng 1 phút
"Allocation biến mất sau warm-up là do C2: sau khi method đủ nóng và các lời gọi nhỏ được inline, escape analysis chứng minh object không bị return, không lưu vào field hay truyền ra ngoài, nên JIT thay object bằng các biến scalar trong register và bỏ luôn lock trên nó. Nhưng đó là tối ưu phụ thuộc profile: trước khi C2 compile thì vẫn cấp phát, khi giả định đổi thì deoptimize, và code phức tạp hơn hay JDK khác có thể không tối ưu được. Vì vậy tôi không coi nó là hợp đồng. Tôi đo bằng JMH có warm-up và fork, và bằng JFR hoặc async-profiler alloc trên workload thật, rồi chỉ tối ưu allocation khi số liệu cho thấy nó thực sự gây áp lực GC."

> Senior tip: tối ưu allocation khi allocation flame graph chứng minh nó chiếm đáng kể CPU/GC. Thiết kế code rõ ràng trước, đừng phụ thuộc vào một tối ưu JIT khó tái lập giữa các phiên bản JDK.`,
  follow: ['Escape qua field static tác động phân tích ra sao?', 'Vì sao JMH cần warm-up và fork?'],
  tags: ['JIT', 'escape analysis', 'scalar replacement']
},
{
  id: 'jvm-025',
  topic: 'jvm',
  level: 'lead',
  q: 'Latency tăng vài phút sau deploy rồi giảm; compilation và deoptimization tăng. Bạn giải thích tiered compilation và điều tra thế nào?',
  a: `**Tóm tắt:** HotSpot khởi động bằng interpreter và C1, thu profile rồi biên dịch method nóng bằng C2; giai đoạn warm-up này và các lần deoptimization làm latency cao trong vài phút sau deploy rồi tự giảm. Trước khi đổi compiler flag, cần đối chiếu hoạt động JIT (compilation, deopt, CPU của compiler thread), code cache, class loading và GC — vì nhiều thứ "lạnh" cùng xảy ra sau deploy (connection pool, cache), và tương quan không phải nhân quả.

### Hiểu nhanh
Một đội bóng mới vào sân chưa thể chơi hết sức ngay: phải khởi động, làm quen mặt cỏ, đọc lối chơi của đối thủ. JVM cũng vậy: vài phút đầu chạy "chậm rãi" (interpreter, C1) để quan sát code nào hay chạy, rồi mới "tăng tốc" (C2). Nếu đối thủ đổi chiến thuật (giả định sai), đội phải lùi lại điều chỉnh (deoptimization). Nhưng trận đấu chậm đầu giờ cũng có thể vì sân trơn (cache trống) hay thiếu người (connection pool chưa mở) — phải xem đủ các nguyên nhân trước khi trách việc khởi động.

### Thuật ngữ
- **Tiered compilation**: biên dịch nhiều tầng: interpreter → C1 → C2.
- **Invocation / back-edge counter**: bộ đếm số lần gọi method / số vòng lặp, quyết định khi nào biên dịch.
- **Instrumentation**: đoạn code C1 chèn thêm để thu profile, làm code chạy hơi chậm hơn.
- **Deoptimization**: bỏ mã máy đã tối ưu khi giả định (kiểu, class hierarchy, nhánh) không còn đúng.
- **Code cache**: vùng chứa mã máy JIT; đầy thì biên dịch ngừng hoặc suy giảm.
- **CDS / AOT cache**: lưu sẵn class đã xử lý để khởi động nhanh hơn (AOT cache từ JDK 24).
- **Readiness probe**: kiểm tra của Kubernetes quyết định khi nào pod được nhận traffic.
- **Canary**: nhóm nhỏ instance nhận phiên bản mới trước.

### Tiered compilation (từng bước)
1. **Interpreter** chạy bytecode và ghi nhận invocation/back-edge counter. Vì sao bắt đầu từ đây: không tốn thời gian biên dịch code chỉ chạy vài lần.
2. **C1** biên dịch nhanh ở các mức tối ưu khác nhau, có thể gắn instrumentation để thu profile (kiểu thực tế, nhánh hay chạy).
3. **C2** dùng profile để inline và tối ưu mạnh. Trong lúc C2 đang làm việc, compiler thread tiêu tốn CPU cạnh tranh với request.
4. **Deoptimization**: khi giả định về kiểu hoặc class hierarchy không còn đúng (load class mới, nhánh hiếm bắt đầu chạy), code quay về mức thấp hơn rồi được biên dịch lại.
5. **Code cache** lưu machine code; đầy code cache có thể làm compilation ngừng hoặc suy giảm, hiệu năng rơi dần.

~~~text
p99 (ms)
 300 |*
 200 | * *            <- interpreter/C1 + compiler thread ăn CPU
 100 |     * *  *     <- C2 compile xong dần, vài lần deopt
  40 |           * * * * * * * *   <- ổn định
     +--------------------------------> phút sau deploy
       0   1   2   3   4   5   6
~~~

### Điều tra (từng bước)
1. **Ghi dữ liệu ở canary**: JFR (event {{jdk.Compilation}}, {{jdk.Deoptimization}}, {{jdk.CodeCacheFull}}, {{jdk.ClassLoad}}) và log compilation/deoptimization ngắn hạn; xem CPU của compiler thread, mức dùng code cache, số class load.
2. **Tách các nguồn "lạnh" khác**: khởi tạo connection pool, cache rỗng, TLS handshake tới dependency, CDS có được dùng không, GC lúc heap đang nở. Các hiện tượng này thường xảy ra **cùng lúc** với JIT warm-up.
3. **So sánh với nhóm đối chứng**: instance đã warm cùng phiên bản; nếu chênh lệch chỉ có trong vài phút đầu và trùng với đỉnh compilation thì JIT là nguyên nhân chính.
4. **Warm-up có kiểm soát** trước khi nhận traffic (readiness chỉ báo sẵn sàng sau khi chạy một lượng request mẫu), nhưng phải chạy **code path thật**, không chỉ health check.
5. **Không tắt tiered compilation** chỉ dựa vào tương quan: thay đổi đó có thể làm throughput ổn định thấp hơn hoặc khởi động còn chậm hơn.

~~~bash
java -XX:+PrintCompilation -jar app.jar          # tạm thời ở canary
jcmd <pid> Compiler.codecache                    # code cache đang dùng
jcmd <pid> JFR.start duration=5m filename=/data/warmup.jfr
~~~

### Pitfall
- Health check thường không làm nóng hot path, nên pod "ready" vẫn chạy interpreter ở các endpoint chính.
- Benchmark cần đủ warm-up và chạy cùng image/runtime với production.
- CDS/AOT cache có thể giảm startup và class loading nhưng không loại bỏ mọi JIT warm-up (JDK 25 lưu thêm method profile vào AOT cache để rút ngắn phần này, vẫn cần đo).

### Lỗi hay gặp
- **Readiness probe chỉ gọi /health**: p99 tăng vọt khi pod mới nhận traffic thật. Cách tránh: warm-up bằng request mẫu trên endpoint chính trước khi ready.
- **Rolling update quá nhanh**: nhiều pod lạnh cùng lúc, cả cụm chậm. Cách tránh: {{maxSurge}} nhỏ, thêm thời gian chờ giữa các đợt.
- **Pod quá ít CPU**: compiler thread giành CPU với request, warm-up kéo dài. Cách tránh: cho đủ CPU (hoặc CPU limit cao hơn request) giai đoạn đầu.
- **Đổ lỗi JIT trong khi cache rỗng là thủ phạm**: tối ưu nhầm chỗ. Cách tránh: tách từng nguồn lạnh bằng metric riêng.

### Trả lời miệng 1 phút
"HotSpot chạy code bằng interpreter trước, đếm số lần gọi và vòng lặp, method nóng được C1 biên dịch kèm instrumentation để thu profile, rồi C2 dùng profile đó để inline và tối ưu mạnh. Trong vài phút đầu, compiler thread ăn CPU và code chưa tối ưu, cộng với deoptimization khi giả định sai, nên latency cao rồi giảm dần. Khi điều tra tôi ghi JFR và log compilation ở canary, xem CPU compiler thread, code cache, class loading, và tách riêng các nguồn lạnh khác như connection pool hay cache rỗng, so với một nhóm instance đã warm. Cách xử lý là warm-up bằng code path thật trước khi readiness báo sẵn sàng và đủ CPU, chứ không tắt tiered compilation chỉ vì thấy tương quan."

> Senior tip: giữ một nhóm instance đã warm làm đối chứng khi rollout. So p99 cùng CPU, compilation, error rate để phân biệt JIT với dependency cold start.`,
  follow: ['Deoptimization khác compilation failure thế nào?', 'Code cache đầy có biểu hiện gì?'],
  tags: ['tiered compilation', 'C1', 'C2', 'deoptimization']
},
{
  id: 'jvm-026',
  topic: 'jvm',
  level: 'senior',
  q: 'Service chạy ổn nhiều tháng, rồi một hôm chết vì OutOfMemoryError ngay sau khi một khách hàng upload file log 1.5 GB để phân tích. Những đoạn code "tưởng vô hại" nào hay gây OOM kiểu này, và bạn đọc thông điệp lỗi để khoanh vùng ra sao?',
  a: `**Tóm tắt:** Phần lớn OOM ngoài đời không phải leak từ từ mà là **đỉnh cấp phát (allocation spike)**: một request đưa toàn bộ dữ liệu lớn vào bộ nhớ một lúc (đọc cả file, cả result set, cả JSON, gom cả stream vào List). Code chạy tốt với dữ liệu test vài MB, chỉ nổ khi gặp input lớn. Thông điệp sau dấu hai chấm của {{OutOfMemoryError}} cho biết vùng nhớ nào cạn, nên đọc nó trước khi làm bất cứ điều gì.

### 1. Vì sao một file 1.5 GB cần nhiều hơn 1.5 GB heap
Ví dụ đoạn code quen thuộc:
~~~java
// "Đọc file rồi lọc dòng lỗi" - chạy tốt với file 10 MB
List<String> lines = Files.readAllLines(path);           // (1) toàn bộ file thành List<String>
String all = String.join("\\n", lines);                   // (2) thêm một bản sao nữa
Matcher m = Pattern.compile("ERROR.*timeout").matcher(all); // (3) regex trên chuỗi khổng lồ
~~~
Tính thô cho file 1.5 GB, 15 triệu dòng:
~~~text
(1) mảng byte của các String : ~1.5 GB (log ASCII, compact string 1 byte/ký tự)
    header String + mảng     : 15 triệu x ~40 byte  = ~0.6 GB
    ArrayList chứa tham chiếu : 15 triệu x 4-8 byte = ~0.1 GB
(2) join tạo thêm MỘT chuỗi mới chứa toàn bộ nội dung, trong khi List vẫn còn sống
                              : thêm ~1.5 GB
=> đỉnh cần gần 4 GB heap trong khi pod chỉ có -Xmx2g  ->  OutOfMemoryError: Java heap space
~~~
Thêm nữa, mảng Java tối đa khoảng 2^31 phần tử, nên {{Files.readAllBytes}} trên file lớn hơn ~2 GB sẽ ném OOM với thông điệp kiểu "Required array size too large" dù heap còn trống.

### 2. Các mẫu code "vô hại" hay gặp
| Mẫu | Vì sao nổ | Cách sửa |
|---|---|---|
| {{readAllLines}}, {{readAllBytes}}, {{IOUtils.toString}} | Toàn bộ file vào heap | {{Files.lines(path)}} hoặc {{BufferedReader}} xử lý từng dòng, nhớ đóng stream |
| {{repo.findAll()}} / JDBC không đặt fetch size | Driver MySQL mặc định đọc **toàn bộ** result set vào bộ nhớ; driver PostgreSQL cũng vậy trừ khi tắt autocommit và đặt {{fetchSize}} | Phân trang keyset, {{Stream}} của Spring Data trong transaction + fetch size, hoặc {{JdbcTemplate}} với {{RowCallbackHandler}} |
| {{objectMapper.readValue(body, List.class)}} với JSON lớn | Cả cây object trong heap, thường gấp nhiều lần kích thước JSON | Streaming {{JsonParser}} đọc từng phần tử |
| {{collect(Collectors.toList())}} / {{groupingBy}} trên nguồn rất lớn | Stream lazy nhưng collect thì gom hết | Xử lý theo lô (batch 1.000 phần tử), ghi ra đích ngay |
| {{ByteArrayOutputStream}} để build file export | Tăng gấp đôi khi đầy, {{toByteArray()}} copy thêm lần nữa | Ghi thẳng ra {{OutputStream}} của response/S3 multipart |
| {{Executors.newFixedThreadPool}} | Hàng đợi {{LinkedBlockingQueue}} không giới hạn, burst làm queue phình | {{ThreadPoolExecutor}} với queue có capacity + rejection policy |
| Cache {{HashMap}} static, {{ThreadLocal}} không {{remove()}} | Leak từ từ (khác spike), old gen tăng dần qua nhiều ngày | Caffeine có {{maximumSize}}; {{try/finally}} remove |

### 3. Regex trên log lớn: hai vấn đề khác nhau
- **Catastrophic backtracking**: pattern có lượng từ lồng nhau như {{(a+)+b}} hoặc {{(.*,)*x}} gặp chuỗi không khớp sẽ thử số cách tách tăng **theo hàm mũ**. Triệu chứng chính là **CPU 100%, thread treo** trong {{java.util.regex.Pattern}} (thấy rõ trong jstack), không phải OOM. Đây là ReDoS.
- **StackOverflowError**: engine regex của JDK xử lý một số cấu trúc (ví dụ nhóm có alternation lặp lại {{(a|b)*}}) bằng đệ quy, chuỗi đủ dài sẽ làm tràn stack.
- **OOM** thường đến từ việc **nạp cả log thành một String** để chạy regex, như ví dụ ở mục 1.

Cách làm an toàn: chạy regex **từng dòng**, giới hạn độ dài dòng (cắt dòng trên 10 KB), viết pattern không lồng lượng từ (dùng lớp ký tự phủ định như {{[^,]*}} thay cho {{.*}}, possessive quantifier {{*+}} hoặc atomic group {{(?>...)}} để chặn backtrack), và không bao giờ biên dịch pattern lấy từ input người dùng.

### 4. Đọc thông điệp OOM để khoanh vùng
| Thông điệp | Vùng cạn | Hướng điều tra |
|---|---|---|
| Java heap space | Heap | Heap dump: spike thì thấy một thread giữ object khổng lồ; leak thì thấy collection to dần |
| GC overhead limit exceeded | Heap gần đầy, GC chạy liên tục mà thu hồi rất ít | Giống heap space, thường là leak |
| Requested array size exceeds VM limit | Xin mảng lớn hơn giới hạn của JVM | Tìm code tạo mảng/collection cực lớn |
| Metaspace / Compressed class space | Metadata của class | Classloader leak, sinh class động (proxy, script) không giới hạn |
| Direct buffer memory | Bộ nhớ ngoài heap của NIO | Netty/NIO buffer, {{-XX:MaxDirectMemorySize}}, Native Memory Tracking |
| unable to create native thread | OS không cho tạo thêm thread | Đếm thread bằng jstack, tìm pool không giới hạn |

Lưu ý: pod bị **OOMKilled** (exit code 137) **không** phải {{OutOfMemoryError}}. Đó là kernel giết process vì tổng bộ nhớ (heap + ngoài heap) vượt memory limit của container, nên sẽ không có stack trace hay heap dump.

> Senior tip: mọi API nhận file hoặc trả dữ liệu "toàn bộ" phải có **giới hạn kích thước** ({{spring.servlet.multipart.max-file-size}}, giới hạn số dòng export) và được load test với input lớn gấp 10 lần dữ liệu thật. Quy tắc tôi dùng khi review: thấy {{readAll}}, {{findAll()}}, {{toList()}} hay {{toByteArray()}} ở đường xử lý dữ liệu người dùng thì hỏi ngay "input lớn nhất là bao nhiêu?". Câu hỏi đó chặn được phần lớn OOM loại spike trước khi lên production.`,
  follow: [
    'Làm sao phân biệt OOM do spike và OOM do leak chỉ bằng biểu đồ heap sau GC?',
    'Spring Data trả về {{Stream<Order>}}: cần những điều kiện gì để thật sự streaming và không giữ hết entity trong persistence context?',
    'Bạn bảo vệ một API cho phép người dùng nhập regex tìm kiếm thế nào?'
  ],
  tags: ['OutOfMemoryError', 'allocation spike', 'ReDoS', 'regex', 'streaming', 'fetchSize'],
  refs: [
    { type: 'doc', title: 'Troubleshooting Memory Leaks (Java SE 21 Troubleshooting Guide)', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html' },
    { type: 'doc', title: 'java.util.regex.Pattern (Java SE 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html' },
    { type: 'article', title: 'OWASP: Regular expression Denial of Service - ReDoS', url: 'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS' }
  ]
},
{
  id: 'jvm-027',
  topic: 'jvm',
  level: 'lead',
  q: 'Bạn là người trực sự cố: service thanh toán trên Kubernetes liên tục restart vì hết bộ nhớ. Trình bày playbook xử lý OOM của bạn, từ chuẩn bị trước sự cố, cấp cứu, thu thập bằng chứng đến phân tích và phòng ngừa.',
  a: `**Tóm tắt:** Playbook có 4 pha. **Chuẩn bị** (trước sự cố): cờ JVM để tự dump và tự thoát, JFR chạy liên tục, metric + alert về heap sau GC và memory của container. **Cấp cứu**: xác định đó là Java OOM hay container OOMKilled, khôi phục dịch vụ (rollback, scale, tăng limit tạm) mà **không làm mất bằng chứng**. **Thu thập và phân tích**: heap dump bằng Eclipse MAT, Native Memory Tracking cho ngoài heap, JFR/async-profiler cho allocation. **Phòng ngừa**: sửa gốc, thêm test tải và alert.

### Pha 0: chuẩn bị (phải làm TRƯỚC sự cố)
~~~bash
-XX:MaxRAMPercentage=70                 # heap = 70% memory limit của container
-XX:+HeapDumpOnOutOfMemoryError         # tự dump khi OOM do JVM ném (heap, metaspace)
-XX:HeapDumpPath=/dumps                 # volume bền vững, đủ chỗ >= kích thước heap
-XX:+ExitOnOutOfMemoryError             # dump xong thì thoát, để Kubernetes restart sạch
-XX:NativeMemoryTracking=summary        # chỉ bật được lúc khởi động
-XX:StartFlightRecording=name=blackbox,maxage=6h,maxsize=512m
~~~
Vì sao cần {{ExitOnOutOfMemoryError}}: sau OOM, một số thread có thể đã chết giữa chừng (scheduler, consumer Kafka) nhưng process vẫn sống và health check vẫn xanh. Đó là trạng thái "zombie" tệ hơn chết hẳn. Thoát ngay để orchestrator thay pod mới.

Metric và alert (Micrometer + Prometheus) cần có sẵn:
| Metric | Alert gợi ý | Ý nghĩa |
|---|---|---|
| Heap còn lại **sau GC** ({{jvm_gc_live_data_size_bytes}} so với {{jvm_gc_max_data_size_bytes}}) | > 80% trong 15 phút | Dấu hiệu leak sớm, nhiều giờ trước khi OOM |
| {{jvm_gc_pause_seconds}} | Tổng pause > 10% thời gian | GC "thở dốc", sắp OOM |
| {{container_memory_working_set_bytes}} / limit | > 90% | Nguy cơ OOMKilled (gồm cả ngoài heap) |
| Số lần restart, lý do {{OOMKilled}} | Bất kỳ | Phải có người xem |

### Pha 1: cấp cứu, phân loại trong 5 phút đầu
~~~text
kubectl describe pod ... -> Last State
   |
   +-- Reason: OOMKilled, exit 137  --> KERNEL giết: tổng RSS > limit
   |        (không có heap dump; nghi ngoài heap: thread, direct buffer, metaspace, malloc)
   |
   +-- Error, exit 3 / log có "java.lang.OutOfMemoryError: <thông điệp>"
            --> JVM ném OOM; đọc thông điệp để biết vùng nhớ, tìm file .hprof
~~~
Khôi phục dịch vụ theo thứ tự ưu tiên:
1. Có deploy gần đây? **Rollback** trước, phân tích sau.
2. OOM do một loại request (file lớn, export)? Chặn tạm bằng feature flag hoặc rate limit.
3. Tăng memory limit / heap tạm thời để mua thời gian (ghi rõ là biện pháp tạm).
4. **Giữ một pod "bệnh"** để lấy bằng chứng: bỏ nhãn khỏi Service để không nhận traffic thay vì xoá pod.

### Pha 2: thu thập bằng chứng
~~~bash
jcmd <pid> GC.heap_info                              # heap đang dùng thế nào
jcmd <pid> GC.class_histogram | head -30             # class nào chiếm nhiều nhất (nhanh, nhẹ)
jcmd <pid> GC.heap_dump /dumps/live.hprof            # dump chủ động; mặc định chỉ object còn sống
jcmd <pid> VM.native_memory summary                  # ngoài heap: thread, class, code, GC, internal
jcmd <pid> JFR.dump name=blackbox filename=/dumps/rec.jfr  # lấy tối đa 6 giờ gần nhất
~~~
- Heap dump **dừng JVM** trong lúc ghi (heap 4 GB có thể mất vài giây đến vài chục giây) và file to bằng phần heap đang dùng. Không dump pod đang phục vụ traffic.
- Heap dump chứa **dữ liệu thật** (số thẻ, token, thông tin khách). Xử lý như dữ liệu nhạy cảm: lưu chỗ mã hoá, giới hạn người truy cập, xoá sau khi xong.

### Pha 3: phân tích
- **Eclipse MAT**: mở báo cáo **Leak Suspects** trước. Sau đó **Dominator Tree** sắp theo retained size (lượng bộ nhớ được giải phóng nếu object đó biến mất). Chọn object lớn nhất, xem **Path to GC Roots** để biết ai đang giữ nó (static field, ThreadLocal của thread nào, cache nào).
- Spike hay leak: spike thường thấy một thread đang xử lý request giữ một mảng/collection khổng lồ; leak thường thấy collection hàng triệu phần tử treo trên một static field hoặc cache.
- Ngoài heap: so sánh hai lần {{VM.native_memory summary.diff}} (sau khi chạy {{VM.native_memory baseline}}) cách nhau 30 phút để thấy vùng nào tăng.
- Allocation: JFR event {{jdk.ObjectAllocationSample}} hoặc async-profiler ({{asprof -e alloc -d 60 -f alloc.html <pid>}}) cho flame graph "ai cấp phát nhiều nhất", hữu ích khi không chụp được dump đúng lúc.

### Pha 4: phòng ngừa và postmortem
- Sửa gốc + test tái hiện (input lớn, load test chạy vài giờ để lộ leak).
- Thêm giới hạn: kích thước upload, cache có {{maximumSize}}, queue có capacity.
- **Continuous profiling** (JFR liên tục, hoặc async-profiler qua công cụ như Pyroscope) để lần sau có dữ liệu ngay thời điểm trước sự cố.

> Senior tip: đo thời gian từ alert tới "có heap dump trong tay" như một chỉ số của đội. Nhiều đội mất cả ngày chỉ vì dump ghi vào filesystem tạm của container và mất theo pod restart. Hãy diễn tập: cố tình gây OOM trên staging mỗi quý và kiểm tra dump có nằm đúng chỗ, mở được bằng MAT, alert có kêu không. Một playbook chưa diễn tập lần nào thường hỏng đúng lúc cần.`,
  follow: [
    'Pod bị OOMKilled mà heap chỉ dùng 50%: bạn lập "ngân sách bộ nhớ" của process thế nào?',
    'ExitOnOutOfMemoryError so với CrashOnOutOfMemoryError: khi nào chọn cái nào?',
    'Heap dump 16 GB không mở được trên laptop: bạn phân tích bằng cách nào?'
  ],
  tags: ['OutOfMemoryError', 'incident', 'heap dump', 'MAT', 'NMT', 'JFR', 'async-profiler', 'OOMKilled'],
  refs: [
    { type: 'doc', title: 'Java SE 21 Troubleshooting Guide: Diagnostic Tools', url: 'https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html' },
    { type: 'doc', title: 'Native Memory Tracking (Java SE 21)', url: 'https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html' },
    { type: 'doc', title: 'The java Command (Java SE 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html' },
    { type: 'doc', title: 'Eclipse Memory Analyzer (MAT)', url: 'https://eclipse.dev/mat/' },
  ]
},
{
  id: 'jvm-028',
  topic: 'jvm',
  level: 'senior',
  q: 'Sau một đợt tải cao, pod Java vẫn giữ RSS gần mức đỉnh dù heap sau GC chỉ còn 20%. Vì sao JVM không trả bộ nhớ cho OS, và bạn chọn {{-Xms}}, {{AlwaysPreTouch}}, uncommit heap thế nào cho từng loại workload?',
  a: `**Tóm tắt:** Heap có ba con số khác nhau: **used** (object đang chiếm), **committed** (vùng JVM đã xin OS) và **max** ({{-Xmx}}). RSS đi theo committed, không theo used. G1 chỉ thu nhỏ committed heap sau Full GC hoặc khi kết thúc một chu kỳ concurrent mark, nên service hết tải thì cũng hết GC và RSS đứng yên. Với API latency nhạy trên K8s, tôi đặt {{-Xms}} = {{-Xmx}} và chấp nhận RSS cố định; với batch hoặc nhiều JVM chung máy thì cho heap co lại bằng uncommit định kỳ.

### Ba con số của heap
~~~text
max (Xmx)   |-----------------------------------------|  4 GB   (chỉ giữ chỗ địa chỉ ảo)
committed   |----------------------------|               2.8 GB (đã xin OS)
used        |-------|                                    600 MB (object còn sống)
~~~
- **Reserve**: lúc khởi động JVM giữ trước một dải địa chỉ ảo bằng Xmx; chưa tốn RAM thật.
- **Commit**: JVM báo OS sẽ dùng vùng này. Linux cấp trang vật lý kiểu lười: trang chỉ tính vào RSS khi được ghi lần đầu.
- **Uncommit**: JVM trả vùng lại cho OS. Chỉ lúc này RSS mới giảm.

Vì sao JVM không trả ngay sau mỗi GC: commit/uncommit tốn system call, và mỗi trang xin lại phải chịu page fault khi chạm lần đầu. Nếu vừa trả xong tải lại tăng, latency xấu đúng lúc cần nhanh. Vì vậy GC giữ lại phần đã commit "để dành".

### Khi nào mỗi GC thu nhỏ heap
| GC | Khi nào uncommit | Flag liên quan |
|---|---|---|
| G1 | Sau Full GC và cuối chu kỳ concurrent, theo {{MinHeapFreeRatio}}/{{MaxHeapFreeRatio}} (mặc định 40/70) | {{-XX:G1PeriodicGCInterval=<ms>}} (JEP 346, JDK 12): rảnh quá lâu thì tự chạy một chu kỳ để co heap |
| ZGC | Tự uncommit vùng không dùng sau một khoảng trễ (JEP 351) | {{-XX:ZUncommitDelay}} (giây, mặc định 300), {{-XX:-ZUncommit}} để tắt |
Không GC nào co heap xuống dưới {{-Xms}}. Đặt Xms = Xmx nghĩa là tắt hẳn khả năng trả bộ nhớ.

### Ví dụ thực tế
Service báo cáo: ngày thường heap used 500 MB, cuối tháng chạy export đẩy committed lên 3.5 GB. Export xong, tải thấp nên young GC thưa, old gen chưa vượt ngưỡng IHOP nên không có concurrent cycle, không có Full GC. RSS giữ 3.5 GB cả tháng. Node chạy 6 pod như vậy bị memory pressure và kubelet evict pod khác.

~~~bash
# Batch / nhiều JVM chung node: cho phép heap co lại
-Xms512m -Xmx4g -XX:+UseG1GC -XX:G1PeriodicGCInterval=60000   # rảnh 60 s thì chạy 1 chu kỳ
# API latency nhạy, pod Guaranteed (request = limit): cố định heap, chạm trước mọi trang
-Xms3g -Xmx3g -XX:+AlwaysPreTouch
~~~

### AlwaysPreTouch: đổi startup lấy latency ổn định
{{-XX:+AlwaysPreTouch}} ghi vào mọi trang của heap ngay khi khởi động. Lợi: không còn page fault rải rác lúc phục vụ (GC copy object sang vùng mới chạm lần đầu sẽ làm pause dài thêm); RSS bằng Xms ngay từ đầu, nên nếu limit không đủ thì pod chết ngay lúc start thay vì chết lúc cao điểm. Hại: startup chậm hơn (heap càng lớn càng lâu), không hợp với tool CLI hay scale-to-zero.

### Chọn theo workload
| Workload | Xms | Uncommit | PreTouch |
|---|---|---|---|
| API latency nhạy, pod Guaranteed | = Xmx | Không cần | Bật |
| Batch theo đợt, nhiều JVM chung node | Nhỏ (khoảng 25% Xmx) | G1PeriodicGCInterval hoặc ZGC | Tắt |
| Dev, CI, tool nội bộ | Nhỏ | Bật | Tắt |

### Pitfall production
- Đặt Xms nhỏ cho API: heap nở dần qua nhiều GC, mấy phút đầu sau deploy GC dày và latency xấu; tệ hơn, chỉ biết limit thiếu khi heap nở hết vào giờ cao điểm.
- Gọi {{System.gc()}} để "trả RAM": tốn một Full GC stop-the-world, và nhiều image đặt {{-XX:+DisableExplicitGC}} nên lệnh này vô tác dụng.
- Nhìn {{jvm_memory_used_bytes}} để suy ra RSS: phải xem {{jvm_memory_committed_bytes}} và RSS của container ({{container_memory_working_set_bytes}}).
- RSS cao nhưng committed heap thấp: thủ phạm nằm ngoài heap (metaspace, thread stack, direct buffer, malloc), cần NMT chứ không phải uncommit.

> Senior tip: trên K8s tôi mặc định Xms = Xmx + AlwaysPreTouch cho service online, vì với pod Guaranteed scheduler đã dành sẵn phần RAM đó; trả lại OS cũng không pod nào khác dùng được mà còn mất latency. Uncommit chỉ đáng bật khi nhiều JVM thật sự chia nhau RAM hoặc job chạy theo đợt. Trước khi tune, vẽ ba đường used, committed, RSS cạnh nhau trên dashboard: phần lớn câu hỏi "vì sao RAM không giảm" được trả lời ngay bằng biểu đồ đó.`,
  follow: [
    'Vì sao Xms nhỏ có thể khiến pod chỉ bị OOMKilled vào giờ cao điểm thay vì ngay lúc khởi động?',
    'G1PeriodicGCInterval ảnh hưởng gì tới CPU và latency của một service đang rảnh?',
    'Metric nào giúp phân biệt "heap chưa co lại" với native memory leak?'
  ],
  tags: ['heap sizing', 'Xms', 'AlwaysPreTouch', 'uncommit', 'G1PeriodicGCInterval', 'RSS', 'Kubernetes'],
  refs: [
    { type: 'doc', title: 'JEP 346: Promptly Return Unused Committed Memory from G1', url: 'https://openjdk.org/jeps/346' },
    { type: 'doc', title: 'JEP 351: ZGC: Uncommit Unused Memory', url: 'https://openjdk.org/jeps/351' }
  ]
},
{
  id: 'jvm-029',
  topic: 'jvm',
  level: 'senior',
  q: 'Log production đầy dòng {{java.lang.NullPointerException}} không có stack trace và không có message, trong khi lúc mới deploy vẫn có đủ. Vì sao JVM làm vậy, chi phí thật của việc tạo exception nằm ở đâu, và bạn xử lý thế nào?',
  a: `**Tóm tắt:** Đây là tối ưu {{OmitStackTraceInFastThrow}} của C2 JIT, bật mặc định: khi một số exception **ngầm** do JVM ném (NullPointerException, ArithmeticException, ArrayIndexOutOfBoundsException, ArrayStoreException, ClassCastException) xảy ra lặp lại nhiều lần tại cùng một chỗ trong code đã compile, JVM thay bằng một object exception dựng sẵn, không stack trace, không message. Lý do: chụp stack trace là phần đắt nhất của exception. Xử lý: tìm lần xuất hiện sớm nhất trong log (còn đủ stack), cân nhắc chạy với {{-XX:-OmitStackTraceInFastThrow}}, và quan trọng nhất là sửa để luồng bình thường không ném exception lặp đi lặp lại.

### Exception đắt ở đâu
Constructor của {{Throwable}} gọi {{fillInStackTrace()}}: JVM đi ngược toàn bộ stack của thread và chụp từng frame. Stack của request Spring qua Tomcat, filter, proxy thường sâu 100–200 frame. Khi log, {{getStackTrace()}} còn đổi dữ liệu thô thành mảng {{StackTraceElement}} (class, method, file, dòng) và logger nối thành chuỗi vài KB.

| Bước | Chi phí tương đối |
|---|---|
| {{throw}}/{{catch}} trong cùng method đã JIT | Rẻ, JIT có thể biến thành lệnh nhảy |
| Tạo exception + fillInStackTrace | Đắt, tỉ lệ với độ sâu stack (cỡ micro giây) |
| Log stack trace ra file/JSON | Đắt nhất: format chuỗi, I/O, chi phí lưu trữ log |

So với một lệnh {{if}} cỡ nano giây, tạo exception có stack đắt hơn hàng nghìn lần. Ném vài lần mỗi phút thì không sao; ném hàng nghìn lần mỗi giây trong luồng bình thường thì thành vấn đề CPU.

### Cơ chế fast throw từng bước
1. Method {{sum()}} chạy nóng, C2 compile nó.
2. Profile cho thấy nhánh "ném NPE ngầm" tại {{o.total()}} thực sự xảy ra nhiều lần.
3. C2 recompile: thay vì tạo NPE mới, ném một instance NPE **dựng sẵn**, không stack trace, không message (kể cả helpful NPE message của JDK 14+).
4. Từ đó log chỉ còn tên exception trơn.

~~~text
10:00:01 ERROR java.lang.NullPointerException: Cannot invoke "Order.total()" because "o" is null
    at com.shop.Report.sum(Report.java:42) ...       <- những lần đầu: đủ stack
10:07:45 ERROR java.lang.NullPointerException        <- sau khi C2 tối ưu: trống trơn
~~~
Chỉ áp dụng cho exception JVM ném ngầm. {{throw new IllegalArgumentException(...)}} do bạn viết thì không bị cắt.

### Xử lý khi gặp
- Tìm lần xuất hiện **sớm nhất** sau deploy/restart: những lần đầu vẫn có đủ stack.
- Bật {{-XX:-OmitStackTraceInFastThrow}} để luôn có stack. Đánh đổi: nếu NPE thật sự xảy ra hàng nghìn lần mỗi giây thì CPU và log tăng; nhưng đó là bug cần sửa, không phải lý do để giấu.
- Cảnh báo theo số dòng ERROR trùng lặp: exception lặp với tần suất cao mới kích hoạt tối ưu này.

### Đừng dùng exception làm control flow
~~~java
// Sai: 30% dòng là rỗng, mỗi dòng rỗng tạo một exception có stack
try { qty = Integer.parseInt(s); } catch (NumberFormatException e) { qty = 0; }

// Đúng: kiểm tra trước, exception chỉ dành cho trường hợp thật sự bất thường
qty = (s == null || s.isBlank()) ? 0 : Integer.parseInt(s.strip());

// Lỗi nghiệp vụ biết trước, ném rất nhiều, stack không giúp gì:
final class QuotaExceeded extends RuntimeException {
    QuotaExceeded(String msg) {
        super(msg, null, false, false); // tắt suppressed và không ghi stack trace
    }
}
~~~
Constructor 4 tham số {{(message, cause, enableSuppression, writableStackTrace)}} có từ Java 7, là protected nên chỉ gọi từ subclass. Chỉ dùng cho lỗi nghiệp vụ trả 4xx; lỗi kỹ thuật luôn giữ stack.

### Pitfall production
- Log đủ stack cho lỗi 4xx dự đoán được (validation, quota): log phình, chi phí lưu trữ tăng, lỗi thật bị chìm.
- Catch rồi {{throw new XxxException(e.getMessage())}}: mất stack gốc; luôn truyền {{e}} làm cause.
- Kết luận "logger cấu hình sai nên mất stack": thực ra là JIT.

> Senior tip: thấy NPE trơn trong log, tôi hiểu ngay "lỗi này đã xảy ra rất nhiều lần", chưa cần đọc stack đã biết mức độ. Ở các service tôi phụ trách, {{-XX:-OmitStackTraceInFastThrow}} nằm trong bộ flag chuẩn: mất chút hiệu năng trong trường hợp xấu, đổi lại không bao giờ phải restart pod chỉ để lấy lại stack trace lúc đang sự cố.`,
  follow: [
    'Vì sao chỉ exception ngầm do JVM ném mới bị tối ưu, còn exception bạn tự throw thì không?',
    'Khi nào bạn dùng writableStackTrace = false, khi nào tuyệt đối không?',
    'Bạn đo chi phí tạo exception thế nào cho đáng tin thay vì đoán?'
  ],
  tags: ['OmitStackTraceInFastThrow', 'exception', 'stack trace', 'JIT', 'C2', 'NullPointerException']
},
{
  id: 'jvm-030',
  topic: 'jvm',
  level: 'senior',
  q: 'Đồng nghiệp đo bằng vòng {{for}} + {{System.nanoTime()}} và kết luận cách B nhanh gấp 10 lần cách A. Vì sao micro-benchmark kiểu này thường sai trên JVM, và bạn viết lại bằng JMH thế nào để kết quả đáng tin?',
  a: `**Tóm tắt:** JVM thay đổi code trong lúc chạy: interpreter, rồi C1, rồi C2; inline; xoá code có kết quả không được dùng; tính sẵn hằng số; thay vòng lặp đang chạy bằng bản compile (OSR). Vòng for tự viết thường đo nhầm giai đoạn warm-up, hoặc đo code mà JIT đã xoá. JMH (Java Microbenchmark Harness của OpenJDK) lo warm-up, chạy mỗi benchmark trong JVM riêng (fork), chống xoá code bằng giá trị trả về hoặc {{Blackhole}}, và báo kết quả kèm sai số. Ngay cả với JMH, micro-benchmark chỉ trả lời câu hỏi hẹp; quyết định production phải dựa trên profile dưới tải thật.

### Năm cái bẫy của vòng for tự viết
| Bẫy | Chuyện gì xảy ra | Hậu quả |
|---|---|---|
| Không warm-up | Đo lẫn thời gian interpreter và thời gian compile | Cách chạy trước chịu thiệt |
| Dead-code elimination | Kết quả không ai dùng, C2 xoá cả phép tính | "Nhanh" vô lý, dưới 1 ns/op |
| Constant folding | Input là hằng số, JIT tính sẵn lúc compile | Đo phép gán chứ không đo thuật toán |
| OSR | Vòng lặp dài trong {{main}} được thay giữa chừng bằng bản compile kém tối ưu hơn | Số liệu khác hẳn khi code nằm trong method được gọi nhiều lần |
| Đo A rồi B trong cùng JVM | Profile của A ảnh hưởng cách compile B (call site đa hình, trạng thái GC) | Đảo thứ tự là đảo kết quả |

Ví dụ thật: "B nhanh gấp 10 lần" vì B tính xong không trả kết quả ra ngoài, C2 xoá gần hết thân method.

### Viết lại bằng JMH
~~~java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)          // 5 lần x 1 giây cho JIT ổn định
@Measurement(iterations = 5, time = 1)
@Fork(2)                                   // 2 JVM riêng, profile không lẫn nhau
@State(Scope.Thread)
public class JoinBench {
    @Param({"10", "1000"})                 // đo với nhiều kích thước input
    int size;
    List<String> items;

    @Setup(Level.Trial)
    public void setup() {                  // tạo dữ liệu ngoài phần được đo
        items = IntStream.range(0, size).mapToObj(i -> "item" + i).toList();
    }

    @Benchmark
    public String streamJoin() {           // trả kết quả: JMH tiêu thụ, JIT không xoá được
        return items.stream().collect(Collectors.joining(","));
    }

    @Benchmark
    public void stringJoin(Blackhole bh) { // cách khác: đưa kết quả vào Blackhole
        bh.consume(String.join(",", items));
    }
}
~~~
Chạy: {{java -jar target/benchmarks.jar JoinBench -prof gc}}. Profiler {{gc}} in thêm {{gc.alloc.rate.norm}} (byte cấp phát mỗi op). Con số này thường quan trọng hơn ns/op, vì allocation đẩy áp lực GC lên cả service chứ không riêng hàm đang đo.

### Đọc kết quả
~~~text
Benchmark             (size)  Mode  Cnt     Score     Error  Units
JoinBench.streamJoin    1000  avgt   10  9120.4 ±  310.2  ns/op
JoinBench.stringJoin    1000  avgt   10  7480.9 ±  255.7  ns/op
~~~
(số liệu minh hoạ)
- Nhìn cột Error: nếu khoảng sai số của hai bên chồng lên nhau thì chưa kết luận được.
- Chênh 20% của một thao tác 9 µs chỉ đáng quan tâm khi nó nằm trong hot path chạy rất nhiều lần mỗi giây.
- Hai benchmark phải làm **cùng một việc** (cùng output); so hai hàm khác nghĩa là lỗi review hay gặp.

### Pitfall khi dùng JMH
- Chạy trong IDE hoặc trên laptop đang mở nhiều thứ: dùng máy yên tĩnh, cùng JDK, cùng GC, cùng số core với production.
- {{@Setup(Level.Invocation)}} cho benchmark rất ngắn: chi phí setup lẫn vào phép đo.
- Benchmark một hàm cô lập rồi suy ra cả service nhanh hơn: trong service thật, cache CPU, GC và lock contention khác hẳn.
- Không ghi lại phiên bản JDK, flag, phần cứng: không ai tái lập được kết quả.

> Senior tip: khi review PR "tối ưu hiệu năng", tôi yêu cầu ba thứ: (1) profile production hoặc load test chỉ ra đúng chỗ nóng, (2) JMH chứng minh cải thiện vượt sai số, kèm {{-prof gc}}, (3) đo lại p99 sau deploy. Thiếu (1) thường là tối ưu chỗ không ai quan tâm; thiếu (3) thì chưa biết cải thiện có thật hay không.`,
  follow: [
    'Vì sao JMH khuyên dùng @Fork thay vì chạy mọi benchmark trong cùng một JVM?',
    'Khi nào đo throughput (Mode.Throughput) thay vì average time, và đo phân vị latency thế nào?',
    'gc.alloc.rate.norm cho bạn biết điều gì mà ns/op không cho biết?'
  ],
  tags: ['JMH', 'benchmark', 'JIT', 'dead code elimination', 'warm-up', 'performance'],
  refs: [
  ]
},
{
  id: 'jvm-031',
  topic: 'jvm',
  level: 'lead',
  q: 'Team gắn OpenTelemetry/APM Java agent cho toàn bộ service: startup chậm thêm, CPU tăng, có lúc service không khởi động được vì {{VerifyError}}. Java agent hoạt động bên trong thế nào, rủi ro ở đâu, và bạn đưa agent lên production ra sao?',
  a: `**Tóm tắt:** Java agent là một JAR được JVM nạp trước {{main}} qua {{-javaagent}}. Nó nhận object {{Instrumentation}} và đăng ký {{ClassFileTransformer}} để **sửa bytecode** của class ngay lúc class được load (hoặc retransform class đã load). APM agent chèn code đo thời gian và truyền trace context vào hàng trăm thư viện. Cái giá: startup chậm vì mọi class đi qua transformer, CPU và allocation tăng ở mọi điểm được gắn, bytecode sinh sai hoặc hai agent sửa cùng class có thể gây {{VerifyError}}. Đưa lên production cần đo overhead, tắt instrumentation thừa, cố định phiên bản và có công tắc gỡ agent nhanh.

### Cơ chế từng bước
1. JVM khởi động với {{-javaagent:/otel/opentelemetry-javaagent.jar}}. Manifest của JAR khai báo {{Premain-Class}}.
2. Trước {{main}}, JVM gọi {{premain(String args, Instrumentation inst)}} của agent.
3. Agent gọi {{inst.addTransformer(...)}}. Từ đó **mỗi class** được load (Spring, Hibernate, JDBC driver...) đi qua {{transform}}: nhận mảng byte bytecode, trả mảng byte mới, hoặc {{null}} nếu giữ nguyên.
4. Agent dùng Byte Buddy/ASM chèn code vào đầu và cuối method, ví dụ quanh {{PreparedStatement.execute}}: mở span, đo thời gian, gắn câu SQL.
5. Bytecode mới vẫn đi qua verifier như bình thường rồi mới chạy.

~~~java
public final class TimingAgent {
    public static void premain(String args, Instrumentation inst) {
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                                    Class<?> redefined, ProtectionDomain pd, byte[] bytes) {
                if (className == null || !className.startsWith("com/shop/")) {
                    return null;                 // null = không đổi, đường rẻ nhất
                }
                return Weaver.addTiming(bytes);  // lớp tự viết, dùng ASM sửa bytecode
            }
        }, true);                                // true: cho phép retransform về sau
    }
}
~~~

### Agent nạp lúc khởi động và agent nạp động
| | {{-javaagent}} lúc khởi động | Attach vào JVM đang chạy |
|---|---|---|
| Entry point | {{premain}} | {{agentmain}} (manifest {{Agent-Class}}) |
| Dùng cho | APM, tracing, code coverage | Profiler, công cụ chẩn đoán |
| Từ JDK 21 | Bình thường | JVM in cảnh báo (JEP 451); dự kiến bản sau cấm mặc định, cho phép lại bằng {{-XX:+EnableDynamicAgentLoading}} |
JEP 451 theo nguyên tắc "integrity by default": thư viện không được tự attach agent vào chính JVM của mình để vượt qua encapsulation. Nếu team cần một công cụ attach động thường xuyên, hãy bật flag tường minh để quyết định đó hiện ra trong cấu hình.

### Chi phí và rủi ro thật
- **Startup**: hàng chục nghìn class của app Spring Boot đều đi qua transformer; agent APM đầy đủ thường làm startup chậm thêm vài giây. Ảnh hưởng readiness probe và tốc độ autoscale.
- **Runtime**: mỗi span là vài object; endpoint gọi 50 query là 50 span. Sampling giảm chi phí export và lưu trữ, nhưng code đã chèn vẫn chạy trên mọi request.
- **Xung đột**: hai agent (APM + security agent) cùng sửa một class có thể sinh bytecode lỗi, gây {{VerifyError}} hoặc hành vi lạ chỉ xuất hiện theo thứ tự load nhất định.
- **Lệ thuộc phiên bản**: agent cũ không đọc được class file của JDK mới hoặc không biết thư viện mới, nên khi nâng JDK, agent thường là thứ chặn đầu tiên.
- **Bảo mật**: agent có toàn quyền trong JVM; JAR phải lấy từ nguồn tin cậy và kiểm checksum.

### Quy trình đưa lên production
1. Đo trước và sau trên load test: thời gian startup, p99, CPU, allocation rate.
2. Tắt instrumentation không cần (OTel agent cho phép bật/tắt theo từng thư viện), cấu hình sampling phù hợp.
3. Cố định phiên bản agent trong base image; nâng cấp như nâng thư viện: đọc changelog, canary.
4. Có công tắc: biến môi trường bỏ {{-javaagent}} khi sự cố, không cần build lại image.
5. Span nghiệp vụ thì viết bằng API (OpenTelemetry API, Micrometer Observation) thay vì bắt agent đoán.

> Senior tip: sự cố tôi gặp nhiều nhất với agent không phải overhead mà là **nâng JDK**: nâng 17 lên 21, service không start được vì agent cũ không hiểu class file mới. Từ đó agent nằm trong danh sách dependency bắt buộc kiểm khi nâng JDK, và pipeline luôn chạy smoke test **có gắn agent**, thay vì test không agent ở CI rồi mới gắn agent ở production.`,
  follow: [
    'premain và agentmain khác nhau thế nào, và JEP 451 thay đổi gì với agent nạp động?',
    'Khi nào bạn instrument bằng agent, khi nào bằng code (Micrometer Observation, OpenTelemetry API)?',
    'Làm sao chứng minh một VerifyError là do xung đột giữa hai agent?'
  ],
  tags: ['java agent', 'instrumentation', 'bytecode', 'OpenTelemetry', 'APM', 'JEP 451'],
  refs: [
    { type: 'doc', title: 'JEP 451: Prepare to Disallow the Dynamic Loading of Agents', url: 'https://openjdk.org/jeps/451' },
    { type: 'doc', title: 'java.lang.instrument (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.instrument/java/lang/instrument/package-summary.html' }
  ]
},
{
  id: 'jvm-032',
  topic: 'jvm',
  level: 'lead',
  q: 'Service xử lý file lớn dùng {{ByteBuffer.allocateDirect}} và thỉnh thoảng gặp {{OutOfMemoryError}} về direct buffer memory dù heap còn trống. Vì sao bộ nhớ direct "không được trả", và Foreign Function & Memory API (Java 22) với {{Arena}} thay đổi cách quản lý off-heap ra sao?',
  a: `**Tóm tắt:** {{allocateDirect}} cấp bộ nhớ ngoài heap, nhưng vùng đó chỉ được giải phóng khi **object ByteBuffer nhỏ trên heap** bị GC thu gom và Cleaner của nó chạy. Heap rảnh thì GC ít chạy, nên hàng GB off-heap có thể bị giữ bởi buffer đã "chết" nhưng chưa được dọn; chạm {{-XX:MaxDirectMemorySize}} (mặc định bằng max heap) thì JVM ném OOM. FFM API (JEP 454, chính thức ở Java 22, preview ở Java 21) cho phép cấp phát off-heap gắn với một {{Arena}} và giải phóng **xác định** khi đóng arena, có kiểm tra biên và chặn dùng sau khi giải phóng. Thường cách sửa tốt nhất lại đơn giản hơn: đừng cấp buffer mới cho mỗi request, hãy pool hoặc stream qua buffer cố định.

### Vì sao direct buffer "dính"
~~~text
Heap:      [DirectByteBuffer, vài chục byte] --Cleaner--+
Off-heap:  [================ 64 MB native ============]<+
~~~
1. {{allocateDirect(64 MB)}} xin 64 MB ngoài heap, đồng thời tạo object DirectByteBuffer nhỏ trên heap và đăng ký một Cleaner.
2. Code không còn tham chiếu tới buffer, nhưng 64 MB vẫn bị giữ cho tới khi GC phát hiện object nhỏ kia unreachable.
3. Object nhỏ thường đã lên old gen, mà old gen chỉ được dọn khi có mixed/full GC. Heap rảnh thì có thể hàng giờ không có chu kỳ đó.
4. Lần cấp phát vượt giới hạn: JDK chờ xử lý reference, gọi {{System.gc()}}, thử lại vài lần; vẫn thiếu thì ném {{OutOfMemoryError: Cannot reserve ... bytes of direct buffer memory}}.
5. Image đặt {{-XX:+DisableExplicitGC}} thì bước gọi GC ở trên vô tác dụng, OOM đến nhanh hơn.

### So sánh các cách giữ dữ liệu
| | Heap byte[] | Direct ByteBuffer | FFM MemorySegment + Arena |
|---|---|---|---|
| Giải phóng | GC | Khi GC dọn buffer (không xác định) | Khi đóng Arena (xác định) |
| Kích thước | Tối đa ~2 GB mỗi mảng | Tối đa ~2 GB (index int) | Offset kiểu long, vượt 2 GB |
| I/O với OS | Phải copy qua vùng native tạm | Không copy thêm | Không copy thêm |
| An toàn | Hoàn toàn | Kiểm tra biên | Kiểm tra biên + chặn use-after-free |
| Có từ | Mọi JDK | Java 1.4 | Final ở Java 22 |

### FFM API: cấp phát và giải phóng xác định
~~~java
// Java 22+: vùng off-heap sống đúng bằng vòng đời arena
try (Arena arena = Arena.ofConfined()) {                 // chỉ thread tạo ra được dùng
    MemorySegment seg = arena.allocate(256L * 1024 * 1024); // 256 MB, kích thước kiểu long
    for (long off = 0; off < seg.byteSize(); off += 4) {
        seg.set(ValueLayout.JAVA_INT, off, 42);           // ghi int tại offset
    }
    int first = seg.get(ValueLayout.JAVA_INT, 0);
}   // đóng arena: 256 MB trả lại ngay, không chờ GC
// dùng seg sau khi đóng -> IllegalStateException, không đọc rác như con trỏ C
~~~
- {{Arena.ofConfined()}}: một thread, đóng rẻ. {{Arena.ofShared()}}: nhiều thread dùng chung, đóng tốn hơn vì phải bảo đảm không thread nào đang truy cập. {{Arena.ofAuto()}}: để GC quản lý, giống ByteBuffer. {{Arena.global()}}: sống tới khi JVM tắt.
- Cần đưa vào API cũ nhận ByteBuffer: {{seg.asByteBuffer()}}.
- Java 21 LTS: FFM còn là preview, cần {{--enable-preview}}, thường chưa dùng cho production; Java 25 LTS thì dùng được.

### Xử lý sự cố direct buffer
- Đo: {{BufferPoolMXBean}} pool tên "direct", hoặc metric Micrometer {{jvm_buffer_memory_used_bytes}} với tag id=direct.
- Đặt {{-XX:MaxDirectMemorySize}} rõ ràng và tính vào ngân sách RAM của container; để mặc định bằng Xmx thì heap + direct có thể gấp đôi dự tính.
- Không cấp direct buffer mới cho mỗi request/file: pool và tái sử dụng (Netty {{PooledByteBufAllocator}}), hoặc stream qua buffer cố định 64 KB.
- Service phụ thuộc direct buffer thì đừng bật {{DisableExplicitGC}}; nếu muốn chặn {{System.gc()}} của thư viện gây Full GC, với G1 cân nhắc {{-XX:+ExplicitGCInvokesConcurrent}}.
- {{sun.misc.Unsafe}} cho off-heap: các method truy cập bộ nhớ đã bị deprecate for removal (JEP 471, JDK 23) và in cảnh báo từ JDK 24 (JEP 498); FFM là thay thế chính thức.

> Senior tip: thấy OOM direct memory, câu hỏi đầu tiên của tôi là "ai gọi allocateDirect, bao nhiêu lần mỗi giây?". Phần lớn trường hợp là code tự viết cấp buffer mới cho mỗi file hoặc mỗi request. Đổi sang buffer pool cố định thường giảm off-heap từ vài GB xuống vài chục MB, rẻ hơn nhiều so với tăng limit hay viết lại bằng API mới.`,
  follow: [
    'Vì sao MaxDirectMemorySize mặc định bằng max heap lại nguy hiểm khi tính memory limit cho pod?',
    'Arena.ofConfined và Arena.ofShared khác nhau ở đâu, vì sao đóng shared arena đắt hơn?',
    'Khi nào dữ liệu đáng đặt ở off-heap thay vì heap, và cái giá về độ phức tạp là gì?'
  ],
  tags: ['direct buffer', 'off-heap', 'FFM API', 'Arena', 'MemorySegment', 'MaxDirectMemorySize'],
  refs: [
    { type: 'doc', title: 'JEP 454: Foreign Function & Memory API', url: 'https://openjdk.org/jeps/454' },
    { type: 'doc', title: 'JEP 471: Deprecate the Memory-Access Methods in sun.misc.Unsafe for Removal', url: 'https://openjdk.org/jeps/471' }
  ]
},
{
  id: 'concurrency-030',
  topic: 'concurrency',
  level: 'lead',
  q: 'Một key cache nóng hết hạn, 500 request đồng thời cùng miss và cùng gọi một query DB đắt tiền. Trong một JVM, bạn gộp các lần tải trùng nhau (single-flight) thế nào cho đúng, xử lý lỗi và timeout ra sao, và khi có nhiều instance thì sao?',
  a: `**Tóm tắt:** Request đầu tiên cho một key tạo **một** {{CompletableFuture}} đại diện cho lần tải và đặt vào {{ConcurrentHashMap<K, CompletableFuture<V>>}} bằng thao tác atomic; các request sau thấy future đó và chờ chung một kết quả. Tải xong thì gỡ future khỏi map. Ba điều phải làm đúng: không chạy I/O bên trong lock của map, lỗi không được "dính" cho các lần sau, và timeout của từng người chờ không được làm hỏng future dùng chung. Production tôi dùng Caffeine {{AsyncLoadingCache}} vì nó làm sẵn những việc này; nhiều instance thì single-flight cục bộ giảm số lần tải từ 500 × N xuống N, muốn còn 1 lần toàn cụm thì cần refresh chủ động hoặc lock phân tán.

### Vì sao gọi trùng nguy hiểm
Key "giá sản phẩm hot" hết hạn lúc 20:00:00. Trong 50 ms tiếp theo có 500 request; mỗi request thấy miss và chạy query 200 ms. DB nhận 500 query giống hệt nhau, pool 20 connection cạn, các API khác cũng kẹt theo. Đây là cache stampede ở phạm vi một instance.

### Cài đặt single-flight
~~~java
final class SingleFlight<K, V> {
    private final ConcurrentHashMap<K, CompletableFuture<V>> inFlight = new ConcurrentHashMap<>();
    private final Executor loaderPool;                       // pool riêng, có giới hạn

    SingleFlight(Executor loaderPool) { this.loaderPool = loaderPool; }

    CompletableFuture<V> get(K key, Function<K, V> loader) {
        CompletableFuture<V> created = new CompletableFuture<>();
        CompletableFuture<V> existing = inFlight.putIfAbsent(key, created); // atomic, rất nhanh
        if (existing != null) {
            return existing;                                 // đã có người tải: chờ chung
        }
        loaderPool.execute(() -> {                           // I/O chạy NGOÀI lock của map
            try {
                created.complete(loader.apply(key));
            } catch (Throwable t) {
                created.completeExceptionally(t);            // mọi người chờ đều nhận lỗi
            } finally {
                inFlight.remove(key, created);               // lỗi không bị giữ cho lần sau
            }
        });
        return created;
    }
}
// Người gọi: sf.get(id, repo::loadPrice).copy().orTimeout(300, TimeUnit.MILLISECONDS)
~~~

### Từng quyết định và vì sao
1. **putIfAbsent, không chạy loader trong computeIfAbsent**: hàm mapping của {{computeIfAbsent}} chạy khi đang giữ lock của bin; query 200 ms bên trong đó chặn mọi key khác rơi vào cùng bin.
2. **remove(key, created)** dạng hai tham số: chỉ gỡ đúng future của lượt này, không gỡ nhầm future của lượt tải sau.
3. **Không giữ future lỗi**: nếu future lỗi nằm lại trong map, mọi request sau đều nhận lỗi cũ cho tới khi restart.
4. **Timeout riêng bằng {{copy()}}**: {{orTimeout}} hoàn tất **chính** future mà nó được gọi. Gọi thẳng trên future dùng chung thì người chờ đầu tiên hết kiên nhẫn sẽ làm cả 500 người nhận TimeoutException. {{copy()}} (Java 9) tạo future con riêng cho từng người chờ.
5. **Loader pool có giới hạn**: không dùng commonPool; số lần tải song song bằng số key khác nhau đang miss, cần chặn trên.

### So sánh lựa chọn
| Cách | Gộp trong 1 instance | Gộp toàn cụm | Độ phức tạp |
|---|---|---|---|
| Không làm gì | Không | Không | Thấp |
| Single-flight tự viết | Có | Không | Trung bình, dễ sai |
| Caffeine AsyncLoadingCache | Có, kèm expire/refresh | Không | Thấp |
| Lock phân tán (Redis SET NX) | Có | Có | Cao, thêm độ trễ và điểm lỗi |
| Refresh trước khi hết hạn | Không cần gộp | Gần như | Trung bình |
Caffeine với {{refreshAfterWrite}} trả giá trị cũ trong lúc tải giá trị mới ở nền, chỉ một lần reload mỗi key, người dùng không phải chờ.

### Pitfall production
- Key không chứa đủ tham số ảnh hưởng kết quả (tenant, quyền, ngôn ngữ): user A nhận dữ liệu của user B.
- Kết quả là object mutable chia cho 500 người chờ: một người sửa, người khác thấy. Trả về object bất biến.
- Key là input tuỳ ý từ client: kẻ tấn công gửi key ngẫu nhiên, mỗi key một lần tải, single-flight không giúp gì; cần validate và rate limit.

> Senior tip: tôi đo hiệu quả bằng tỉ lệ "số lần gọi loader / số request miss": trước khi gộp gần bằng 1, sau khi gộp ở key nóng có thể còn 0.01. Nếu 20 instance mà DB vẫn không chịu nổi 20 lần tải đồng thời, giải pháp thường là refresh chủ động cộng jitter cho TTL, không phải lock phân tán.`,
  follow: [
    'Vì sao gọi orTimeout trực tiếp trên future dùng chung là bug, và copy() giải quyết thế nào?',
    'refreshAfterWrite khác expireAfterWrite ở điểm nào đối với người dùng cuối?',
    'Khi nào lock phân tán đáng giá hơn single-flight cục bộ?'
  ],
  tags: ['single-flight', 'cache stampede', 'CompletableFuture', 'ConcurrentHashMap', 'Caffeine'],
  refs: [
  ]
},
{
  id: 'concurrency-031',
  topic: 'concurrency',
  level: 'senior',
  q: 'API chậm dần khi tăng tải nhưng CPU chỉ 30% và DB vẫn rảnh. Bạn nghi lock contention: chứng minh bằng dữ liệu nào (thread dump, JFR, async-profiler), và giảm tranh chấp thế nào mà không làm sai logic?',
  a: `**Tóm tắt:** Dấu hiệu kinh điển của lock contention: throughput ngừng tăng dù còn CPU, latency tăng theo số request đồng thời, thread dump có nhiều thread {{BLOCKED}} "waiting to lock" cùng một địa chỉ monitor. Chứng minh bằng 3–5 thread dump cách nhau vài giây, JFR event {{jdk.JavaMonitorEnter}}/{{jdk.ThreadPark}}, hoặc async-profiler chế độ {{lock}}. Cách giảm theo thứ tự ưu tiên: đưa I/O ra khỏi vùng giữ lock, đọc không lock bằng snapshot bất biến, chia nhỏ lock, dùng cấu trúc không lock, cuối cùng mới tính đổi loại lock.

### Vì sao lock làm "chậm mà không tốn CPU"
Lock chỉ cho một thread vào vùng găng. Vùng găng mất 2 ms thì dù có 200 thread, lock đó phục vụ tối đa 500 lượt mỗi giây. Các thread còn lại không chạy mà xếp hàng, nên CPU thấp. Theo định luật Little, thời gian chờ bằng độ dài hàng đợi chia tốc độ phục vụ: càng nhiều request đang chờ, latency càng tăng tuyến tính.

### Thu thập bằng chứng
~~~text
"http-nio-8080-exec-87" #112 daemon prio=5 ... waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.shop.pricing.RateCache.get(RateCache.java:41)
        - waiting to lock <0x00000006c1a2b3c8> (a com.shop.pricing.RateCache)

"http-nio-8080-exec-12" #37 daemon prio=5 ... runnable
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.NioSocketImpl.read(NioSocketImpl.java:...)
        ...
        at com.shop.pricing.RateCache.reload(RateCache.java:58)
        - locked <0x00000006c1a2b3c8> (a com.shop.pricing.RateCache)
~~~
Đọc: 150 thread chờ cùng {{<0x00000006c1a2b3c8>}}, còn thread đang giữ lock lại đang **đọc socket** (gọi HTTP) bên trong synchronized. Nguyên nhân gốc: I/O trong vùng găng.
- Chụp 3–5 dump cách nhau 5 giây ({{jcmd <pid> Thread.print}}): cùng một địa chỉ lock xuất hiện ở mọi dump thì không phải ngẫu nhiên.
- JFR: {{jcmd <pid> JFR.start duration=60s filename=lock.jfr settings=profile}}, mở JMC xem {{jdk.JavaMonitorEnter}} (chờ synchronized) và {{jdk.ThreadPark}} (chờ ReentrantLock và các lock của java.util.concurrent). Event chỉ ghi khi chờ lâu hơn ngưỡng cấu hình sẵn (khoảng 10–20 ms), nên tổng thời gian chờ theo từng lock là con số đáng tin.
- async-profiler: {{asprof -e lock -d 30 -f lock.html <pid>}} vẽ flame graph theo thời gian chờ lock, chỉ thẳng call site.

### Các cách giảm, theo thứ tự ưu tiên
| Cách | Ví dụ | Lưu ý |
|---|---|---|
| Đưa I/O, việc chậm ra khỏi lock | Gọi HTTP trước, chỉ khoá lúc gán kết quả | Hai thread có thể cùng tải: chấp nhận hoặc gộp (single-flight) |
| Snapshot bất biến + volatile | Đọc không lock, ghi thay cả object | Hợp dữ liệu đọc nhiều ghi ít |
| Chia nhỏ lock (striping) | ConcurrentHashMap thay synchronized Map | Thao tác trên nhiều key cần thiết kế riêng |
| Cấu trúc không lock | LongAdder cho counter, AtomicReference | CAS lặp nhiều khi tranh chấp rất cao |
| Đổi loại lock | ReadWriteLock/StampedLock khi đọc chiếm đa số | Chỉ đáng khi vùng đọc đủ dài; bên ghi có thể bị đói |

Sửa ví dụ trên:
~~~java
final class RateCache {
    private final RateClient client;                       // HTTP client gọi bảng tỉ giá
    private volatile Map<String, BigDecimal> rates = Map.of(); // snapshot bất biến

    RateCache(RateClient client) { this.client = client; }

    BigDecimal get(String ccy) {
        return rates.get(ccy);                // đọc không lock, luôn thấy một bản đầy đủ
    }

    void reload() {                           // gọi từ một scheduled thread
        Map<String, BigDecimal> fresh = client.fetchAll();  // I/O ngoài mọi lock
        rates = Map.copyOf(fresh);            // ghi volatile: publish an toàn cả map mới
    }
}
~~~

### Pitfall production
- Đổi synchronized sang ReentrantLock nhưng vẫn giữ I/O bên trong: lock khác loại, tranh chấp y nguyên.
- Lock trên object dùng chung ngoài ý muốn: {{synchronized}} trên chuỗi đã intern, trên class literal, hoặc method synchronized của bean singleton làm cả service đi qua một cửa.
- Logging đồng bộ: appender ghi file/console có lock bên trong; log dày ở hot path biến logger thành điểm tranh chấp (dùng async appender).
- Tăng thread pool để "chữa": thêm thread chỉ làm hàng đợi trước lock dài hơn và tốn thêm bộ nhớ.

> Senior tip: trong incident, tôi tìm dòng "- locked <0x...>" trong thread dump rồi xem thread đang giữ lock **làm gì**. Chín trên mười lần nó đang làm I/O (HTTP, DB, ghi file) hoặc ghi log. Quy tắc review của tôi: không network call, query hay sleep bên trong synchronized/lock, trừ khi có comment giải thích vì sao bắt buộc.`,
  follow: [
    'Vì sao CPU thấp nhưng latency cao gợi ý lock contention hơn là thiếu CPU?',
    'Khi nào StampedLock optimistic read thực sự giúp ích, và rủi ro của nó là gì?',
    'Logging đồng bộ trở thành điểm tranh chấp thế nào, và async appender đánh đổi gì?'
  ],
  tags: ['lock contention', 'thread dump', 'JFR', 'async-profiler', 'synchronized', 'BLOCKED']
},
{
  id: 'concurrency-032',
  topic: 'concurrency',
  level: 'senior',
  q: 'Bạn viết một class thread-safe (bộ đếm hạn mức, cache, rate limiter). Làm sao viết test chứng minh nó đúng khi chạy đồng thời, sao cho test fail ổn định với code sai mà không flaky với code đúng?',
  a: `**Tóm tắt:** Test concurrency tốt có ba phần: (1) **ép các thread chạy thật sự cùng lúc** bằng cổng xuất phát ({{CountDownLatch}}), (2) **lặp đủ nhiều** để tăng xác suất trúng cửa sổ race, (3) **kiểm tra bất biến** sau khi mọi thread kết thúc, chờ bằng {{Future.get}} có timeout thay vì {{Thread.sleep}}. Test kiểu này chỉ chứng minh được "có lỗi", không chứng minh "không có lỗi"; với các đoạn tinh vi về memory model (cờ volatile, publication) thì dùng jcstress, với code bất đồng bộ thì dùng Awaitility để chờ điều kiện.

### Vì sao test concurrency thường vô dụng
- Tạo 10 thread bằng vòng lặp {{new Thread(...).start()}}: thread đầu đã xong trước khi thread thứ 10 được tạo, thực tế chạy tuần tự.
- Mỗi thread chỉ làm 1 thao tác: cửa sổ race vài nano giây, gần như không bao giờ trúng.
- Chờ bằng {{Thread.sleep(1000)}} rồi assert: CI chậm thì fail (flaky), máy nhanh thì pass dù code sai.
- Assert bên trong thread phụ: AssertionError ném ở thread khác, JUnit không thấy, test vẫn xanh.

### Khung test chuẩn
~~~java
@RepeatedTest(20)                                    // lặp cả test nhiều lần
void quotaNeverExceeded() throws Exception {
    QuotaCounter quota = new QuotaCounter(1_000);    // cho phép đúng 1000 lượt
    int threads = 16, attemptsPerThread = 500;       // 8000 lần thử, chỉ 1000 được phép
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);    // cổng xuất phát
    AtomicInteger granted = new AtomicInteger();
    List<Future<?>> futures = new ArrayList<>();

    for (int t = 0; t < threads; t++) {
        futures.add(pool.submit(() -> {
            start.await();                           // mọi thread chờ ở vạch xuất phát
            for (int i = 0; i < attemptsPerThread; i++) {
                if (quota.tryAcquire()) granted.incrementAndGet();
            }
            return null;                             // Callable: exception lộ qua Future
        }));
    }
    start.countDown();                               // thả tất cả cùng lúc
    for (Future<?> f : futures) f.get(10, TimeUnit.SECONDS); // lỗi trong thread -> test fail
    pool.shutdownNow();

    assertEquals(1_000, granted.get());              // bất biến: không cấp thừa, không thiếu
}
~~~
1. Latch giữ mọi thread ở vạch xuất phát nên đoạn quan trọng chạy chồng lên nhau thật sự.
2. Số lần thử vượt xa hạn mức: race kiểu check-then-act ({{if (count < limit) count++}}) gần như lần nào cũng cấp quá 1000.
3. {{Future.get}} có timeout: exception trong thread được ném lại ở thread test; deadlock thành fail sau 10 giây thay vì treo CI.
4. Bất biến kiểm tra một lần ở cuối, sau khi {{Future.get}} đã tạo happens-before với mọi thao tác trong task.
5. Số thread nhiều hơn số core giúp có context switch giữa chừng, tăng khả năng lộ race.

### Khi nào cần công cụ khác
| Tình huống | Công cụ |
|---|---|
| Race ở logic nghiệp vụ (đếm, cấp phát, cache) | Khung latch + lặp như trên |
| Visibility, reordering (cờ volatile, double-checked locking, publication) | jcstress của OpenJDK: chạy hàng triệu lần và liệt kê mọi kết quả quan sát được |
| Code bất đồng bộ (listener Kafka, @Async, scheduler) | Awaitility: {{await().atMost(5, SECONDS).until(...)}} thay cho sleep |
| Deadlock tiềm ẩn | Test có timeout, in thread dump khi timeout, review thứ tự lấy lock |
| Một thứ tự xen kẽ cụ thể | Đặt latch trong dependency giả để ép thread A dừng giữa chừng cho thread B chạy |

### Pitfall
- Test pass một lần trên laptop rồi coi là xong: chạy {{@RepeatedTest}} hoặc vòng lặp hàng nghìn lần trong job nightly.
- Không shutdown executor: thread rò giữa các test, test sau bị ảnh hưởng.
- Verify số lần gọi mock khi các thread chưa kết thúc: luôn chờ xong rồi mới verify.
- Lẫn test chức năng với đo hiệu năng: "chạy nhanh hơn" thuộc về JMH, không thuộc unit test.

> Senior tip: tôi luôn chạy test mới với **code cố tình sai** (bỏ synchronized, đổi AtomicInteger thành int) trước khi tin nó. Test vẫn xanh với code sai thì test vô giá trị. Mất 5 phút nhưng đã nhiều lần cho tôi thấy test "concurrency" của team thực chất chạy tuần tự.`,
  follow: [
    'Vì sao assert bên trong thread phụ có thể không làm test fail, và bạn đưa lỗi về thread test thế nào?',
    'jcstress khác test JUnit lặp nhiều lần ở điểm nào?',
    'Làm sao ép một thứ tự xen kẽ cụ thể giữa hai thread để tái hiện một bug đã biết?'
  ],
  tags: ['testing', 'concurrency test', 'CountDownLatch', 'jcstress', 'Awaitility', 'race condition'],
  refs: [
  ]
},
{
  id: 'concurrency-033',
  topic: 'concurrency',
  level: 'senior',
  q: 'Bạn cần rate limiter trong một instance: mỗi API key tối đa 100 request/giây, cho phép burst 200, bị gọi khoảng 50.000 lần/giây từ nhiều thread. Bạn cài token bucket thread-safe thế nào (synchronized hay CAS), lưu state theo key ra sao và tránh những bẫy nào?',
  a: `**Tóm tắt:** Token bucket chỉ cần hai số cho mỗi key: số token hiện có và thời điểm nạp gần nhất. Không cần thread nạp token định kỳ: mỗi lần gọi tính "lười" số token được cộng thêm theo thời gian đã trôi. Hai số phải đổi **cùng nhau**, nên gói chúng vào một record bất biến và cập nhật bằng vòng CAS trên {{AtomicReference}}, hoặc đơn giản dùng {{synchronized}} trên từng bucket (vùng găng chỉ vài phép tính nên cũng ổn). State theo key đặt trong {{ConcurrentHashMap}} có giới hạn và cơ chế dọn key cũ. Đồng hồ dùng {{System.nanoTime()}}, không dùng {{currentTimeMillis()}}.

### Thuật toán
- Capacity = 200: số request tối đa trong một đợt burst.
- Rate = 100 token mỗi giây.
- Mỗi request: tokens = min(capacity, tokens + (now − last) × rate). Nếu tokens ≥ 1 thì trừ 1 và cho qua, ngược lại trả 429.

Ví dụ: key rảnh 3 giây nên bucket đầy 200. Client bắn 300 request trong 0.5 giây: 200 qua ngay, trong 0.5 giây được nạp thêm 50 nên thêm 50 qua, 50 bị từ chối. Sau đó tốc độ ổn định ở 100/giây.

### Cài đặt bằng CAS
~~~java
final class TokenBucket {
    private record State(double tokens, long lastNanos) {}   // bất biến: 2 số đi cùng nhau
    private final double capacity, perNano;
    private final AtomicReference<State> state;

    TokenBucket(double capacity, double perSecond) {
        this.capacity = capacity;
        this.perNano = perSecond / 1_000_000_000.0;
        this.state = new AtomicReference<>(new State(capacity, System.nanoTime()));
    }

    boolean tryAcquire() {
        while (true) {
            State cur = state.get();
            long now = System.nanoTime();                     // đơn điệu, không nhảy khi chỉnh giờ
            double refilled = Math.min(capacity, cur.tokens() + (now - cur.lastNanos()) * perNano);
            if (refilled < 1) return false;                   // hết token: từ chối, không cần ghi
            State next = new State(refilled - 1, now);
            if (state.compareAndSet(cur, next)) return true;  // thua CAS: đọc lại và tính lại
        }
    }
}
~~~
- Vì sao record: nếu dùng hai {{AtomicLong}} riêng, mỗi biến atomic nhưng **cặp** thì không; hai thread có thể cùng nạp từ một mốc thời gian và cấp thừa token.
- {{compareAndSet}} so sánh **reference**, không gọi {{equals}}. Đây đúng là điều ta muốn: mỗi lần ghi tạo object mới, nên CAS thành công chỉ khi không ai ghi xen vào giữa lúc đọc và lúc ghi.

### synchronized hay CAS
| | synchronized trên bucket | CAS + record |
|---|---|---|
| Code | Đơn giản, dễ review | Vòng lặp, khó đọc hơn |
| Tranh chấp thấp | Rất nhanh | Rất nhanh |
| Một key cực nóng, nhiều thread | Thread xếp hàng, có thể bị park | Retry tốn CPU, tạo object mỗi lần thử |
| Virtual thread trên JDK 21–23 | Không có I/O bên trong nên pin rất ngắn, chấp nhận được | Không pin |
Thực tế cả hai đều đủ cho 50.000 lần/giây vì vùng găng chỉ vài phép tính. Chọn synchronized nếu team thấy dễ đọc; chọn CAS khi một key rất nóng bị nhiều thread gọi cùng lúc.

### State theo key
~~~java
private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

boolean allow(String apiKey) {               // apiKey đã được xác thực trước đó
    return buckets.computeIfAbsent(apiKey, k -> new TokenBucket(200, 100)).tryAcquire();
}
~~~
- Hàm tạo trong {{computeIfAbsent}} chỉ new object, không I/O, nên giữ lock bin rất ngắn.
- Chỉ tạo bucket cho key đã xác thực; nếu không, kẻ tấn công gửi key ngẫu nhiên làm map phình tới OOM. Cần dọn key cũ thì dùng Caffeine với {{expireAfterAccess}} và {{maximumSize}}.
- Bucket bị dọn rồi tạo lại sẽ đầy token: chấp nhận được với rate limit "mềm".

### Bẫy hay gặp
- {{System.currentTimeMillis()}}: NTP chỉnh giờ lùi tạo khoảng thời gian âm, chỉnh tới làm bucket đầy bất thường. {{nanoTime}} chỉ dùng để đo khoảng, đúng mục đích này.
- Mỗi key một tác vụ nạp token trong {{ScheduledExecutorService}}: 100.000 key là 100.000 tác vụ định kỳ; tính lười không tốn gì khi key rảnh.
- Nhiều instance: mỗi pod giới hạn riêng nên 10 pod là 10 × 100/giây. Muốn giới hạn toàn cục thì dùng Redis (script Lua atomic) hoặc chia quota theo số pod, đổi lại thêm độ trễ mạng hoặc kém chính xác khi scale.

> Senior tip: Bucket4j hay Resilience4j RateLimiter đã làm sẵn và có bản phân tán; tôi chỉ tự viết khi cần logic đặc thù. Dù dùng gì, hãy trả header {{Retry-After}} và có metric số request bị từ chối theo từng key: khi khách hàng lớn kêu "bị chặn oan", metric đó là thứ giúp bạn trả lời trong 5 phút.`,
  follow: [
    'Vì sao compareAndSet trên AtomicReference so sánh reference chứ không dùng equals, và điều đó ảnh hưởng gì khi state là record?',
    'Token bucket khác sliding window counter ở điểm nào về burst và bộ nhớ?',
    'Nếu phải giới hạn toàn cục cho 20 instance, bạn chọn Redis hay chia quota tĩnh, vì sao?'
  ],
  tags: ['rate limiter', 'token bucket', 'CAS', 'AtomicReference', 'ConcurrentHashMap', 'nanoTime']
},
{
  id: 'concurrency-034',
  topic: 'concurrency',
  level: 'senior',
  q: 'Làm thế nào để định cỡ {{ThreadPoolExecutor}} cho dịch vụ I/O-bound một cách đúng đắn?',
  a: `**Tóm tắt:** Với dịch vụ I/O-bound (I/O-bound: chủ yếu chờ I/O như DB, HTTP, Kafka thay vì tính toán CPU), số thread không nên chỉ bằng số core. Cần tính dựa trên thời gian chờ/chạy, giới hạn tài nguyên chậm nhất (ví dụ connection pool), dùng hàng đợi có giới hạn và chính sách từ chối/backpressure rõ ràng.

### Cái gì → tại sao cần → hoạt động thế nào
- {{CPU-bound}} (chỉ tính toán): số thread gần bằng {{Runtime.getRuntime().availableProcessors()}} thường đủ để tận dụng CPU.
- {{I/O-bound}}: khi một thread gọi DB/HTTP nó bị block chờ phản hồi, các thread khác vẫn có thể chạy. Do đó có thể dùng nhiều thread hơn số core. Nhưng nếu tạo quá nhiều, chi phí context switch (context switch: chuyển đổi ngữ cảnh giữa các thread do CPU) tăng, bộ nhớ tăng và dễ làm quá tải tài nguyên phía dưới.
- {{Little's law}} (định luật Little): số lượng trung bình trong hệ thống {{L}} ≈ tốc độ đến {{λ}} × thời gian trung bình trong hệ thống {{W}}. Áp dụng đơn giản: để đạt thông lượng mong muốn, cần đủ thread/worker để xử lý khi có chờ đợi. Không có công thức "1 size fits all", chỉ là khung tư duy.
- {{Tài nguyên chậm nhất}}: thường giới hạn bởi connection pool (ví dụ {{HikariCP}}), kết nối tới DB, rate limit của downstream. Nếu thread pool lớn hơn khả năng cấp connection, bạn chỉ gây context switch vô ích.

### Ví dụ minh hoạ
Giả sử trung bình request chờ DB ~80ms, xử lý logic ~20ms. Nếu DB cho phép 10 connection đồng thời, bạn không thể có 100 thread đồng thời dùng DB hiệu quả hơn 10 (và dễ gây contention). Ngược lại, nếu DB đủ mạnh và latency thấp, số thread cần tăng.

### Cách thiết lập thực tế
| Thành phần | Gợi ý | Lý do |
|---|---|---|
| {{corePoolSize}}/{{maxPoolSize}} | Bắt đầu nhỏ, đo bằng p95/p99 | Chỉ tăng khi queue depth bắt đầu tăng đều và throughput chưa đạt mục tiêu |
| {{workQueue}} | Dùng {{ArrayBlockingQueue}} có giới hạn (không dùng unbounded {{LinkedBlockingQueue}} vô hạn) | Tránh OOM khi traffic tăng đột ngột |
| {{RejectedExecutionHandler}} | {{CallerRunsPolicy}} hoặc trả 503/backpressure rõ ràng | {{CallerRunsPolicy}} giúp giảm áp lực tạm thời nhưng làm caller chậm; với API public thường tốt hơn là trả lỗi có {{Retry-After}} |
| Riêng cho từng {{@Async}} | Luôn dùng {{Executor}} cấu hình riêng, không dùng default {{SimpleAsyncTaskExecutor}} | Tránh thread không giới hạn |

### Pitfall thực tế
- Sao chép số liệu "hot" từ blog mà không đo môi trường bạn.
- Dùng {{Tomcat max-threads}} quá lớn mà không giới hạn {{HikariCP maxPoolSize}} → thread đợi connection, latency tăng.
- Queue không giới hạn → bộ nhớ phình, khó phát hiện saturation.
- Chỉ nhìn CPU utilization: I/O-bound thường CPU thấp nhưng queue/saturation mới là dấu hiệu.

### Bên trong: ThreadPoolExecutor nhận việc theo thứ tự nào
Thứ tự **không** như nhiều người nghĩ: (1) còn dưới {{corePoolSize}} → tạo thread mới; (2) đủ core → **đưa vào hàng đợi**; (3) hàng đợi **đầy** mới tạo thêm thread tới {{maximumPoolSize}}; (4) vẫn đầy → {{RejectedExecutionHandler}}. Hệ quả: với {{LinkedBlockingQueue}} không giới hạn (mặc định của {{Executors.newFixedThreadPool}}), bước 3 không bao giờ xảy ra — {{maximumPoolSize}} vô nghĩa và hàng đợi phình vô hạn khi downstream chậm, độ trễ tăng mà không có lỗi nào. Công thức tham khảo cho I/O-bound: số thread ≈ số core × (1 + thời gian chờ / thời gian tính); nhưng **trần thật** là tài nguyên chậm nhất phía sau (pool connection DB, rate limit đối tác).

### Ví dụ đời thực
Service gửi thông báo dùng {{Executors.newFixedThreadPool(20)}} để gọi API SMS (bình thường 150ms). Ngày nhà cung cấp SMS chậm lên 5 giây, hàng đợi không giới hạn tích lên 1,4 triệu task, heap đầy, pod bị OOMKilled — mất luôn cả các task trong hàng đợi. Thiết kế lại: {{ThreadPoolExecutor(20, 40, 60s, ArrayBlockingQueue(2000), CallerRunsPolicy)}} cho luồng đồng bộ, còn gửi SMS chuyển qua Kafka để có chỗ chứa bền vững; thêm metric {{executor.queued}} và {{executor.active}} qua Micrometer {{ExecutorServiceMetrics}}. Lần nhà cung cấp chậm tiếp theo, hàng đợi chạm 2.000 thì hệ thống tự giảm tốc (backpressure), không mất task, không OOM.

### Trả lời mẫu khi phỏng vấn
"Với dịch vụ I/O-bound, số thread phải lớn hơn số core vì phần lớn thời gian thread chỉ chờ; công thức tham khảo là số core nhân với một cộng tỉ lệ thời gian chờ trên thời gian tính. Nhưng tôi luôn kiểm tra trần thật là tài nguyên phía sau: 100 thread mà pool connection DB chỉ có 20 thì 80 thread chỉ đứng chờ connection. Tôi luôn dùng hàng đợi có giới hạn, vì ThreadPoolExecutor chỉ tạo thêm thread khi hàng đợi đã đầy, nên hàng đợi không giới hạn làm maximumPoolSize vô nghĩa và có thể gây OOM khi downstream chậm. Tôi chọn rejection policy có chủ đích như CallerRunsPolicy để tạo backpressure, đặt tên thread, và đưa metric active, queued, rejected lên dashboard. Với Java 21, nếu chỉ là chờ I/O, virtual thread kèm semaphore giới hạn đồng thời thường đơn giản hơn tự tính kích thước pool."

> Senior tip: Đừng tối ưu bằng cảm tính. Theo dõi {{queue depth}}, {{activeCount}}, {{completedTaskCount}}, {{rejected count}}, thời gian chờ connection, p95/p99 latency và tỷ lệ lỗi. Với hệ thống nhiều instance, cần tính cả tổng giới hạn tới downstream.`
  ,
  follow: ['Làm sao phát hiện saturation của thread pool?', 'Khi nào nên dùng virtual threads thay vì platform thread pool?', 'Tại sao queue không giới hạn nguy hiểm với I/O-bound?'],
  tags: ['thread pool', 'I/O-bound', 'Little law', 'backpressure', 'ThreadPoolExecutor']
},
{
  id: 'concurrency-035',
  topic: 'concurrency',
  level: 'lead',
  q: 'Structured concurrency (JEP 453, preview) là gì, khi nào nên cân nhắc và hạn chế của nó?',
  a: `**Tóm tắt:** {{Structured concurrency}} (đồng thời có cấu trúc) là cách tổ chức các tác vụ con sao cho vòng đời của chúng bị ràng buộc bởi phạm vi (scope). Thay vì "fire and forget" (gửi mà không đợi), tất cả subtasks đều thuộc về một {{structured task scope}} và lỗi/hủy (cancellation) được truyền đi nhất quán.

### Cái gì → tại sao cần → hoạt động thế nào
- Vấn đề hiện tại: {{ExecutorService}} cho phép tạo task con rồi quên, khó biết khi nào tất cả xong, khó truyền {{cancellation}} xuống và dễ leak thread/resource khi lỗi xảy ra.
- Ý tưởng: xử lý nhóm task như một khối. Nếu một task con thất bại, toàn bộ nhóm có thể bị hủy (fail-fast). Nếu chỉ cần kết quả đầu tiên thành công, có thể dừng các task còn lại.
- Các API chính (trong preview): {{StructuredTaskScope.ShutdownOnFailure}} (hủy tất cả nếu có lỗi), {{StructuredTaskScope.ShutdownOnSuccess}} (lấy kết quả đầu tiên thành công và hủy phần còn lại). Ngoài ra {{ScopedValue}} giúp truyền ngữ cảnh (trace id, auth) mà không cần thread-local truyền thủ công cồng kềnh.

### Ví dụ minh hoạ
~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> f1 = scope.fork(() -> callServiceA());
    Future<String> f2 = scope.fork(() -> callServiceB());
    scope.join();           // chờ tất cả hoặc bị hủy khi có lỗi
    scope.throwIfFailed();  // ném nếu bất kỳ task fail
    // dùng f1.resultNow(), f2.resultNow()
}
~~~
Nếu {{callServiceA}} ném exception, {{scope.join()}} sẽ kích hoạt hủy (cancel) {{callServiceB}} nếu đang chạy, tránh lãng phí tài nguyên.

### Khi nào nên cân nhắc
| Tình huống | Phù hợp? | Ghi chú |
|---|---|---|
| Gọi song song nhiều microservice phụ thuộc lẫn nhau (cả hai đều cần) | Có | {{ShutdownOnFailure}} rất tự nhiên |
| Tìm kết quả nhanh nhất từ nhiều nguồn | Có | {{ShutdownOnSuccess}} |
| Pipeline phức tạp, muốn truyền ngữ cảnh an toàn | Có | Kết hợp với {{ScopedValue}} |
| Công việc dài, độc lập, không cần đồng bộ vòng đời chặt chẽ | Có thể không cần | Đôi khi {{CompletableFuture}} vẫn đơn giản hơn |

### Hạn chế quan trọng
- **Preview API**: {{JEP 453}} là preview, có thể thay đổi giữa các phiên bản JDK. **Không ship vào production** mà không có kế hoạch migration.
- **Chưa ổn định hoàn toàn**: tooling, IDE support và kinh nghiệm thực tế còn hạn chế.
- **Không thay thế mọi thứ**: không giải quyết mọi bài toán concurrency, chỉ cải thiện cấu trúc và truyền hủy/lỗi.
- **Tương thích**: cần JDK phù hợp và bật preview nếu dùng.

### Tình trạng API (quan trọng khi trả lời)
Structured concurrency là **preview** qua nhiều phiên bản: JEP 453 (Java 21), rồi các bản preview tiếp theo ở Java 22, 23, 24; ở Java 25 (JEP 505) API được thiết kế lại — tạo scope bằng {{StructuredTaskScope.open(...)}} với các **Joiner** thay cho các lớp con {{ShutdownOnFailure}}/{{ShutdownOnSuccess}} của bản Java 21. Muốn dùng phải bật {{--enable-preview}} và chấp nhận API có thể đổi. Vì vậy trong production, nhiều team vẫn dùng executor virtual thread + {{Future}} hoặc thư viện có cơ chế tương tự (Kotlin coroutine), và chỉ thử structured concurrency ở phần ít rủi ro.

### Ví dụ đời thực
API "trang chủ cá nhân hoá" gọi song song 4 service bằng {{CompletableFuture}}. Khi service gợi ý lỗi ngay lập tức, 3 lời gọi còn lại vẫn chạy tới hết timeout 2 giây — tốn thread, tốn quota của downstream; tệ hơn, một lời gọi bị "bỏ rơi" vẫn ghi log và metric sau khi request đã trả về, làm trace rối. Bản thử với structured concurrency (Java 21 preview, {{ShutdownOnFailure}}): lỗi của một nhánh làm scope **huỷ** các nhánh còn lại ngay, không còn task mồ côi, thread dump hiển thị quan hệ cha–con giữa các task. Số lời gọi thừa tới downstream khi có lỗi giảm khoảng 70%. Team giữ nó trong một service nội bộ chờ API ổn định.

### Trả lời mẫu khi phỏng vấn
"Structured concurrency ràng buộc vòng đời của các tác vụ con vào một phạm vi, giống như khối try-with-resources: các tác vụ con được tạo trong scope phải kết thúc trước khi scope đóng, nếu một tác vụ lỗi thì các tác vụ còn lại bị huỷ, và lỗi được truyền lên cha. Nó giải quyết các vấn đề của CompletableFuture như task mồ côi chạy tiếp sau khi request đã trả về, lỗi bị nuốt, huỷ không lan truyền. Nó đi rất hợp với virtual thread. Nhưng tôi luôn nói rõ đây vẫn là preview: từ JEP 453 ở Java 21 qua nhiều bản preview, đến Java 25 API còn được thiết kế lại với StructuredTaskScope.open và Joiner. Vì vậy trong production tôi chỉ cân nhắc khi team chấp nhận enable-preview và theo dõi thay đổi API; còn không thì dùng virtual thread executor với Future và timeout rõ ràng."

> Senior tip: Hãy thử nghiệm trong môi trường dev/test, so sánh với {{CompletableFuture}} về độ rõ ràng, khả năng hủy và dễ debug. Chỉ áp dụng production khi API đã chính thức (standard) và team hiểu rõ trade-off.`
  ,
  follow: ['Sự khác biệt giữa Structured Concurrency và CompletableFuture?', 'ScopedValue khác ThreadLocal thế nào?', 'Tại sao cần "structured" thay vì chỉ dùng ExecutorService?'],
  tags: ['structured concurrency', 'JEP 453', 'preview', 'ScopedValue', 'cancellation']
},
{
  id: 'concurrency-036',
  topic: 'concurrency',
  level: 'senior',
  q: 'Java Memory Model (JMM) {{happens-before}} là gì? Tại sao nó quan trọng để tránh data race?',
  a: `**Tóm tắt:** {{Java Memory Model (JMM)}} định nghĩa quy tắc để các thread nhìn thấy thay đổi bộ nhớ của nhau một cách nhất quán. Quan hệ {{happens-before}} (xảy ra trước) đảm bảo cả **visibility** (khả năng nhìn thấy thay đổi) lẫn **ordering** (thứ tự thực thi) giữa các hành động. Nếu không có happens-before, có thể xuất hiện {{data race}} (cuộc đua dữ liệu) và hành vi không xác định.

### Cái gì → tại sao cần → hoạt động thế nào
- **Cache/biến cục bộ:** mỗi CPU có cache, JVM có thể sắp xếp lại lệnh (reordering) để tối ưu. Nếu không có ràng buộc, thread B có thể không thấy ghi của thread A, hoặc thấy theo thứ tự khác.
- **Data race:** xảy ra khi ít nhất hai thread truy cập cùng một biến không {{volatile}}, không đồng bộ, và ít nhất một thread ghi. JMM không đảm bảo gì trong trường hợp này.
- **Happens-before:** nếu A happens-before B, thì mọi thay đổi của A trước A đều có thể nhìn thấy bởi B sau B, và các lệnh liên quan không được sắp xếp ngược lại làm vi phạm quy tắc đó.

### Các nguồn tạo happens-before quan trọng
| Hành động | Giải thích |
|---|---|
| {{Thread.start()}} | Mọi hành động trước {{start()}} happens-before hành động trong thread mới |
| {{Thread.join()}} | Mọi hành động trong thread kết thúc happens-before {{join()}} trả về |
| {{synchronized}} (unlock → lock) | Thay đổi trước unlock được thấy bởi thread lấy lock sau đó |
| {{volatile}} write → read | Ghi {{volatile}} happens-before đọc {{volatile}} tiếp theo trên cùng biến đó |
| {{final}} fields (được publish an toàn) | Sau khi object được publish đúng cách, {{final}} fields được freeze và an toàn nhìn thấy |

### Ví dụ đơn giản
~~~java
public class Example {
    private int x = 0;
    private volatile boolean ready = false;

    // thread 1
    void writer() {
        x = 42;        // 1
        ready = true;  // 2 - volatile write
    }

    // thread 2
    void reader() {
        if (ready) {   // 3 - volatile read
            // 4: x phải bằng 42 nhờ happens-before giữa volatile write/read
            System.out.println(x);
        }
    }
}
~~~
{{ready = true}} (volatile write) happens-before {{if (ready)}} (volatile read) thành công. Do đó (1) happens-before (4).

### Pitfall
- Chỉ thêm {{volatile}} vào biến cờ chưa đủ nếu logic phức tạp hơn; cần hiểu ràng buộc.
- {{final}} chỉ an toàn nếu object không bị "escape" (trỏ đến) trước khi constructor kết thúc.
- Không nhầm {{volatile}} với atomic cho thao tác cộng/trừ ({{volatile int}} không an toàn cho {{count++}}).
- "Safe publication" quan trọng: nếu không publish đúng cách, thread khác có thể thấy object chưa khởi tạo đầy đủ.

### Bên trong: vì sao cần happens-before
CPU có cache riêng mỗi core và **store buffer**; compiler JIT và CPU được phép **sắp xếp lại** lệnh miễn là kết quả trong **một** thread không đổi. Không có quan hệ happens-before, thread B có thể không bao giờ thấy giá trị thread A đã ghi (vẫn đọc bản trong cache/thanh ghi), hoặc thấy theo thứ tự khác. {{volatile}} ghi = "xả" mọi thay đổi trước đó ra cho thread đọc biến volatile đó sau này thấy (trên x86 là một lệnh fence khi ghi); {{synchronized}} unlock → lock tiếp theo trên cùng monitor tạo quan hệ tương tự; {{Thread.start()}}, {{join()}}, các lớp {{java.util.concurrent}} (put vào {{ConcurrentHashMap}} rồi get, {{CountDownLatch.countDown}} → {{await}}) cũng đảm bảo happens-before.

### Ví dụ đời thực
Một service có cờ dừng {{boolean running = true;}} (không volatile) cho worker đọc trong vòng lặp {{while (running) poll();}} và một hook shutdown đặt {{running = false}}. Trên máy dev worker dừng bình thường; trên production sau khi JIT tối ưu (C2 đưa việc đọc biến ra khỏi vòng lặp vì "không thấy ai đổi nó"), worker **không bao giờ dừng** — mỗi lần deploy pod treo 30 giây tới khi Kubernetes kill, mất các message đang xử lý dở. Sửa: {{volatile boolean running}} (hoặc {{AtomicBoolean}}); graceful shutdown chạy đúng trong 2 giây. Một chỗ khác dùng double-checked locking không volatile cho singleton cấu hình — thread khác thấy object "nửa khởi tạo" (field còn null) khoảng vài lần mỗi tuần; sửa bằng holder class idiom.

### Trả lời mẫu khi phỏng vấn
"Java Memory Model định nghĩa khi nào một thread được đảm bảo thấy dữ liệu thread khác đã ghi. Vì CPU có cache riêng và cả compiler lẫn CPU được phép sắp xếp lại lệnh, nếu không có quan hệ happens-before thì thread khác có thể không bao giờ thấy giá trị mới, hoặc thấy theo thứ tự lạ. Happens-before được tạo bởi: ghi biến volatile trước khi đọc biến đó, unlock trước lock trên cùng monitor, Thread.start và join, và các lớp trong java.util.concurrent. Data race là khi hai thread truy cập cùng biến, ít nhất một bên ghi, mà không có happens-before; kết quả là bug chỉ xuất hiện sau khi JIT tối ưu, như cờ dừng không volatile khiến worker không bao giờ dừng. Tôi ưu tiên dùng lớp có sẵn như AtomicBoolean, ConcurrentHashMap, và object bất biến với field final."

> Senior tip: Ưu tiên thiết kế bất biến (immutable). Dùng {{final}}, publish object sau khi hoàn chỉnh, hạn chế chia sẻ mutable. Khi cần đồng bộ, chọn công cụ đúng: {{volatile}} cho visibility/flag, {{synchronized}}/{{Lock}} cho mutual exclusion, {{java.util.concurrent.atomic}} cho thao tác nguyên tử.`
  ,
  follow: ['Sự khác biệt giữa visibility và atomicity?', 'Safe publication là gì?', 'Tại sao final field có freeze semantics?'],
  tags: ['JMM', 'happens-before', 'volatile', 'data race', 'safe publication']
},
{
  id: 'concurrency-037',
  topic: 'concurrency',
  level: 'senior',
  q: 'Khi dùng {{CompletableFuture}}, làm thế nào để chọn {{Executor}}, xử lý timeout, fallback và propagation ngữ cảnh?',
  a: `**Tóm tắt:** {{CompletableFuture}} mặc định dùng {{ForkJoinPool.commonPool()}}. Với tác vụ I/O-bound (chờ mạng/DB), không nên dùng common pool. Cần tạo {{ExecutorService}} riêng có giới hạn, dùng {{orTimeout}}/{{completeOnTimeout}}, {{exceptionally}}/{{handle}} cho fallback, và quan tâm tới propagation của {{MDC}}/{{trace context}}.

### Cái gì → tại sao cần → hoạt động thế nào
- **commonPool** được thiết kế cho tác vụ CPU-bound hoặc không chặn quá lâu. Nếu nhiều tác vụ I/O-blocking chạy trên nó, có thể "chiếm" pool làm các tác vụ khác bị chậm.
- **Executor riêng**: giới hạn số thread theo khả năng downstream, dễ giám sát, tách biệt tải.
- **Timeout**: tránh treo vô thời hạn. Từ Java 9 có {{orTimeout(timeout, unit)}}, Java 9+ cũng có {{completeOnTimeout(value, timeout, unit)}}.
- **Error handling**: {{exceptionally}} chuyển lỗi thành giá trị dự phòng, {{handle}} xử lý cả thành công và thất bại.
- **Ngữ cảnh**: {{MDC}} của SLF4J dùng {{ThreadLocal}}. Khi task chạy trên thread khác, context bị mất trừ khi bạn tự copy/propagate (ví dụ dùng decorator/wrapper của executor).

### Ví dụ minh hoạ
~~~java
ExecutorService ioPool = Executors.newFixedThreadPool(32);

CompletableFuture<User> cf = CompletableFuture
    .supplyAsync(() -> userClient.get(id), ioPool)  // executor riêng
    .orTimeout(2, TimeUnit.SECONDS)                  // timeout
    .exceptionally(ex -> {
        // fallback hoặc log, trả giá trị mặc định
        log.warn("get user failed", ex);
        return User.anonymous(id);
    });

// gom nhiều future
CompletableFuture.allOf(cf1, cf2, cf3)
    .thenRun(() -> { /* tất cả thành công */ });
~~~

### Lưu ý quan trọng
| Chủ đề | Khuyến nghị |
|---|---|
| Chọn pool | I/O-bound: pool riêng với kích thước giới hạn (theo connection pool/downstream). CPU-bound: gần bằng số core. |
| allOf vs anyOf | {{CompletableFuture.allOf}} chờ tất cả, nếu bất kỳ fail thì {{get/join}} ném exception (không tự hủy các task còn lại trừ khi bạn tự quản lý). Cần cân nhắc fail-fast. |
| Timeout | Đặt timeout sát thực tế (ví dụ dựa trên p99 * 1.5), log rõ lý do timeout. |
| MDC propagation | Với platform thread, copy {{MDC.getCopyOfContextMap()}} trước khi submit và restore trong task. Với virtual thread, vẫn cần chú ý vì context có thể cần propagate. |
| Shutdown | Gọi {{shutdown()}}/{{shutdownNow()}} và {{awaitTermination}} khi ứng dụng dừng. |

### Pitfall
- Dùng {{commonPool}} cho hàng trăm call blocking → starvation.
- Không set timeout → cascade failure.
- Bỏ qua exception trong {{thenApply}}/{{thenAccept}} (có thể ẩn bug).
- Quên truyền MDC → log thiếu trace id trong thread pool khác.

### Bên trong: thread nào chạy callback
{{thenApply}} (không có Async) chạy trên **thread hoàn thành future** — nếu future đã xong thì chạy luôn trên **thread gọi** {{thenApply}}. Nghĩa là một callback nặng có thể chạy trên thread của HTTP client (event loop) hoặc thread request. {{thenApplyAsync}} không truyền executor thì chạy trên {{ForkJoinPool.commonPool()}} — pool dùng chung cả JVM, kích thước bằng số core trừ 1; trong container 2 CPU chỉ có **1 thread**. Một tác vụ I/O chặn trong common pool làm nghẽn mọi parallel stream và mọi {{CompletableFuture}} khác trong ứng dụng.

### Ví dụ đời thực
Service tổng hợp giá gọi 5 nhà cung cấp bằng {{supplyAsync(() -> client.quote(...))}} không truyền executor. Trên pod 2 vCPU, common pool chỉ có 1 thread → 5 lời gọi chạy **tuần tự**, p95 3,4 giây thay vì khoảng 700ms. Đồng thời traceId và MDC không theo sang thread của pool nên log không nối được với request. Sửa: executor riêng có giới hạn (hoặc virtual thread executor), {{orTimeout(800ms)}} cho từng nhà cung cấp kèm {{exceptionally}} trả "không có báo giá", bọc executor bằng context propagation (Micrometer {{ContextExecutorService}}) để giữ traceId. p95 còn 820ms, nhà cung cấp chậm không làm hỏng cả request.

### Trả lời mẫu khi phỏng vấn
"Với CompletableFuture, việc đầu tiên tôi làm là không dùng common pool cho I/O: nó dùng chung cả JVM, kích thước bằng số core trừ một, trong container nhỏ có khi chỉ một thread, nên một lời gọi chặn làm nghẽn mọi thứ khác. Tôi truyền executor riêng có giới hạn hoặc virtual thread executor. Lưu ý thenApply không Async chạy trên thread hoàn thành future, có thể là thread của HTTP client. Mỗi nhánh có timeout riêng bằng orTimeout hoặc completeOnTimeout, và xử lý lỗi bằng exceptionally hoặc handle để trả giá trị dự phòng có chủ đích, không để lỗi bị nuốt. Khi gộp bằng allOf thì nhớ allOf không trả kết quả, phải join từng future. Cuối cùng là ngữ cảnh: MDC, traceId, SecurityContext không tự sang thread khác, nên tôi bọc executor bằng context propagation."

> Senior tip: Luôn đo p95/p99 để đặt timeout và kích thước pool. Ưu tiên rõ ràng về error/fallback thay vì "nuốt" exception im lặng. Nếu cần truyền ngữ cảnh phức tạp, cân nhắc các thư viện hoặc wrapper executor.`
  ,
  follow: ['Sự khác biệt giữa exceptionally và handle?', 'allOf có tự hủy các future còn lại khi một cái fail không?', 'Làm sao propagate MDC qua CompletableFuture?'],
  tags: ['CompletableFuture', 'executor', 'timeout', 'MDC', 'backpressure']
},
{
  id: 'jvm-033',
  topic: 'jvm',
  level: 'senior',
  q: 'Khi đọc GC log của G1, các loại pause chính là gì và ý nghĩa của chúng?',
  a: `**Tóm tắt:** {{G1 GC (Garbage First)}} chia heap thành nhiều {{region}} (vùng) có kích thước đồng đều. Các pause phổ biến: {{Young GC}} (thu gom Eden + Survivor), {{Mixed GC}} (thu gom một phần Young + một số Old regions có nhiều garbage), {{Full GC}} (toàn bộ heap, thường chậm nhất), {{Humongous allocation}} gây pause, và {{To-space exhausted}} báo hiệu heap không đủ không gian.

### Cái gì → tại sao cần → hoạt động thế nào
- **Mục tiêu G1:** đạt pause time mục tiêu ({{-XX:MaxGCPauseMillis}}) bằng cách ưu tiên thu gom regions có nhiều garbage nhất trước.
- **Young GC:** xảy ra khi Eden đầy. Di chuyển survivor objects sang Survivor hoặc Old regions. Thường ngắn.
- **Mixed GC:** sau khi Old regions tích lũy đủ (đạt ngưỡng), G1 thực hiện Mixed GC để thu gom cả Young và một tập con Old regions nhằm giải phóng không gian mà không cần Full GC ngay.
- **Humongous object:** object lớn hơn ~50% kích thước region được đặt trực tiếp vào {{humongous region}}. Việc thu gom humongous có thể gây pause đáng kể.
- **To-space exhausted:** không đủ không gian trong vùng đích để sao chép objects → có thể dẫn đến Full GC.

### Cách đọc nhanh GC log (ý tưởng)
| Thông tin | Cách diễn giải |
|---|---|
| {{[GC pause (G1 Evacuation Pause) (young)]}} | Young GC thông thường |
| {{[GC pause (G1 Evacuation Pause) (mixed)]}} | Mixed GC |
| {{[Full GC (Allocation Failure)]}} | Full GC - cần điều tra nguyên nhân |
| {{Humongous regions}} | Nhiều object lớn có thể gây vấn đề |
| Thời gian pause | So sánh với {{MaxGCPauseMillis}} để thấy có vượt không |

### Pitfall
- Chỉ nhìn tổng thời gian GC mà bỏ qua tần suất pause.
- Tăng heap vô tội vạ thay vì tìm nguyên nhân (allocation pattern, humongous objects, memory leak).
- Không bật GC log đủ chi tiết (trên JDK 11+ dùng {{Xlog:gc*:file=...}}).
- Nhầm lẫn giữa "mixed" và "full" - mixed vẫn là collection có mục tiêu, full thường tồi tệ hơn.

### Đọc một dòng log thật (JDK 17, -Xlog:gc*)
~~~text
[2026-11-07T10:15:02.114+0700][info][gc,start] GC(1532) Pause Young (Normal) (G1 Evacuation Pause)
[...][info][gc,heap ] GC(1532) Eden regions: 410->0(408)
[...][info][gc,heap ] GC(1532) Old regions: 1180->1196
[...][info][gc      ] GC(1532) Pause Young (Normal) (G1 Evacuation Pause) 6020M->3810M(8192M) 48.512ms
[...][info][gc      ] GC(1540) Pause Young (Concurrent Start) (G1 Humongous Allocation) 7100M->5900M(8192M) 61.2ms
[...][info][gc      ] GC(1547) Pause Young (Mixed) (G1 Evacuation Pause) 6500M->4100M(8192M) 72.9ms
[...][warn][gc      ] GC(1601) To-space exhausted
[...][info][gc      ] GC(1601) Pause Full (G1 Compaction Pause) 8150M->5200M(8192M) 3842.117ms
~~~
Đọc: Young xoá hết Eden (410→0 region); Old tăng 16 region (object sống đủ lâu được đẩy lên); "Concurrent Start" do **humongous allocation** (object lớn hơn nửa region) bắt đầu chu kỳ marking; "Mixed" dọn thêm vùng Old nhiều rác; **To-space exhausted** = không còn chỗ để copy object sống → tiếp theo là **Full GC 3,8 giây**.

### Ví dụ đời thực
Service xuất báo cáo có Full GC 3–4 giây mỗi giờ. Log cho thấy nhiều "G1 Humongous Allocation": mỗi báo cáo tạo một {{byte[]}} 30–60MB (tải cả file vào bộ nhớ) — region 4MB nên mỗi mảng chiếm hàng chục region liên tiếp, phân mảnh heap, cuối cùng to-space exhausted. Sửa: stream file ra response thay vì dựng mảng lớn; tạm thời tăng {{-XX:G1HeapRegionSize=16m}}. Full GC biến mất, pause Young ổn định 30–50ms.

### Trả lời mẫu khi phỏng vấn
"G1 chia heap thành các region cùng kích thước và có ba loại pause chính. Young pause dọn Eden và Survivor, copy object còn sống sang survivor hoặc lên Old, thường vài chục mili giây. Khi Old đầy tới ngưỡng, G1 chạy marking đồng thời, bắt đầu bằng một Young pause có nhãn Concurrent Start, rồi sau đó là các Mixed pause dọn thêm những region Old nhiều rác. Full GC là dấu hiệu xấu: G1 không theo kịp, thường đi kèm To-space exhausted, và dừng cả heap nhiều giây. Khi đọc log, tôi xem thời gian pause, heap trước và sau, nguyên nhân trong ngoặc như Humongous Allocation, và Old tăng dần qua các chu kỳ để nghi leak. Humongous allocation, tức object lớn hơn nửa region, là nguyên nhân hay gặp của Full GC; sửa ở code bằng streaming thay vì dựng mảng lớn."

> Senior tip: Bắt đầu với cấu hình mặc định của G1, bật GC log, theo dõi pause time, số lượng GC, heap usage. Nếu liên tục đạt Humongous allocation hoặc To-space exhausted, hãy xem kích thước object lớn, hoặc cân nhắc tăng region size/{{-Xmx}} hợp lý. Chỉ cân nhắc ZGC/Shenandoah khi thực sự cần pause cực ngắn và hiểu trade-off.`
  ,
  follow: ['Khi nào G1 chuyển từ Young sang Mixed GC?', 'Humongous object ảnh hưởng thế nào?', 'Sự khác biệt giữa G1 và ZGC về mục tiêu?'],
  tags: ['G1', 'GC log', 'Young GC', 'Mixed GC', 'Humongous object']
},
{
  id: 'jvm-034',
  topic: 'jvm',
  level: 'senior',
  q: '{{Tiered compilation}} trong HotSpot là gì? Nó hoạt động như thế nào và tại sao cần cẩn thận khi benchmark?',
  a: `**Tóm tắt:** {{Tiered compilation}} (biên dịch phân tầng) kết hợp {{interpreter}} (thông dịch nhanh để khởi động), {{C1 compiler}} (biên dịch nhanh, tối ưu nhẹ) và {{C2 compiler}} (biên dịch chậm hơn nhưng tối ưu sâu) để cân bằng giữa thời gian khởi động và hiệu năng tối đa. Code "hot" (nóng, được gọi nhiều) sẽ được thăng cấp qua các tier đến native code tối ưu.

### Cái gì → tại sao cần → hoạt động thế nào
- **Mục đích:** Không biên dịch ngay toàn bộ code. Thông dịch để thu thập profiling (profile: số lần gọi, loại thực tế...) rồi mới biên dịch các phương thức hot.
- **Các tier chính (ý tưởng):** Tier 0 (interpreter), Tier 1 (C1 không profiling), Tier 2/3 (C1 có profiling), Tier 4 (C2 tối ưu đầy đủ).
- **Deoptimization:** Nếu giả định profiling bị vi phạm (ví dụ class loading bất ngờ, type change), JVM có thể hạ cấp (deoptimize) và quay về interpreter/native chưa tối ưu.
- **On-stack replacement (OSR):** Cho phép thay thế loop đang chạy bằng phiên bản native đã biên dịch mà không chờ vòng lặp kết thúc.

### Tại sao cần cẩn thận khi benchmark
| Vấn đề | Giải thích |
|---|---|
| Warm-up | Trước khi đạt hiệu năng thực, code phải chạy đủ để được biên dịch C2. Nếu đo ngay lập tức sẽ đo interpreter/C1. |
| JIT không ổn định | Có thể có nhiều lần compile/deoptimize trong quá trình warm-up. |
| Chỉ 1 lần chạy | Kết quả có thể lệch lớn do JIT. |
| Compiler flags khác nhau | Cấu hình JIT khác nhau cho kết quả khác nhau. |

### Khuyến nghị benchmark đúng cách
- Dùng {{JMH}} (Java Microbenchmark Harness) - được thiết kế cho JIT.
- {{@Fork}} >= 3 (fork JVM riêng cho mỗi fork để tránh ảnh hưởng cross-run).
- Có warm-up iterations đủ (thường vài nghìn lượt hoặc theo thời gian).
- Đo measurement iterations, báo cáo mean + stddev hoặc confidence interval.
- Tránh đo System.out, I/O trong benchmark.

### Bên trong: năm tầng và deoptimization
HotSpot có các tầng: 0 (interpreter), 1–3 (C1, có hoặc không profiling), 4 (C2). Đường thường gặp: method chạy ở tầng 0 → đủ số lần gọi/vòng lặp thì C1 tầng 3 biên dịch **kèm thu thập profile** (kiểu thật của đối tượng, nhánh nào hay chạy) → đủ nóng thì C2 tầng 4 biên dịch tối ưu sâu dựa trên profile đó (inline, loại bỏ kiểm tra, escape analysis). Nếu giả định trong profile sai về sau (một lớp con mới xuất hiện, nhánh "không bao giờ chạy" bỗng chạy), JVM **deoptimize** — bỏ code đã tối ưu, quay về interpreter, rồi biên dịch lại. Đó là lý do benchmark mà chỉ dùng một loại dữ liệu có thể nhanh giả tạo.

### Ví dụ đời thực
Team so sánh hai cách serialize JSON bằng vòng lặp {{System.nanoTime()}} 1.000 lần trong {{main}}: cách A "nhanh gấp 3" → chọn A. Lên production không thấy khác biệt. Chạy lại bằng JMH (warm-up 5 vòng, fork 3, dùng {{Blackhole}} để kết quả không bị JIT loại bỏ): hai cách chênh nhau 8%, và lợi thế ban đầu chỉ do cách A được đo **sau** khi JIT đã làm nóng phần chung. Cũng phát hiện sau mỗi deploy p99 cao trong 2–3 phút đầu do code đang ở interpreter/C1 — team thêm bước warm-up (gọi các endpoint chính) trước khi readiness probe báo sẵn sàng, p99 trong 3 phút đầu giảm từ 900ms còn 180ms.

### Trả lời mẫu khi phỏng vấn
"Tiered compilation kết hợp interpreter để khởi động nhanh, C1 để biên dịch nhanh kèm thu thập profile, và C2 để tối ưu sâu cho code nóng dựa trên profile đó, như inline hay loại bỏ kiểm tra. Nếu giả định trong profile sai về sau, JVM deoptimize về interpreter rồi biên dịch lại. Vì vậy benchmark kiểu tự viết vòng lặp với nanoTime thường sai: đo lẫn cả giai đoạn chưa biên dịch, JIT có thể xoá mất code có kết quả không dùng tới, và thứ tự chạy ảnh hưởng kết quả. Tôi dùng JMH với warm-up, nhiều fork, Blackhole, và dữ liệu đa dạng như thật. Ở production, hiệu ứng này cũng lộ ra thành p99 cao vài phút sau deploy, nên tôi warm-up trước khi readiness báo sẵn sàng, hoặc cân nhắc CDS, AOT cho thời gian khởi động."

> Senior tip: Nếu bạn thấy "hiệu năng tăng sau vài phút chạy", đó là dấu hiệu JIT đang biên dịch. Khi debug hiệu năng thực tế, hãy quan tâm đến cả warm-up và behavior sau warm-up. Để điều tra JIT, có thể bật log biên dịch ({{-XX:+PrintCompilation}}) nhưng cẩn thận với overhead.`
  ,
  follow: ['Sự khác biệt giữa C1 và C2 compiler?', 'Deoptimization xảy ra khi nào?', 'Tại sao JMH quan trọng so với main() đơn giản?'],
  tags: ['JIT', 'tiered compilation', 'C1', 'C2', 'JMH', 'deoptimization']
},
{
  id: 'jvm-035',
  topic: 'jvm',
  level: 'senior',
  q: 'Làm thế nào để điều tra {{Metaspace leak}} (rò rỉ class metadata)?',
  a: `**Tóm tắt:** {{Metaspace}} lưu class metadata (class definitions, methods, constant pool...). {{Metaspace leak}} xảy ra khi {{ClassLoader}} không thể được garbage collect (unloaded) vì còn tham chiếu, dẫn đến không thể unload class và Metaspace tăng liên tục. Cần phân biệt với heap leak.

### Cái gì → tại sao cần → hoạt động thế nào
- **Nguyên nhân phổ biến:** hot redeploy (undeploy webapp nhưng classloader/context còn giữ), custom ClassLoader, dynamic proxy (CGLib/JDK Proxy), scripting engines, frameworks generate class runtime.
- **Dấu hiệu:** Metaspace usage tăng dần qua mỗi lần deploy/restart ứng dụng, cuối cùng {{OutOfMemoryError: Metaspace}} hoặc gặp cảnh báo.
- **Class unloading:** chỉ xảy ra khi ClassLoader không còn reachable và không có class nào từ nó được tham chiếu.

### Cách điều tra từng bước
| Công cụ/Phương pháp | Mục đích |
|---|---|
| {{-XX:MaxMetaspaceSize}} | Giới hạn để fail nhanh thay vì làm server chậm vô hạn |
| {{-Xlog:class+unload*:file=...}} (JDK 9+) | Xem classloader/class có bị unload không |
| {{jcmd <pid> VM.classloader_stats}} | Thống kê classloader hiện tại |
| {{jmap -clstats}} hoặc heap dump | Phân tích classloader tree |
| {{Eclipse MAT}} (Memory Analyzer) / {{VisualVM}} | Tìm GC roots trỏ đến ClassLoader (thường là Thread, static field, listener...) |

### Quy trình điều tra
1. **Quan sát:** Theo dõi Metaspace usage qua thời gian (JMX/metrics). Có tăng sau mỗi redeploy không?
2. **Bắt heap dump** trước khi OOM hoặc sau vài redeploy.
3. **Tìm ClassLoader leak:** Trong MAT, tìm các {{ClassLoader}} instances, xem {{GC Roots}} của chúng. Nếu có Thread context classloader, static field, framework cache giữ chúng, chúng không bị GC.
4. **Xác định nguyên nhân:** Thường là listener chưa unregister, thread pool chưa shutdown, cache chưa clear, hoặc library giữ reference.
5. **Sửa:** Unregister listener, shutdown executor, clear ThreadLocal, dùng đúng ClassLoader lifecycle.

### Pitfall
- Nhầm Metaspace leak với heap leak (triệu chứng khác, cần phân tích đúng vùng nhớ).
- Chỉ restart thay vì sửa → vấn đề lặp lại.
- Hot redeploy trong production cực kỳ nguy hiểm với việc leak ClassLoader.
- Không giới hạn {{MaxMetaspaceSize}} làm khó phát hiện sớm.

### Ví dụ đời thực
Một ứng dụng cho phép tải "plugin quy tắc tính phí" mới mà không cần restart: mỗi lần cập nhật tạo một {{URLClassLoader}} mới để nạp jar. Sau khoảng 40 lần cập nhật, Metaspace tăng từ 180MB lên 1,1GB rồi {{OutOfMemoryError: Metaspace}}. {{jcmd <pid> VM.classloader_stats}} cho thấy 41 classloader plugin còn sống dù chỉ một cái đang dùng. Heap dump (Eclipse MAT, "Duplicate Classes" và đường tới GC root của classloader cũ) chỉ ra nguyên nhân: plugin đăng ký một {{ThreadLocal}} và một listener vào {{static}} registry của ứng dụng mà không gỡ — mỗi tham chiếu đó giữ classloader cũ, kéo theo mọi class nó đã nạp. Sửa: plugin có {{close()}} gỡ listener và ThreadLocal, loader cũ được {{close()}} khi thay; thêm alert khi số class đã nạp ({{jvm_classes_loaded_classes}}) tăng liên tục. Metaspace ổn định quanh 200MB.

### Trả lời mẫu khi phỏng vấn
"Metaspace lưu metadata của class, và class chỉ được giải phóng khi cả classloader nạp nó bị GC thu hồi. Leak Metaspace hầu như luôn là leak classloader: một tham chiếu từ chỗ sống lâu, như static field, ThreadLocal của thread trong pool, listener đăng ký vào registry, hay thread do plugin tạo ra, giữ một object của classloader cũ, kéo theo toàn bộ class của nó. Hay gặp ở hệ thống hot reload plugin, redeploy trên app server, hoặc thư viện sinh class động như proxy, script engine. Tôi điều tra bằng metric số class đã nạp và Metaspace theo thời gian, jcmd VM.classloader_stats để đếm classloader, rồi heap dump với MAT, tìm đường tới GC root của classloader cũ. Đặt MaxMetaspaceSize để lỗi lộ ra sớm thay vì ăn hết bộ nhớ container."

> Senior tip: Trong môi trường production, tránh hot redeploy. Nếu dùng container/app server, đảm bảo toàn bộ resources được giải phóng khi undeploy. Khi điều tra, hãy tập trung vào "ai đang giữ ClassLoader" chứ không chỉ "có bao nhiêu class". Một ClassLoader bị giữ sẽ giữ toàn bộ tất cả class load bởi nó.`
  ,
  follow: ['Sự khác biệt giữa PermGen và Metaspace?', 'Tại sao custom ClassLoader dễ gây leak?', 'Làm sao ngăn ClassLoader leak trong web app?'],
  tags: ['Metaspace', 'classloader', 'OutOfMemoryError', 'heap dump', 'MAT']
},
{
  id: 'jvm-036',
  topic: 'jvm',
  level: 'lead',
  q: 'Để khởi động nhanh Spring Boot trên Kubernetes, các lựa chọn nào và trade-off giữa chúng?',
  a: `**Tóm tắt:** Để cải thiện {{startup time}} (thời gian khởi động) quan trọng với autoscaling, scale-to-zero, và cold start. Các kỹ thuật: {{AppCDS}}/{{CDS}} (Class Data Sharing), {{Spring AOT}} (Ahead-of-Time processing), {{CRaC}} (Coordinated Restore at Checkpoint), {{GraalVM Native Image}}. Mỗi cái có trade-off về thời gian build, kích thước image, memory, và khả năng tương thích.

### So sánh các giải pháp
| Giải pháp | Cách hoạt động | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|---|
| **CDS/AppCDS** | Lưu class metadata đã load vào archive, tái sử dụng khi khởi động | Dễ áp dụng, ít thay đổi code, giảm startup đáng kể | Chỉ tối ưu class loading, vẫn chạy trên JVM (JIT hoạt động sau warm-up) | Rất phổ biến, rủi ro thấp, áp dụng được nhiều project |
| **Spring AOT** | Tại build-time sinh bean definitions, proxy, configuration metadata thay vì runtime reflection | Giảm reflection, nhanh hơn, chuẩn bị tốt cho native image | Cần build step AOT, một số dynamic features có thể hạn chế | Kết hợp với JVM hoặc Native, được Spring khuyến nghị |
| **CRaC** | Tạo checkpoint (snapshot) của JVM đang chạy, restore nhanh thay vì khởi động từ đầu | Startup cực nhanh (gần instant), giữ trạng thái warm, JIT profile có thể được preserve tùy trường hợp | Cần hỗ trợ CRaC trên nền tảng (JVM + container runtime), phức tạp hơn, cần test restore carefully | Rất tốt cho scale-to-zero/cold start với JVM, đang ngày càng phổ biến |
| **GraalVM Native Image** | Biên dịch toàn bộ app thành binary native (ahead-of-time compilation) | Startup cực nhanh (milliseconds), memory footprint nhỏ | Build time rất lâu, reflection/dynamic cần cấu hình, một số library khó tương thích (Hibernate có nhiều hạn chế), mất JIT optimizations mạnh mẽ của HotSpot | Microservice nhỏ, serverless, cần startup tối đa - chỉ khi tương thích đủ |

### Khuyến nghị thực tế
- **Mặc định an toàn:** JVM + CDS + Spring AOT. Đây là cân bằng tốt giữa tương thích, hiệu quả và dễ bảo trì.
- **Cần startup cực nhanh:** Xem xét CRaC trước khi nhảy sang Native Image. CRaC giữ được lợi ích của HotSpot JIT.
- **Chỉ dùng Native Image:** Khi bạn đã xác minh tất cả dependency (đặc biệt Hibernate, JPA, reflection) tương thích, chấp nhận build time dài, và thực sự cần native startup.

### Pitfall
- Native Image + Hibernate: cần cấu hình reflection, proxy, không phải lúc nào cũng "just work".
- Đo sai: đo "time to first request" chứ không chỉ "JVM started".
- Chỉ tối ưu startup mà bỏ qua memory/throughput trong steady state.
- CRaC yêu cầu môi trường hỗ trợ checkpoint/restore (không phải mọi K8s setup đều sẵn sàng).

### Ví dụ đời thực
Một service Spring Boot 3.3 trên Kubernetes khởi động 38 giây; khi tải tăng đột biến buổi sáng, HPA thêm pod nhưng pod mới sẵn sàng quá chậm, lỗi 503 kéo dài khoảng 1 phút mỗi ngày. Đo từng bước:
- Bật **CDS** (Spring Boot 3.3+: chạy training run tạo archive rồi khởi động với {{-XX:SharedArchiveFile}}): 38 → 27 giây, không đổi code.
- **Lazy initialization** cho một nhóm bean nặng ít dùng (báo cáo, export): 27 → 21 giây; nhưng lỗi cấu hình của các bean này giờ lộ ra lúc request đầu tiên — team thêm test khởi tạo đầy đủ trong CI.
- Thu hẹp component scan và bỏ 2 auto-configuration không dùng: 21 → 17 giây.
- Thử **GraalVM native image**: khởi động 0,3 giây, RAM giảm 60%, nhưng build mất 9 phút, 3 thư viện dùng reflection cần cấu hình thêm, và throughput đỉnh thấp hơn khoảng 15% so với JIT — team giữ JVM cho service này.
Cùng với việc tăng {{minReplicas}} vào giờ cao điểm, lỗi 503 buổi sáng biến mất.

### Trả lời mẫu khi phỏng vấn
"Tôi đo trước xem thời gian khởi động đi đâu, bằng startup actuator của Spring Boot hoặc log thời gian từng bước, rồi chọn theo chi phí. Rẻ nhất là CDS, Spring Boot 3.3 hỗ trợ sẵn: lưu sẵn class đã parse nên giảm đáng kể mà không đổi code. Tiếp theo là thu hẹp component scan, bỏ auto-configuration không dùng, lazy initialization có chọn lọc cho bean nặng ít dùng, nhưng phải giữ một bài test khởi tạo đầy đủ để không giấu lỗi cấu hình. Spring AOT và GraalVM native image cho khởi động dưới một giây và ít RAM, đổi lại build lâu, reflection phải khai báo, throughput đỉnh có thể thấp hơn JIT. CRaC chụp lại trạng thái đã khởi động, cần hỗ trợ từ JDK và môi trường. Trên Kubernetes, tôi cũng kết hợp với startup probe đúng, readiness sau warm-up, và minReplicas hợp lý thay vì chỉ trông vào khởi động nhanh."

> Senior tip: Hãy bắt đầu từ đo lường (startup time, memory, throughput). Trên hầu hết dự án enterprise, JVM + CDS + AOT là đủ. Native Image chỉ thực sự có giá trị khi cold start là vấn đề cực kỳ nghiêm trọng và bạn sẵn sàng đầu tư vào build/test phức tạp hơn.`
  ,
  follow: ['Sự khác biệt giữa startup time và time to first request?', 'Tại sao CRaC có thể tốt hơn Native Image cho một số trường hợp?', 'Những gì cần lưu ý khi dùng Native Image với Spring Data JPA/Hibernate?'],
  tags: ['startup', 'Kubernetes', 'CDS', 'Spring AOT', 'CRaC', 'GraalVM native image']
},
{
  id: 'concurrency-038',
  topic: 'concurrency',
  level: 'senior',
  q: 'Đi sâu vào AbstractQueuedSynchronizer: state, hàng đợi CLH và park/unpark. Chuyện gì xảy ra **từng bước** khi hai thread cùng gọi {{ReentrantLock.lock()}}, và lock công bằng (fair) khác lock mặc định ở đúng chỗ nào trong code?',
  a: `**Tóm tắt:** AQS là xương sống của gần như mọi khoá trong {{java.util.concurrent}}: ReentrantLock, Semaphore, CountDownLatch, ReadWriteLock. Nó chỉ gồm hai thứ: một biến **state** kiểu int được đổi bằng CAS, và một **hàng đợi hai chiều FIFO** (biến thể CLH) chứa node bao quanh thread đang chờ. Ai dùng chỉ cần viết vài hàm tryAcquire/tryRelease (đọc/ghi state theo ngữ nghĩa của mình); còn thử, xếp hàng, ngủ ({{LockSupport.park}}), đánh thức (unpark), bỏ cuộc khi timeout — AQS lo hết. ReentrantLock mặc định là **non-fair**: thread vừa tới được CAS cướp lock ngay khi state rỗng (barging); bản fair thêm đúng một điều kiện {{hasQueuedPredecessors()}} trước khi CAS, và đó là toàn bộ khác biệt — cũng là lý do fair chậm hơn.

### Hiểu nhanh
Quầy vé có một cây bút (**state**). Khách tới sau không gào tại quầy: ghi tên vào **sổ chờ** rồi đi uống cà phê (**park**); người trước trả bút thì nhân viên gọi đúng một người dậy (**unpark**). Sổ chờ là CLH queue, cây bút là state.

### Thuật ngữ
- **state**: int volatile của AQS, đổi bằng **CAS** (ghi chỉ thành công nếu giá trị vẫn như mình vừa đọc — nguyên tử mà không cần khoá). ReentrantLock dùng nó đếm số lần vào lại lock; Semaphore = số permit còn; CountDownLatch = số lần countDown còn phải chờ.
- **CLH queue**: biến thể của hàng đợi spin-lock trong hệ điều hành — danh sách hai chiều FIFO, node head là dummy đại diện người đang giữ lock.
- **waitStatus** của Node: SIGNAL (-1) = "khi tôi nhả lock thì đánh thức người ngay sau"; CANCELLED (1) = bỏ cuộc vì timeout/interrupt; CONDITION (-2) = đang nằm trong condition queue của await(); PROPAGATE (-3) = cờ lan tín hiệu ở mode shared (Semaphore, readLock).

### Từng bước: hai thread cùng lock()
~~~text
T1: lock() -> CAS state 0->1 OK -> owner = T1 -> lam viec
T2: lock() -> CAS state 0->1 FAIL (state da = 1)
    addWaiter(Node.EXCLUSIVE): node = new Node(T2); CAS tail -> node (thua thi doc lai tail, thu lai)
    node.prev = tail cu      (chi co prev duoc gan, next chua ai set)
    acquireQueued(node):
      - neu node.prev == head -> tryAcquire them mot lan nua (van duoc phep chen)
      - shouldParkAfterFailedAcquire: CAS prev.waitStatus 0 -> SIGNAL
        lan dau tra false de quay lai tryAcquire; lan sau moi ngu
      - LockSupport.park(this)  -> T2 WAITING, khong tot CPU
T1: unlock() -> tryRelease: state - 1 == 0 -> xoa owner -> true
    unparkSuccessor(head): xoa waitStatus cua head, QUET TU TAIL nguoc len
      tim node dau tien co waitStatus <= 0 (bo qua CANCELLED) -> unpark(node.thread)
T2: ty -> ve acquireQueued -> prev == head -> tryAcquire CAS 0->1 OK -> tro thanh head moi
~~~
Hai chi tiết thiết kế đáng nói: (1) thread được đánh thức vẫn phải **tự giành** state bằng CAS — hàng đợi chỉ quyết định "ai được thử sớm", AQS không cầm lock hộ ai; (2) lý do quét từ tail là vì CAS chỉ đảm bảo con trỏ **prev**, không đảm bảo **next** của node trước đã được nối — đi từ tail thì chuỗi liên kết luôn nguyên vẹn. Ở trên, {{LockSupport.park}}/{{unpark}} là tầng thấp hơn Object.wait: không cần monitor, và unpark mang tính "xin visa" — nếu unpark chạy **trước** thì lần park sau trở về ngay, nên không có race "đánh thức hụt" như notify.

### Fair vs non-fair, nằm ở đúng một dòng
~~~java
// NonfairSync — ban mac dinh
public void lock() {
    if (compareAndSetState(0, 1)) setExclusiveOwnerThread(Thread.currentThread());
    else acquire(1);            // chua duoc thi moi xep hang
}
// FairSync: khong co duong tat o cua, va trong tryAcquire chi them mot dieu kien:
if (c == 0) {
    if (!hasQueuedPredecessors() &&        // "hang doi co ai dung truoc toi khong"
        compareAndSetState(0, 1)) { ... }
}
~~~
{{hasQueuedPredecessors()}} kiểm tra còn node hợp lệ nào đứng trước thread hiện tại trong hàng đợi. Non-fair cho phép **barging**: ngay khi lock được nhả, một thread đang chạy trên CPU có thể CAS cướp trước cả người vừa được unpark. Nó tốt cho throughput vì người thắng khỏi chu trình unpark + context switch (cỡ micro giây), đổi lại không có hợp đồng thứ tự — một thread có thể bị bỏ qua liên tục (starvation). Chỉ chọn {{new ReentrantLock(true)}} khi bạn **đo được** starvation, và chấp nhận throughput thấp hơn.

### Condition queue — hàng đợi thứ hai
Mỗi {{Condition}} có hàng đợi riêng (node waitStatus = CONDITION). {{await()}} đặt state = 0 (nhả hết lock kể cả phần reentrant), đưa node vào condition queue rồi park; {{signal()}} **không** trao lock, nó chỉ chuyển node về sync queue — người vừa được đánh thức vẫn phải tranh CAS state.

### Trên production
- Thread dump ({{jcmd <pid> Thread.print}}) gọi thẳng tên AQS: khung {{LockSupport.park}}, {{AbstractQueuedSynchronizer.acquireQueued}} và dòng {{- parking to wait for <0x00007f...> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)}} — địa chỉ này khớp với object ở khung {{- locked <0x...>}} của thread đang giữ lock.
- Đếm người xếp hàng bằng API public {{ReentrantLock.getQueueLength()}} / {{hasQueuedThreads()}} (tài liệu JDK ghi rõ: dùng để **giám sát**, không để điều khiển logic). Export {{getQueueLength()}} thành metric là cách nhanh nhất để chứng minh "p99 cao vì chờ lock".
- JFR {{jdk.JavaMonitorEnter}} chỉ bắt monitor của {{synchronized}}; lock AQS phải xem qua async-profiler {{-e lock}} hoặc flame graph wall-clock.
- Triệu chứng phải sửa code chứ không sửa flag: {{getQueueLength()}} > 0 kéo dài, CPU thấp, p99 cao → thân critical section quá dài (gọi HTTP, đọc DB, serialize JSON trong lock). Bật fair chỉ đổi thứ tự, không rút ngắn thời gian giữ lock.
- Quên {{unlock()}} trong {{finally}}: khác {{synchronized}}, ReentrantLock không tự nhả → treo toàn bộ luồng phía sau. Và await() phải nằm trong vòng {{while}} kiểm tra điều kiện, không phải {{if}}.
- Đọc dump sai trạng thái: thread chờ trong AQS ở trạng thái WAITING (park), còn BLOCKED là của monitor {{synchronized}} — hai hướng điều tra khác nhau.

> Senior tip: ba từ khoá ăn điểm trong phỏng vấn senior là **state – SIGNAL – unparkSuccessor**. Nói thêm được hai chi tiết "thread được đánh thức vẫn phải tự CAS giành lock" và "quét từ tail vì next chưa chắc đã được nối" chứng tỏ bạn đã đọc source hoặc đã debug dump thật, chứ không chỉ biết {{lock()}}/{{unlock()}}. Khi được hỏi miệng, trả lời theo đúng trình tự: CAS state → thêm node vào tail → đánh dấu SIGNAL → park → unpark successor → tranh lại CAS.`,
  follow: [
    'Vì sao AQS chọn park/unpark thay vì Object.wait/notify hoặc spin bằng {{Thread.onSpinWait()}}?',
    'Semaphore và CountDownLatch dùng AQS ở mode shared khác exclusive thế nào, PROPAGATE sinh ra để làm gì?',
    'Bản viết lại AQS gần đây trong OpenJDK gộp cờ của node vào một field long — nó cải thiện điều gì so với waitStatus + prev + next tách rời?',
  ],
  tags: ['AQS', 'ReentrantLock', 'park', 'CLH', 'fairness'],
  refs: [
    { type: 'doc', title: 'AbstractQueuedSynchronizer API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/AbstractQueuedSynchronizer.html' },
    { type: 'doc', title: 'ReentrantLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html' },
  ]
},
{
  id: 'concurrency-039',
  topic: 'concurrency',
  level: 'senior',
  q: 'Trong {{ConcurrentHashMap}} Java 8+, chèn một phần tử xảy ra những bước nào ở mức node và cache line: vì sao chỗ thì CAS mà chỗ lại {{synchronized}}, vì sao khoá node đầu chứ không khoá cả bucket, và khi nào một bucket chuyển thành cây?',
  a: `**Tóm tắt:** {{ConcurrentHashMap}} không khoá cả bảng, cũng không khoá 16 segment như Java 7. Mỗi bucket là một chuỗi node; khi bucket **rỗng** thì chèn bằng CAS (không có ai để tranh), khi bucket **đã có node** thì JVM {{synchronized}} trên đúng node đầu chuỗi — biến node đó thành lock của bucket. Đọc ({{get}}) hoàn toàn không khoá, dựa vào field volatile của mảng table và của node.next. Khi chuỗi dài tới 8 node **và** bảng đã có ít nhất 64 ô, bucket được treeify thành cây red-black; nếu bảng còn nhỏ thì resize trước để tách chuỗi ra. Muốn hiểu hiệu năng của map này phải hiểu ba thứ: hàm hash bị trộn thế nào, vì sao bucket nóng là điểm thắt, và vì sao hàm mapping của {{computeIfAbsent}} chạy **trong lúc đang giữ lock**.

### Hiểu nhanh
Thư viện chia sách thành 64 kệ nhỏ. Thủ thư không khoá cả thư viện: ai trả sách vào kệ trống thì đặt lên thẳng (một thao tác nhanh, không ai tranh). Kệ đã có sách thì người đó đứng trước kệ đó chờ, các kệ khác vẫn tự do. Người mượn sách (đọc) thì không cần chờ gì cả — kệ nào cũng có bảng chỉ dẫn cập nhật liên tục. Nếu một kệ chất quá 8 quyển và thư viện đã mở rộng đủ lớn, kệ đó đổi thành kệ hai tầng (tìm theo nhánh) để không phải đi hết 8 quyển.

### Thuật ngữ
- **bucket / bin**: một ô của mảng {{table}}, chứa tham chiếu tới node đầu của chuỗi (hoặc node gốc của cây).
- **Node**: object {{Map.Entry}} bên trong, có field {{next}} volatile để đọc không cần khoá vẫn thấy chuỗi cập nhật.
- **spread hash**: {{(h ^ (h >>> 16)) & HASH_BITS}} — trộn 16 bit cao xuống thấp vì chỉ số bucket lấy từ vài bit cuối; bit dấu bị xoá để hash âm thành cờ đặc biệt.
- **MOVED (-2)**: giá trị hash của {{ForwardingNode}}, đánh dấu "bucket này đã bị chuyển sang bảng mới trong lúc resize".
- **TREEIFY_THRESHOLD = 8**, **MIN_TREEIFY_CAPACITY = 64**, **UNTREEIFY_THRESHOLD = 6**: ngưỡng chuyển chuỗi thành cây và ngược lại.
- **sizeCtl**: một int điều khiển init/resize (âm = đang khởi tạo/đang nới bảng, dương = ngưỡng đầy).
- **ReservationNode**: node placeholder {{computeIfAbsent}} dùng để "giữ chỗ" bucket và phát hiện đệ quy.

### Đường đi của một lệnh put (từng bước)
~~~text
1. kiem tra key/value khac null -> null la NullPointerException co tinh (map cam null)
2. h = spread(key.hashCode())
3. tab = table (doc volatile mot lan, dung lam "anh" nhat quan cho vong lap)
   - neu tab == null -> initTable(): CAS sizeCtl 0 -> -1; ai thang thi khoi tao mang 16 o,
     nguoi kia quay vong lap doc lai table (khong ai phong to mang hai lan)
4. i = (tab.length - 1) & h        -> vi do dung khi kich thuoc table luy thua cua 2
5. f = tabAt(tab, i)               -> doc volatile cua phan tu mang (khong phai lay ca mang ra roi doc)
   a) f == null  -> CAS tab[i] null -> new Node(h, key, value)
        thanh cong -> xong (day la fast path: khong mot cai lock nao)
        that bai    -> co ai vua chen, quay buoc 3 doc lai
   b) f.hash < 0 -> node dac biet: TreeBin / ReservationNode / ForwardingNode
        ForwardingNode -> goi helpTransfer() de giup resize roi moi ghi
   c) f la node binh thuong -> synchronized (f) {   // KHOA NODE DAU = KHOA CA BUCKET
        duyet chuoi, dem binCount
        thay key trung (equals) -> thay value
        khong thay -> noi node vao duoi chuoi (hoac them vao cay)
        neu binCount >= 8 -> treeifyBin(tab, i)
      }
      khi cap nhat key da co, node duoc noi TRUOC khi value cu bi ghi de,
      nen get() cua thread khac khong bao gio nhin thay node co value null
6. addCount(1L, binCount): tang bo dem, va co the kep doi bang neu vuot nguong
~~~

### Vì sao lại chia hai chế độ CAS / synchronized
- CAS chỉ thắng khi **không có cạnh tranh**. Bucket rỗng thì cạnh tranh duy nhất là "ai được đặt node đầu" — CAS giải quyết gọn, không phải đánh thức ai.
- Khi bucket đã có chuỗi thì thao tác là "đọc-duyệt-sửa-nối" — một vòng CAS retry sẽ cực kỳ tốn (mỗi lần fail phải duyệt lại từ đầu). Doug Lea chọn {{synchronized}} trên node đầu vì JVM đã tối ưu monitor không tranh chấp (CAS vào mark word), và vì nó cho phép giữ bất biến chuỗi một cách dễ đọc.
- Khoá node đầu chứ không khoá {{tab[i]}} bằng array-wide lock, vì số lock = số bucket đang nóng, không phải 1 lock cho cả map. Hai thread ghi hai key khác bucket gần như không chạm nhau — đó là toàn bộ ý nghĩa "concurrent".
- Cache line: hai key hash ra cùng bucket thì node đầu của nó nằm chung cache line và mọi thao tác đều ping-pong line đó. Đây là lý do hashCode kém chất lượng làm map chậm phi tuyến, dù không có lock toàn cục nào.

### Đọc thì thế nào
{{get}}: đọc volatile table (một lần), đọc volatile node tại {{tab[i]}}, rồi duyệt chuỗi qua {{next}} volatile; không lock, không CAS. Với TreeBin, nó đọc volatile root và chỉ {{synchronized}} khi cần. Hệ quả: bạn thấy một **snapshot nhất quán** (không bao giờ thấy chuỗi bị xé nửa), nhưng không có hợp đồng "tôi thấy đúng trạng thái tại thời điểm tôi gọi".

### Bảng so sánh
| Cách | Khoá ở mức | Hệ quả |
|---|---|---|
| {{Hashtable}} | một lock cho cả bảng | chỉ một thread ghi tại một thời điểm |
| {{Collections.synchronizedMap}} | một lock cho cả map + iterator ngoài | như trên, iterator phải tự đồng bộ |
| {{ConcurrentHashMap}} Java 7 | 16 segment | tối đa 16 vùng, chia không đều theo key |
| {{ConcurrentHashMap}} Java 8+ | CAS bucket rỗng, khoá node đầu từng bucket | số vùng khoá = số bucket, tự lớn theo bảng |

### Trên production
- HashCode một hằng số (class không ghi lại {{hashCode}}, hoặc key sinh hash từ một field không đổi) là tai nạn kinh điển: mọi key dồn một bucket, mọi ghi đều tranh một lock, CPU lock cao mà {{size()}} vẫn đúng. Kiểm chứng: dựng một map tạm đếm số node theo bucket (debug/unit test), hoặc so sánh thời gian put khi key là String ngẫu nhiên so với key thật.
- {{computeIfAbsent}} chạy hàm mapping **trong khi đang giữ lock của bucket**: nếu hàm đó gọi HTTP/DB, mọi key cùng bucket bị chặn theo; nếu nó sửa lại chính map này theo cùng bucket, map ném {{IllegalStateException}} "Recursive update". Quy tắc: hàm mapping phải thuần túy và nhanh; muốn tải dữ liệu thì dùng single-flight riêng ở ngoài.
- Khởi tạo {{new ConcurrentHashMap<>(expectedSize)}} để giảm số lần resize với map lớn (nội dung resize nằm ở câu bên cạnh).
- Iterator là **weakly consistent**: không ném ConcurrentModificationException, nhưng có thể bỏ sót hoặc thấy phần tử đã bị xoá. Đừng dùng nó để "chụp toàn bộ trạng thái nhất quán" — cần vậy thì snapshot thủ công hoặc dùng cấu trúc khác.
- Đo tranh chấp: async-profiler {{-e lock}} hoặc JFR event {{jdk.JavaMonitorEnter}} sẽ cho thấy khung {{ConcurrentHashMap.putVal}} và monitor của node đầu — dấu hiệu bucket nóng, không phải "map chậm".

### Trả lời phỏng vấn thế nào
Nói theo ba nhịp: (1) chèn bucket rỗng = CAS, chèn vào bucket đã có = {{synchronized}} trên node đầu, đọc = lock-free nhờ volatile; (2) vì vậy mức song song bằng số bucket, và nút thắt duy nhất là bucket nóng; (3) cây chỉ xuất hiện khi chuỗi ≥ 8 **và** bảng ≥ 64 ô, nếu bảng nhỏ thì thay vào đó là resize. Nhắc thêm {{size()}} là ảnh chụp (không phải số tức thời tuyến tính) và {{computeIfAbsent}} giữ lock khi chạy hàm — đó là hai chỗ cho thấy bạn dùng map này trên production thật.

> Senior tip: khi nghi ngờ {{ConcurrentHashMap}} là cổ chai, 90% là do **hash của key** hoặc do **hàm trong {{computeIfAbsent}}/{{compute}} gọi I/O**, chứ không phải do cấu trúc trong của map. Trước khi thay map bằng lock-free queue hay một cache ngoài, hãy in ra phân bố độ dài bucket — nếu một bucket chiếm 70% lưu lượng thì vấn đề nằm ở key, không phải ở map.`,
  follow: [
    'Vì sao {{ConcurrentHashMap}} cấm null key/value, trong khi {{HashMap}} cho phép?',
    'Khi chuỗi bị treeify thì {{get}} và {{put}} thay đổi thế nào, chi phí so với chuỗi là gì, vì sao ngưỡng là 8?',
    '{{computeIfAbsent}} và "kiểm tra rồi put" khác nhau ở đâu về tính nguyên tử, và {{putIfAbsent}} có cứu được bạn khỏi race không?',
  ],
  tags: ['ConcurrentHashMap', 'CAS', 'synchronized', 'treeify', 'computeIfAbsent'],
  refs: [
    { type: 'doc', title: 'ConcurrentHashMap API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html' },
  ]
},
{
  id: 'concurrency-040',
  topic: 'concurrency',
  level: 'lead',
  q: 'Resize của {{ConcurrentHashMap}} chạy **song song** như thế nào: một bảng đang nới bị khoá ở đâu, vì sao các thread khác vẫn ghi được, "nhiều thread cùng giúp chuyển" hoạt động ra sao, và vì sao {{size()}} được tính bằng một mảng cell thay vì một biến?',
  a: `**Tóm tắt:** Resize không đóng bảng. Thread phát hiện bảng đầy dùng CAS trên {{sizeCtl}} để **claim** quyền resize (mã hoá thêm resizeStamp để phát hiện ai đang làm), tạo bảng mới gấp đôi rồi chia bảng cũ thành các **chunk** liên tiếp nhau; bất kỳ thread nào tình cờ đi qua một bucket đã chuyển (node có hash = MOVED) đều có thể **nhận một chunk về làm** ({{helpTransfer}}) — kể cả thread chỉ gọi {{get}} hay {{size}}. Bucket đã chuyển để lại một {{ForwardingNode}} trỏ sang bảng mới nên đọc vẫn đúng trong lúc resize. Đếm phần tử cũng chia để trị: {{baseCount}} + một mảng {{CounterCell}} được đệm cache line (đúng mô hình của LongAdder/Striped64), vì vậy {{size()}}/{{mappingCount()}} là tổng của các cell tại một thời điểm, **không phải** một phép đọc nguyên tử tuyến tính.

### Hiểu nhanh
Siêu thị chuyển sang mặt bằng mới mà không đóng cửa. Người phát hiện hết chỗ dán biển "đang chuyển" lên cửa, rồi khuân từng dãy kệ. Nhân viên đi ngang (kể cả khách đến hỏi đường) thấy dãy nào đã dán "đã sang bên kia" thì được giao luôn dãy đó khuân giúp. Quầy nào chưa khuân thì ghi-đè bán normal; quầy đã khuân thì có tờ chỉ đường "mới ở ô 137 của nhà bên" nên khách vẫn tìm được hàng.

### Thuật ngữ
- **sizeCtl**: int điều khiển vòng đời bảng. {{0}} = chưa init (sẽ là 16); {{-1}} = đang init; số âm khác = đang resize, phần bit cao chứa **resizeStamp** nhận dạng đợt resize, phần bit thấp đếm số thread đang giúp; số dương = **ngưỡng** đầy kế tiếp = {{n - (n >>> 2)}} (load factor 0.75).
- **resizeStamp(n)**: một con số dẫn từ kích thước bảng cũ, dùng làm "mã số ca chuyển nhà"; thread sau đọc {{sizeCtl}}, thấy stamp khớp thì biết mình đang giúp đúng đợt, không phải đợt đã kết thúc.
- **ForwardingNode**: node đặc biệt có {{hash = MOVED (-2)}}, giữ tham chiếu {{nextTable}} — nghĩa là "bucket này đã nằm ở bảng mới".
- **transferIndex / stride**: con trỏ chia bảng cũ thành các đoạn; mỗi lần CAS lấy một đoạn, đoạn tối thiểu vài ô (công thức trong JDK lấy {{n >>> 3}} chia cho {{NCPU + 1}} và không dưới 2) để thread ít cũng làm đủ việc, không tranh nhau từng ô.
- **CounterCell**: ô đếm riêng được đệm bằng annotation nội bộ {{jdk.internal.vm.annotation.Contended}} để mỗi thread ghi vào cache line của mình.
- **sumCount / mappingCount**: cộng {{baseCount}} với mọi cell đang tồn tại.

### Chuyện gì xảy ra theo thứ tự
~~~seq
title: put() chạm ngưỡng sizeCtl khi bảng đang có 8 thread ghi
actors: Writer A | sizeCtl | Table cu | Table moi | Writer B
Writer A -> sizeCtl: CAS doc cu -> (resizeStamp | 1) de claim resize
Writer A -> Table moi: tao mang gap doi
Writer A -> Table cu: gan ForwardingNode (MOVED) cho doan minh lam
Writer A -> Table cu: copy node sang Table moi, tang sizeCtl len 2 (so giup)
Writer B -> Table cu: gap bucket co hash = MOVED
Writer B -> sizeCtl: tang so thread dang giup, nhan doan tiep theo qua transferIndex
Writer B -> Table moi: ghi phan cua minh
Writer A -> sizeCtl: CAP sizeCtl = nguong moi (n - n/4), bo table moi vao table
Writer B -> Table moi: ghi tiep binh thuong sau khi resize xong
~~~
Ba bất biến làm nên tính đúng:
1. **Không có lock toàn bảng.** Mỗi bucket chỉ được "chạm" bởi đúng một thread tại một thời điểm, thread đó hoặc là owner của đoạn hoặc là thread ghi bình thường đã khoá node đầu.
2. **Đọc không bị chặn.** {{get}} gặp ForwardingNode thì chuyển sang tìm ở {{nextTable}}; vì vậy trong suốt đợt resize, đọc vẫn trả lời đúng, chỉ chậm thêm một bước nhảy.
3. **Ghi bị hoãn, không mất.** {{putVal}} thấy {{f.hash < 0}} thì gọi {{helpTransfer}} rồi quay lại đầu vòng lặp — nên không ai ghi vào bảng cũ đã bị bỏ.

### Vì sao chia counter thành cell
Nếu một biến {{count}} volatile được mọi thread CAS tăng, thì mỗi lần ghi đều giành cùng một cache line (false sharing + CAS fail storm, giống hệt AtomicLong ở mức tranh chấp cao). Striped64/LongAdder giải quyết bằng {{baseCount}} cho path không tranh chấp và một mảng cell mở rộng tới cỡ số CPU; mỗi thread chọn cell theo **probe** riêng của thread (field nội bộ {{threadLocalRandomProbe}} trong Thread), nên hai thread ít khi cùng ô. Đổi lại: {{sum()}} phải cộng tất cả cell trong lúc chúng vẫn đổi, nên kết quả là ảnh chụp xấp xỉ.

### Bảng: hệ quả thực tế
| Tình huống | Điều xảy ra |
|---|---|
| {{if (map.size() < MAX) map.put(...)}} | Không chặn được phình to: hai thread cùng thấy size = MAX-1. Cần {{compute}}/{{merge}} với logic giới hạn, hoặc cấu trúc khác |
| Map 5 triệu entry, thêm liên tục | Resize nhiều lần; mỗi lần tạo bảng mới gấp đôi → đỉnh memory và áp lực GC trong vài giây |
| {{new ConcurrentHashMap<>(1000, 0.75f, 64)}} | Tham số thứ ba {{concurrencyLevel}} bị **bỏ qua** từ Java 8 (tài liệu API ghi rõ), đừng kỳ vọng nó đặt số lock |
| {{putAll}} / {{Collectors.toConcurrentMap}} khối lượng lớn | JDK dùng {{ReservationNode}} và các hàm reduce/accumulate theo bucket để nhiều thread ghi song song, không giữ một lock toàn cục |
| {{mappingCount()}} so với {{size()}} | {{mappingCount()}} trả {{long}}, nên dùng khi map có thể vượt 2 tỷ phần tử; {{size()}} trả {{int}} và sẽ là Integer.MAX_VALUE khi tràn |

### Trên production
- **Định cỡ trước.** Với map cache nhiều triệu key, hãy dựng với dung lượng dự tính (JDK tự {{tableSizeFor(expected / loadFactor)}}) để tránh chuỗi resize; hoặc tải toàn bộ dữ liệu lúc khởi động bằng một thread rồi mới mở cho traffic.
- **Nhận biết bằng chứng.** Đỉnh RTT đều đặn theo nhịp tăng trưởng của map, kèm allocation rate tăng trong GC log ({{-Xlog:gc*}}, hoặc JFR event {{jdk.JavaHeapOperation}}/{{jdk.ObjectAllocationInNewTLAB}}), thường là resize chứ không phải "map chậm".
- **Đỉnh memory** trong đợt resize ≈ bảng cũ + bảng mới cùng tồn tại; nếu pod đang sát limit, resize đúng giờ cao điểm có thể gây OOMKill. Đây là lý do nên đặt {{-XX:MaxRAMPercentage}} dư cho service có cache in-heap lớn (kết hợp với tuning heap trong topic jvm).
- **Bucket hoá tree:** resize còn làm **tách cây** (untreeify) khi chuỗi ngắn lại, nên bạn có thể thấy chi phí cây biến mất sau khi nới bảng.
- **Không dùng {{size()}} trong vòng lặp nóng** để "chọc" từng phần tử; nếu cần thống kê định kỳ, đọc {{mappingCount()}} một lần rồi export metric.

### Trả lời miệng 1 phút
"Resize của ConcurrentHashMap là một thuật toán song song có điều phối: thread đầu tiên CAS vào {{sizeCtl}} để claim đợt resize kèm một resizeStamp, tạo bảng gấp đôi, rồi chia bảng cũ thành các đoạn qua {{transferIndex}}. Bucket đã chuyển được để lại {{ForwardingNode}} với hash MOVED, nên {{get}} nhảy sang bảng mới còn {{put}} gọi {{helpTransfer}} để nhận một đoạn về làm — resize do vậy chia đều cho mọi thread đang đi ngang, không có lock toàn bảng. Bộ đếm cũng striped: {{baseCount}} cộng mảng {{CounterCell}} được đệm cache line theo kiểu LongAdder, nên ghi không giành nhau một line, nhưng {{size()}} chỉ là tổng tại một thời điểm, không tuyến tính. Hệ quả thực chiến: định cỡ map trước để tránh resize giông bão, dùng {{mappingCount()}} cho map lớn, và đừng dùng {{size()}} như một phép kiểm tra nguyên tử."

> Senior tip: chỗ câu này phân biệt người đọc source với người đọc blog là hai chi tiết nhỏ: {{concurrencyLevel}} đã bị bỏ qua từ Java 8, và {{size()}} là {{sumCount()}} chứ không phải một counter nguyên tử. Nói thêm được "đỉnh RTT theo nhịp resize, không phải theo QPS" là dấu hiệu bạn từng xử lý sự cố cache in-heap phình to trên production.`,
  follow: [
    'Điều gì bảo đảm {{get}} trong lúc resize không trả về null giả (false negative)?',
    'Vì sao CounterCell chọn chỉ số theo probe của thread thay vì round-robin, và LongAdder chia sẻ ý tưởng này ra sao?',
    'Khi nào bạn chủ động {{mappingCount()}} + pre-size thay vì để map tự resize, và đo ngưỡng nào là hợp lý?',
  ],
  tags: ['ConcurrentHashMap', 'resize', 'helpTransfer', 'CounterCell', 'ForwardingNode'],
  refs: [
    { type: 'doc', title: 'ConcurrentHashMap API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html' },
    { type: 'doc', title: 'LongAdder API (mô hình counter striped)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html' },
  ]
},
{
  id: 'concurrency-041',
  topic: 'concurrency',
  level: 'senior',
  q: '{{StampedLock}} optimistic read hoạt động bên trong thế nào: stamp chứa gì, {{validate}} kiểm tra điều gì, upgrade từ optimistic sang write lock ra sao, và vì sao nó **không** phải lựa chọn mặc định thay cho {{ReadWriteLock}}?',
  a: `**Tóm tắt:** Optimistic read là chế độ đọc **không ghi bất kỳ dấu vết nào** lên state của lock. Bạn lấy một **stamp** (một số long mang version của lock), đọc dữ liệu, rồi gọi {{validate(stamp)}}: nếu trong khoảng đó không có writer nào đi qua thì version chưa đổi → số liệu bạn đọc là một snapshot hợp lệ và bạn dùng luôn; nếu có writer thì {{validate}} trả false → bạn mới thật sự lấy {{readLock()}} và đọc lại. Toàn bộ cơ chế nằm trong cách StampedLock mã hoá state: một long chứa số reader, một bit writer và các bit version, writer flip bit và tăng version nên mọi stamp cũ tự hết hiệu lực. Cái giá phải trả: không reentrant, không có Condition, không có công bằng, và code đọc phải "sạch" — không được gọi callback hay đụng tới state ngoài lock.

### Hiểu nhanh
 Tem niêm phong trên hộp tài liệu. Bạn ghi lại mã tem, mở hé nắp xem nhanh rồi kiểm tra mã tem: tem còn nguyên nghĩa là trong lúc xem không ai đụng vào hộp, số bạn ghi là đáng tin; tem đã đổi nghĩa là có người vừa mở — bạn phải xin phép xem lại một cách chính thức. Optimistic read chính là "xem rồi kiểm tra tem", còn {{readLock()}} là "xin phép xem" trước khi mở.

### Thuật ngữ
- **stamp**: số long trả về từ {{tryOptimisticRead()}}, {{readLock()}}, {{writeLock()}}. Nó vừa là "tem" của mode optimistic, vừa là **chìa** để unlock ở mode read/write (vì vậy {{unlockRead(stamp)}} cần đúng stamp đã lấy).
- **validate(stamp)**: so các bit version/reader của stamp với state hiện tại, không khoá gì cả. Trả true = "không có writer xen vào khoảng đọc của tôi".
- **tryConvertToWriteLock(stamp)**: thử nâng cấp từ optimistic (hoặc read) lên write **một cách không chặn**; thất bại thì phải {{writeLock()}}.
- **AQS Sync bên trong**: khi thật sự phải chờ (writeLock bị blocked, readLock có writer đang chờ), StampedLock rơi về hàng đợi AQS như các lock khác; chỉ có optimistic path và read path không tranh chấp là không đụng tới hàng đợi.
- **Hold counter (so sánh với ReadWriteLock)**: ReentrantReadWriteLock chia một int state thành 16 bit write + 16 bit read, và để tránh mọi reader CAS cùng một biến, nó giữ {{firstReader}} cùng {{cachedReads}} và một {{ThreadLocalHoldCounter}} — đó là lý do read lock của RRWL rẻ hơn "naive RW lock" nhưng vẫn mắc hơn optimistic path của StampedLock.

### Pattern chuẩn
~~~java
public class Point {
    private final StampedLock sl = new StampedLock();
    private volatile int x, y;          // volatile: doc o mode optimistic can nhin thay write cuoi

    public int distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead();          // khong khoa gi ca
        int curX = x, curY = y;                       // copy het nhung gi can dung ra bien cuc bo
        if (!sl.validate(stamp)) {                    // co writer xen vao?
            stamp = sl.readLock();                    // quay ve doc "that"
            try {
                curX = x;
                curY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.abs(curX) + Math.abs(curY);
    }

    public void move(int dx, int dy) {
        long stamp = sl.writeLock();                  // writer duy nhat, loai moi doc/ghi khac
        try {
            x += dx; y += dy;
        } finally {
            sl.unlockWrite(stamp);
        }
    }
}
~~~
Điểm mấu chốt của pattern: **đọc tất cả vào biến cục bộ trước khi validate**, vì sau khi validate fail bạn không còn quyền gì để đọc tiếp mà không lấy lock. Và vì optimistic path không tạo cạnh happens-before giữa write và read, các field được đọc ở chế độ này nên là volatile (hoặc dữ liệu phải là object bất biến được publish qua một tham chiếu volatile) — đây là bẫy tinh vi mà tài liệu JDK cảnh báo.

### Bảng so sánh
| | ReentrantReadWriteLock | StampedLock |
|---|---|---|
| Reentrant | có | **không** (đè lên lock của chính mình → tự chặn) |
| Condition / await | có | **không** |
| Fairness | chọn được fair | không có |
| Read lock không tranh chấp | CAS state (đỡ hơn nhiều nhờ hold counter) | không ghi gì cả (rẻ nhất) |
| Upgrade optimistic → write | không có | {{tryConvertToWriteLock}} |
| An toàn khi dùng sai | JVM báo IllegalMonitorStateException dễ hiểu | dùng sai stamp thường **im lặng**, bug chỉ lộ ra khi có write |
| Khi nào thắng | đọc nhiều, ghi thỉnh thoảng, API quen thuộc | đọc **rất** nhiều + profile chỉ rõ contention ở read lock |

### Trên production
- **Đo trước, đổi sau.** Bật JFR {{jdk.JavaMonitorEnter}} hoặc async-profiler {{-e lock}}/wall-clock, tìm khung {{ReentrantReadWriteLock$Sync.tryAcquireShared}} / {{park}} lặp lại. Nếu read lock chỉ chiếm 1% mẫu, StampedLock không cứu được gì.
- **Ghi nhiều thì StampedLock tệ hơn**: mỗi write làm mọi stamp cũ fail, reader lại rơi về readLock — đường đi dài hơn cả RRWL.
- **Nghiện "đọc không lock" dễ sinh bug khó thấy**: một writer nhỏ, chạy giữa hai lần đọc field, khiến snapshot gồm nửa cũ nửa mới. Test phải có thread ghi thật (đóng góp từ câu về test đồng thời), không chỉ test đọc.
- **Cân nhắc phương án đơn giản hơn**: với config/danh sách ít đổi,{{volatile}} trỏ tới một object **bất biến** (copy-on-write) cho cùng lợi ích "đọc không lock" mà không cần stamp, không cần validate, và không thể dùng sai. Đây là cách tôi chọn nếu tỷ lệ ghi dưới ~1% và dữ liệu vừa trong một snapshot.
- Nếu bắt buộc dùng: encapsulate hoàn toàn lock trong một class nhỏ, không trả stamp ra ngoài, viết unit test cho cả hai nhánh validate true và false (bằng cách chèn writer đúng nhịp).

### Lỗi hay gặp
- Quên {{unlockRead(stamp)}} hoặc trả nhầm stamp → lock bị "rò", reader khác chờ mãi.
- Gọi {{readLock()}} rồi trong vùng đọc lại gọi hàm khác lấy {{writeLock()}} trên cùng thread → deadlock tức thì (vì không reentrant).
- Dùng optimistic read rồi **ghi** dữ liệu dựa trên nó: mode optimistic không cấp quyền ghi; phải convert sang write lock thành công rồi mới ghi.
- Tin rằng {{validate}} true = "dữ liệu tôi đọc là mới nhất tính tới lúc này" — nó chỉ nói "không có write nào **xen giữa**", writer sau đó vẫn có thể đổi ngay tức khắc.

### Trả lời miệng 1 phút
"Optimistic read của StampedLock lấy một stamp mã hoá version của lock, đọc dữ liệu vào biến cục bộ, rồi validate: nếu không writer nào đi qua thì stamp vẫn hợp lệ và dữ liệu dùng được, nếu có thì quay lại đọc bằng {{readLock()}}. Nó rẻ vì path đọc không tranh chấp **không ghi gì vào state**, nên không có cache line ping-pong giữa các reader. Nhưng nó không reentrant, không có Condition, không có fairness, dùng sai thì fail im lặng, và field được đọc phải volatile để visibility đúng. Vì vậy tôi chỉ dùng khi profile chỉ rõ contention ở read lock của một cấu trúc đọc-nhiều-ghi-ít; còn lại {{ReadWriteLock}} hoặc một snapshot bất biến sau {{volatile}} là lựa chọn an toàn hơn."

> Senior tip: câu chuyện thật của StampedLock không phải tốc độ mà là **tính dễ sửa sai**. Nó nhanh hơn ở micro-benchmark, nhưng mọi bug đều âm thầm và chỉ lộ khi có write. Trước khi đổi, hãy thử copy-on-write ({{volatile}} tham chiếu tới object bất biến): đạt cùng hiệu quả "đọc zero-lock", mà code review không cần hiểu về stamp.`,
  follow: [
    'Vì sao ReentrantReadWriteLock phải dùng hold counter và {{firstReader}} thay vì chỉ CAS một biến read count?',
    'Optimistic read không tạo cạnh happens-before — hệ quả cụ thể với field không volatile là gì, và volatile có đủ ở cả hai chiều?',
    'Điều gì xảy ra với writer khi reader optimistic chạy quá lâu (đọc 500MB trong vùng optimistic)? Có starvation không?',
  ],
  tags: ['StampedLock', 'optimistic read', 'ReadWriteLock', 'copy-on-write'],
  refs: [
    { type: 'doc', title: 'StampedLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/StampedLock.html' },
    { type: 'doc', title: 'ReentrantReadWriteLock API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantReadWriteLock.html' },
  ]
},
{
  id: 'concurrency-042',
  topic: 'concurrency',
  level: 'senior',
  q: 'Bên trong {{CompletableFuture}} có gì: kết quả và chuỗi callback được lưu thế nào, **thread nào** thật sự chạy {{thenApply}}, {{thenApplyAsync}} thay đổi điều gì trong cấu trúc đó, và vì sao callback nặng có thể làm nghẽn cả HTTP client?',
  a: `**Tóm tắt:** Mỗi CompletableFuture chỉ giữ hai thứ: một field **result** (giá trị, hoặc một wrapper {{AltResult}} chứa lỗi, hoặc null = chưa xong) và một **stack liên kết** các node {{Completion}} — mỗi node là một bước đã đăng ký. Khi có ai gọi {{complete(v)}}, chính thread đó chạy {{postComplete()}} và **thực thi luôn toàn bộ stack callback** ngay trên thread của mình. nên câu trả lời cho "thread nào chạy callback" là: thread nào complete future trước, hoặc thread gọi {{thenApply}} nếu future đã xong từ trước. {{thenApplyAsync(fn)}} không đổi logic, nó chỉ đổi chỗ **đăng ký**: node được gắn executor, khi tới phiên thì submit task vào executor đó (mặc định là asyncPool của {{ForkJoinPool.commonPool}}). Hệ quả thực chiến: đặt code nặng/blocking vào callback không truyền thống là tự nguyện chiếm thread của thư viện IO.

### Hiểu nhanh
Dây chuyền xếp hàng ở bưu điện: người vừa làm xong việc của mình **đứng lại nhắc và làm luôn bước kế tiếp** cho người sau, thay vì ném vào một hàng đợi chung. Nhanh và không tốn chi phí điều phối — nhưng nếu bước kế tiếp là khiêng một thùng hàng nặng, thì người vừa xong việc bị kẹt tại chỗ, và cả dây chuyền phía trên anh ta (xe tải, cửa kéo hàng) cũng kẹt theo.

### Thuật ngữ
- **result / AltResult**: một field tham chiếu chứa hoặc giá trị, hoặc {{AltResult(throwable)}} để mã hoá "hoàn thành với lỗi". Không có enum trạng thái riêng: null = chưa xong.
- **Completion / stack của callback**: mỗi lần gọi {{thenApply}}… tạo một node giữ (hàm, executor, node tiếp theo) và được CAS vào field {{next}} — một Treiber stack (ngăn xếp lock-free).
- **postComplete()**: hàm chạy khi state đổi từ "chưa xong" sang "đã xong"; nó lần qua toàn stack và kích hoạt từng bước **bằng thread hiện tại**.
- **NOW vs FUT mode**: hai cách một node được "bắn": chạy ngay (NOW, trên thread hiện tại) hoặc chuyển cho executor rồi chạy (FUT). Đây chính là khác biệt {{thenApply}}/{{thenApplyAsync}} ở mức code.
- **asyncPool**: executor mặc định cho các hàm *Async — {{ForkJoinPool.commonPool().asyncPool(...)}}; nếu commonPool có parallelism = 0 (cấu hình {{-Djava.util.concurrent.ForkJoinPool.common.parallelism=0}}) thì JDK dùng một executor tạo thread mới cho từng task, để async path không bị vô hiệu.
- **Delayer**: một daemon thread nội bộ ({{CompletableFutureDelayScheduler}}) phục vụ {{orTimeout}} và {{completeOnTimeout}}.
- **managedBlock**: cách {{get}}/{{join}} "báo" cho ForkJoinPool rằng mình sẽ block, để pool bổ sung thread dự phòng thay vì chết chùm.

### Đường đi của một chuỗi
~~~text
cf = CompletableFuture.supplyAsync(fetch, ioPool)
     .thenApply(parse)                // node A, executor = null
     .thenApplyAsync(save, dbPool);   // node B, executor = dbPool

1. ioPool-thread chạy fetch, xong thì gọi cf.complete(value)
2. Chính ioPool-thread đó chạy postComplete():
     - lấy node A: executor == null -> tryFire NOW -> chạy parse() TRỰC TIẾP trên ioPool-thread
     - A xong, sinh cf2; node B chưa chạy vì còn chờ cf2 xong -> chỉ đẩy vào stack của cf2
3. parse xong -> cf2.complete() -> thread vừa chạy parse (vẫn là ioPool-thread) chạy postComplete của cf2
4. Node B có executor -> dbPool.submit(save) -> save() chạy trên dbPool-thread.
=> parse() "đè nặng" lên thread của ioPool; save() ở thread của dbPool.
   Nếu cf ĐÃ xong từ trước khi gọi thenApply thì A chạy ngay trên thread gọi.
~~~

### Bảng: API → thread chạy
| Cách viết | Callback chạy trên |
|---|---|
| {{thenApply}} / {{thenAccept}} / {{thenCompose}} | thread hoàn thành future (hoặc thread gọi nếu đã xong) — **không xác định trước** |
| {{thenApplyAsync(fn)}} | asyncPool (mặc định {{ForkJoinPool.commonPool}}) |
| {{thenApplyAsync(fn, executor)}} | thread của executor đó; executor từ chối → future hoàn thành bằng {{RejectedExecutionException}} |
| {{whenComplete}} / {{handle}} | như {{thenApply}}, thêm biến thể *Async |
| {{get}} / {{join}} | block thread hiện tại (join ném {{CompletionException}}, get ném {{ExecutionException}}) |
| {{orTimeout}}, {{completeOnTimeout}} | Delayer thread rồi executor của CF khi hoàn thành |
| {{cancel(true)}} | chỉ hoàn thành bằng {{CancellationException}}; **không** interrupt công việc đang chạy |

### Vì sao JDK chọn thiết kế "ai xong thì chạy tiếp"
- Không tốn một lần submit + một hàng đợi cho mỗi bước: với pipeline 10 bước gọi 100k lần/giây, tiết kiệm 10 lần scheduling.
- Không cần một pool "chuyên chạy callback" — pool đó nếu có thì cũng chỉ thêm một bước nhảy thread và mất tính xác định vị trí.
- Trade-off: tính xác định bị đánh đổi lấy throughput. Callback ngắn, không đồng bộ, không phụ thuộc thread-local thì mô hình này tuyệt vời; ngược lại nó trở thành bug khó tái hiện vì "thread nào chạy" phụ thuộc timing.

### Trên production
- **Mất ngữ cảnh theo thread**: {{ThreadLocal}}, {{SecurityContext}}, MDC của log không tự đi theo callback. Dấu hiệu: log của bước sau mất traceId, hoặc {{@Transactional}} "biến mất" vì transaction bind với thread. Cách xử lý: truyền context tường minh trong pipeline, hoặc bọc executor bằng decorator copy context ({{TaskDecorator}} trong Spring) và **luôn** chạy các bước phụ thuộc context trên *Async với pool của bạn.
- **Chiếm thread của thư viện IO**: với client NIO (Reactor/Netty, Kafka client, JDBC async), thread hoàn thành CF thường là **event-loop**. Chạy {{Thread.sleep}}, parse JSON lớn, hay gọi DB đồng bộ trong {{thenApply}} sẽ làm event-loop nghẽn → timeout dây chuyền cho mọi request khác. Quy tắc: callback trong chain trả lời API chỉ được tính toán nhẹ; gì đó blocking thì chuyển sang *Async với pool riêng có tên.
- **Tách pool theo loại việc**: tự tạo pool với {{ThreadFactory}} đặt tên rõ để đọc dump nhanh ("http-callback-3" thay vì "ForkJoinPool.commonPool-worker-9"). Dùng pool riêng thay vì commonPool cho công việc blocking để không chia sẻ hàng đợi với parallel stream của code khác.
- **Chết vì "bỏ phiếu" lẫn nhau**: {{pool.submit(...).thenCompose(x -> ...pool...)}} với pool nhỏ có thể deadlock (toàn bộ worker đang block chờ {{get}} của task nằm trong chính hàng đợi của nó). Đây là triệu chứng "CPU 0%, không lỗi, không timeout".
- **Đo**: nếu thấy p99 của toàn bộ endpoint tăng theo một callback nặng, dùng async-profiler wall-clock và tìm khung {{CompletableFuture.postComplete}} / {{CompletableFuture.uniApply}} — nó nói cho bạn biết callback đang bị chạy trên thread nào.

### Lỗi hay gặp
- Nghĩ rằng {{thenApplyAsync}} = "chạy ở background" nói chung, mà không chỉ định executor → âm thầm vào commonPool, nơi parallel stream và các async khác đang dùng chung.
- Bỏ {{exceptionally}}/{{handle}} ở cuối chain: lỗi đi ngầm tới {{join}} và bùng ra ở chỗ không liên quan, hoặc mất hẳn nếu không ai đọc future.
- Dùng {{allOf}} rồi {{join}} từng cái mà không bọc lỗi: một bước fail kéo {{CompletionException}} chồng lớp khó đọc.
- Chờ {{get()}} mà không timeout trên thread xử lý request → thread pool cạn, service treo dù downstream nhanh.

### Trả lời phỏng vấn 1 phút
"Bên trong CF là một field result (kèm wrapper AltResult cho lỗi) và một stack các node Completion đăng ký theo kiểu lock-free. Khi {{complete}} được gọi, chính thread đó chạy {{postComplete}} và thi hành các node: node nào không có executor thì chạy ngay NOW trên thread hiện tại, node *Async thì được submit FUT vào executor. Nên thread của {{thenApply}} là **không xác định** — nó là thread đã hoàn thành future, thường là thread của HTTP client hay của DB driver; đó chính xác là lý do tôi không bao giờ đặt blocking work vào callback không-async. {{thenApplyAsync}} cho tôi kiểm soát vị trí chạy; mặc định nó dùng asyncPool của commonPool, nên trên server tôi luôn truyền pool riêng có tên, có giới hạn, và tôi xử lý {{RejectedExecutionException}} vì executor từ chối sẽ hoàn thành future bằng lỗi đó."

> Senior tip: nếu phải chọn một quy trình cho team: (1) mọi chain gọi ra ngoài dùng {{orTimeout}} và {{completeOnTimeout}}, (2) mọi callback nặng đi {{*Async}} với pool riêng, (3) không dùng commonPool cho I/O, (4) luôn có {{handle}} ở cuối chain để ghi log một lần. Bốn quy tắc này diệt được phần lớn sự cố liên quan CompletableFuture mà không cần ai hiểu internals.`,
  follow: [
    'Vì sao {{get}} phải gọi {{ForkJoinPool.managedBlock}}, và nếu nó không làm vậy thì chuyện gì xảy ra với commonPool?',
    'Chênh lệch giữa {{exceptionally}}, {{handle}} và {{whenComplete}} khi lỗi đến từ chính hàm xử lý lỗi?',
    '{{CompletableFuture}} với virtual thread thay đổi gì trong bức tranh "thread nào chạy callback"?',
  ],
  tags: ['CompletableFuture', 'callback', 'ForkJoinPool', 'commonPool', 'context propagation'],
  refs: [
    { type: 'doc', title: 'CompletableFuture API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html' },
    { type: 'doc', title: 'ForkJoinPool API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html' },
  ]
},
{
  id: 'concurrency-043',
  topic: 'concurrency',
  level: 'senior',
  q: 'Reordering xảy ra ở đâu và vì sao: store buffer, invalidate queue của CPU và JIT compiler cùng đổi thứ tự lệnh ra sao, loại memory barrier nào chặn từng kiểu, và tại sao code "đúng trên laptop x86" có thể sai trên AWS Graviton?',
  a: `**Tóm tắt:** Có ba thủ phạm đổi thứ tự thao tác memory: (1) **store buffer** — CPU không chờ cache line về tay mới ghi tiếp, nó cất ghi vào hàng đợi riêng rồi làm tiếp, nên chính thread thấy "đã ghi" còn người khác chưa thấy; (2) **invalidate queue** — lời vô hiệu hoá từ core khác được xếp hàng chờ thay vì dừng core ngay; (3) **compiler/JIT** — C2 được phép đổi chỗ các lệnh mà nó chứng minh là không phụ thuộc dữ liệu/điều kiện. JMM không mô tả "lệnh chạy theo thứ tự nào", nó mô tả **cạnh happens-before**: cái gì được phép nhìn thấy cái gì. Trên x86 (mô hình TSO) ba kiểu đổi chỗ load-load, load-store, store-store đã bị cấm bởi phần cứng, nên JVM chỉ phải phát ra fence cho kiểu **StoreLoad**: volatile write = ghi + fence (trên x86 thường là {{lock addl $0x0,(%rsp)}} — một lock-prefixed no-op, cũng là full fence), volatile read = đọc + fence. Trên ARM/RISC-V (mô hình yếu) cả bốn kiểu đều có thể xảy ra, JVM phải chèn {{ldar}}/{{stlr}} hoặc {{dmb}} — và đó là lý do bug thật sự xuất hiện khi bạn port service sang Graviton.

### Hiểu nhanh
Bạn gửi thư: bỏ thư vào **sọt thư của nhà mình** (store buffer) rồi quay đi — với bạn, thư đã "gửi rồi", nhưng người nhận chưa thấy gì, và lá thư vẫn còn có thể bị đẩy ra sau một lần bạn đi xem hộp thư (read). Fence giống quy định "trước khi nhìn hộp thư của người khác, phải đẩy hết thư trong sọt ra".

### Thuật ngữ
- **Store buffer**: hàng đợi các phép ghi chưa kịp áp dụng vào cache; tồn tại vì ghi vào cache đang bị core khác giữ tốn hàng chục tới hàng trăm chu kỳ.
- **Store forwarding**: chính thread đọc lại địa chỉ vừa ghi thì thấy giá trị mới từ store buffer; thread khác thì chưa. Đây là nguồn gốc của kiểu đổi chỗ StoreLoad.
- **Invalidate queue**: hàng đợi nhận thông báo "bản cache của mày bị vô hiệu" từ bus, xử lý trễ để không stall.
- **Memory barrier (fence)**: lệnh buộc các thao tác memory trước/sau nó không được vượt qua nhau theo một cặp nào đó: LoadLoad, StoreStore, LoadStore, **StoreLoad** (đắt nhất, thường là {{mfence}} hoặc lệnh có prefix {{lock}}).
- **Acquire/Release**: cách mô tả hiện đại — đọc-acquire đảm bảo mọi thao tác sau nó không "nhảy lên trước"; ghi-release đảm bảo mọi thao tác trước nó không "rơi xuống sau". volatile và lock của JMM tương ứng đúng cặp semantics này.
- **TSO (Total Store Order)**: mô hình memory của x86, chỉ còn mỗi StoreLoad là được tự do.
- **JCStress**: framework của OpenJDK chuyên tìm bug do reordering (khác JMH, cái này đo **kết quả** chứ không đo thời gian).

### Kịch bản kinh điển: hai biến, hai thread
~~~java
// bien dau, tren x86 lan ARM
int x = 0, y = 0;
// Thread 1            // Thread 2
x = 1;                  y = 1;
r1 = y;                 r2 = x;
~~~
Không lock, không volatile: cả {{r1 == 0 && r2 == 0}} **là hợp lệ**, kể cả trên x86. Lý do không phải JIT mà là store buffer: mỗi thread ghi vào biến của mình (nằm trong store buffer, chưa tới cache line mà thread kia đang đọc), rồi đọc từ cache line đang bị core kia giữ. Kết quả "mỗi người tin mình ghi trước". Đây chính xác là bug mà {{Dekker's algorithm}} và mọi cờ "ready flag" không volatile gặp phải.
~~~text
Core 1                          Core 2
  store x=1 -> [store buffer 1]     store y=1 -> [store buffer 2]
  load  y    <- cache line (y=0)    load  x    <- cache line (x=0)
  ... buffer 1 moi flush, du som    ... buffer 2 moi flush, du som
Ket luan: ca hai cung thay 0, khong co data race ve mặt logic bien nhung khong co happens-before.
~~~
Đặt {{volatile}} cho x và y thì hàng đợi bị chặn: ghi + StoreLoad fence, đọc trước khi đọc khác → ít nhất một thread thấy 1.

### JMM cho những cạnh nào (tra nhanh)
| Cạnh happens-before | Fence JVM phải chèn | Ghi chú |
|---|---|---|
| {{unlock}} → {{lock}} cùng monitor | release/acquire; trên x86 fast path chỉ cần một lệnh có prefix {{lock}}, monitor thật thì có fence | {{synchronized}} cũng đẩy store buffer "về chỗ" |
| volatile write → volatile read cùng field | StoreLoad fence ở write; trên x86 read thường không thêm fence nào | Đắt nhất trong các path, vì fence full |
| {{Thread.start()}} → code trong {{run()}} | một lần thiết lập trước khi chạy, không phải mỗi thao tác | Đây là cách an toàn để "giao" dữ liệu cho thread mới |
| code trong {{run()}} → {{Thread.join()}} thành công | tương tự, ở chiều về | Không có join/isAlive thì không có cạnh |
| final field → lần đọc đầu tiên sau khi publish đúng | StoreStore fence ở cuối constructor ("freeze action") | Điều kiện: {{this}} không được rò rỉ trong constructor |
| {{interrupt()}} → nơi ném {{InterruptedException}} | quy ước của JMM | |

### Vì sao lại "sai trên ARM"
Trên x86, ba hàng đầu tiên gần như miễn phí vì phần cứng TSO đã sắp xếp; bug reordering thường tự ẩn. ARM cho phép load và store đổi chỗ tự do hơn nhiều, nên các pattern "tự viết lock" (spin flag, sequence counter, {{Double-checked locking}} thiếu volatile, đọc hai field liên quan mà không khoá) lộ ra tức thì. Service chạy ổn 2 năm trên Intel rồi lỗi rải rác khi chuyển sang Graviton/Ampere — hoặc khi chạy test trên máy Mac ARM — gần như luôn thuộc nhóm này.

### Trên production
- **Không suy luận từ "CPU tôi không đổi chỗ"**. Hãy dựa vào cạnh happens-before: hoặc dùng volatile/atomic/lock, hoặc **single-writer** (chỉ một thread ghi field đó, các thread khác chỉ đọc qua snapshot bất biến) — cách thứ hai là những gì Disruptor và các ring buffer dùng.
- **Bằng chứng thay vì tranh luận**: JCStress ({{@JCStressTest}} + {{@Outcome(accept = ...)}}) cho thấy chính xác tổ hợp kết quả được phép; chạy thêm trên cả x86 và ARM. Đây là công cụ JDK dùng để kiểm thử chính JMM.
- **Xem JVM phát ra gì**: {{-XX:+UnlockDiagnosticVMOptions -XX:+PrintAssembly}} hoặc {{-XX:+LogCompilation}} để thấy fence được chèn quanh volatile access (nâng cao, chỉ khi thật sự cần).
- **ARM cần test riêng trên CI** nếu bạn có kế hoạch chạy Graviton: một job ARM (AWS Graviton instance hoặc Docker {{--platform linux/arm64}}) chạy đúng bộ concurrency test sẽ bắt phần lớn lỗi này.
- **{{final}} không phải "miễn phí"**: chỉ đảm bảo an toàn khi object được publish **đúng** (không rò {{this}} lúc constructor, tham chiếu tới object bất biến được publish qua volatile/final/lock). Nếu publish sai, mọi thứ đều vô giá trị.

### Trả lời phỏng vấn 1 phút
"Reordering có hai nguồn: phần cứng — store buffer làm ghi chưa tới cache nên chính thread thấy đã ghi trong khi core khác chưa, invalidate queue hoãn việc vô hiệu hoá bản cache; và compiler/JIT — C2 đổi chỗ lệnh khi chứng minh không phụ thuộc dữ liệu. JMM chặn bằng cách định nghĩa happens-before, và fence là cách hiện thực: bốn loại LoadLoad/StoreStore/LoadStore/StoreLoad, trong đó StoreLoad đắt nhất. Trên x86 theo TSO ba loại kia được đảm bảo miễn phí, nên volatile write chỉ cần một lệnh có prefix lock, còn trên ARM yếu hơn thì JVM phải chèn acquire/release thật — đó là lý do bug reordering thường hiện ra khi port sang Graviton. Tôi không lập luận theo CPU, tôi lập luận theo cạnh happens-before: volatile, lock, start/join, hoặc thiết kế single-writer với snapshot bất biến."

> Senior tip: điều đáng nói nhất với vai trò lead không phải thuộc lòng bốn loại fence, mà là **quy trình**: code có tự-written lock/spin flag thì bắt buộc có test JCStress hoặc ít nhất chạy bộ test trên ARM trong CI, và code review phải hỏi "cạnh happens-before nào ở đây". Một dòng {{volatile}} rẻ hơn nhiều một sự cố "chỉ xảy ra 3 request trên 10 triệu" mà bạn không thể tái hiện.`,
  follow: [
    'Vì sao lock-prefixed instruction trên x86 đóng vai trò full fence, và nó khác {{mfence}} ở điểm gì?',
    'Dependency (data/control) có bị phá vỡ bởi reordering không — vì sao {{load-acquire}} có thể dựa vào control dependency?',
    'Nếu chỉ có {{volatile}} cho cờ ready, còn dữ liệu lớn thì đọc ở thread khác có bảo đảm thấy đủ? Kịch bản nào vẫn sai?',
  ],
  tags: ['JMM', 'reordering', 'store buffer', 'memory barrier', 'ARM', 'x86-TSO'],
  refs: [
    { type: 'doc', title: 'JSR-133 Cookbook for Compiler Writers', url: 'https://gee.cs.oswego.edu/dl/jmm/cookbook.html' },
    { type: 'doc', title: 'JCStress (OpenJDK concurrency test framework)', url: 'https://github.com/openjdk/jcstress' },
  ]
},
{
  id: 'concurrency-044',
  topic: 'concurrency',
  level: 'lead',
  q: 'Bên trong virtual thread: continuation và stack chunk trông ra sao, mount/unmount xảy ra thế nào trên carrier thread, scheduler được cấu hình ra sao, pinning thật sự là gì và JEP 491 (JDK 24) thay đổi điều gì?',
  a: `**Tóm tắt:** Một virtual thread **không** phải một OS thread: nó là object {{VirtualThread}} trong heap cộng với một **continuation** — stack của đoạn code đang chạy. Khi virtual thread block, JVM **đóng băng (freeze)** các frame từ stack native của carrier thread xuống **stack chunk** trên heap, rồi **unmount**: carrier thread (một worker của ForkJoinPool nội bộ) quay về làm việc khác. Khi dữ liệu sẵn sàng, scheduler lấy một carrier bất kỳ, **rã đông (thaw)** chunk về stack native rồi chạy tiếp đúng chỗ dừng — đó là lý do 1 triệu virtual thread chỉ tốn heap (vài KB mỗi cái) chứ không tốn 1 MB stack + một kernel thread mỗi cái. **Pinning** nghĩa là carrier không nhả được vì stack của virtual thread còn bị "neo" vào tài nguyên của chính carrier: (1) đang ở trong {{synchronized}} mà block, (2) đang có frame native (JNI, một số lời gọi hệ thống) trên stack. JEP 491 trong **JDK 24** xử lý trường hợp (1): monitor giờ được "đóng băng" cùng continuation, nên {{synchronized}} quanh code blocking không còn pin carrier nữa.

### Hiểu nhanh
Nhà hàng có 8 nhân viên (carrier) và 5.000 khách (virtual thread). Thay vì mỗi bàn một nhân viên đứng đợi bếp — mô hình platform thread — nhân viên ghi lại "bàn 12 đang ở món 2, dở at trang 3" rồi đi bàn khác (freeze + unmount). Bếp gọi số, một nhân viên bất kỳ quay lại bàn 12, đọc tờ ghi chú và phục vụ tiếp (thaw + mount). Chỉ khi khách cần nhân viên đứng ngay tại bàn (frame native) thì mới không bỏ được.

### Thuật ngữ
- **Continuation**: đối tượng nội bộ ({{jdk.internal.vm.Continuation}}) biểu diễn "một đoạn chạy có thể dừng và tiếp tục": có {{run()}}, {{yield()}}, và stack của riêng nó.
- **Stack chunk**: mảnh chứa các frame đã đóng băng, nằm trên heap; khởi đầu nhỏ và **phình to / thu lại** theo độ sâu stack thực tế — chỗ này là bộ nhớ bạn trả cho "1 triệu thread".
- **Freeze / thaw**: chuyển frame giữa stack native của carrier và stack chunk (ngược chiều nhau).
- **Mount / unmount**: gán một virtual thread vào một carrier (mount) và gỡ ra (unmount) — về bản chất là freeze/thaw + đổi con trỏ trong {{Thread}} hiện tại.
- **Carrier thread**: platform thread, thông thường là worker của {{ForkJoinPool}} riêng của hệ thống virtual thread; chính nó mới là thứ CPU nhìn thấy.
- **Scheduler**: ForkJoinPool nội bộ. Parallelism mặc định = {{Runtime.availableProcessors()}}, chỉnh bằng hệ property {{jdk.virtualThreadScheduler.parallelism}}; {{jdk.virtualThreadScheduler.maxPoolSize}} cho phép thêm thread bù khi carrier bị block trong native code; {{jdk.virtualThreadScheduler.idleTimeout}} quy định bao lâu thì thread bù bị huỷ.
- **Pinned**: trạng thái virtual thread **không được** unmount, nên carrier phải nằm chờ theo; tài nguyên thật sự bị chiếm là một carrier.
- **JEP 444 / JEP 491**: 444 = virtual threads (JDK 21); 491 = "Synchronized blocks may pin carriers" được khắc phục (JDK 24).

### Chuyện gì xảy ra khi một virtual thread đọc socket
~~~seq
title: Virtual thread block trong Socket.read
actors: VirtualThread | Continuation | Carrier (FJP worker) | Poller | Kernel
VirtualThread -> Carrier: dang chay tren carrier, goi read()
Carrier -> Continuation: khong the block carrier -> freeze frame xuong stack chunk
Carrier -> Poller: dang ky fd voi EPoll wait
Carrier -> Carrier: unmount, quay ve lay task khac trong hang doi FJP
Poller -> Kernel: epoll_wait
Kernel -> Poller: socket co du lieu
Poller -> VirtualThread: unpark, do virtual thread vao hang doi scheduler
Carrier -> Continuation: mount tiep: thaw stack chunk ve stack native
Carrier -> VirtualThread: chay tiep dung sau read(), tra ve ket qua
~~~
Ba hệ quả quan trọng: (1) thứ tự chạy không còn bị ràng buộc bởi một thread cụ thể — code của bạn có thể tiếp tục trên **carrier khác** (hoặc cùng carrier sau đó), nên mọi giả định "việc A và việc B chạy trên cùng thread" đều sai; (2) không có gì "tạo OS thread" khi bạn block, cái phải chờ là một task trong hàng đợi scheduler; (3) {{ThreadLocal}} và {{synchronized}} trở nên nguy hiểm hơn về hiệu năng/ngữ cảnh vì chúng gắn với carrier hoặc giữ carrier.

### Vì sao {{synchronized}} từng pin carrier
Vấn đề nằm ở ObjectMonitor của JVM (mô hình monitor HotSpot được thiết kế từ trước có Loom): khi thread block trong monitor, JVM cần nhả monitor và **điều đó được ghi vào cấu trúc dữ liệu của monitor gắn với platform thread đang giữ** (owner là carrier). Muốn đóng băng được virtual thread, JVM phải cho phép owner của monitor "đổi người" khi mount lại trên carrier khác — JDK 21 chưa làm. JEP 491 sửa bằng cách cho phép monitor bị đóng băng/giải đóng băng cùng continuation, tức {{synchronized}} không còn là lý do pin nữa (còn frame native thì vẫn pin, vì stack native theo định nghĩa không di chuyển được).

### Bảng so sánh
| | Platform thread pool | Virtual thread |
|---|---|---|
| Đơn vị lập lịch | OS thread, 1:1 | task của FJP nội bộ, M:N |
| Chi phí mỗi thread | ~1 MB stack + kernel struct | vài KB heap, phình theo stack |
| Block | chiếm thread OS, context switch | freeze + unmount, carrier rảnh |
| Giới hạn | số thread (vài nghìn) | số lượng gần như không giới hạn, giới hạn thật là tài nguyên phía dưới |
| ThreadLocal | chấp nhận được | nhớ: **một map cho mỗi thread**, 1 triệu thread = 1 triệu map |
| CPU-bound | hợp lý | không giúp gì, chỉ thêm freeze/thaw |
| Cần gì để nhanh | pool đủ lớn | driver/library phải non-blocking thật sự (JDBC, socket, JNI) |

### Trên production
- **Bật và đo bằng JFR**: event {{jdk.VirtualThreadPinned}} có ngưỡng thời lượng; xem bằng {{jfr print --events jdk.VirtualThreadPinned recording.jfc}} hoặc {{jcmd <pid> JFR.dump}}. Ở JDK 21–23 còn có {{-Djdk.tracePinnedThreads=full}} in ra stack tại chỗ pin (flag này đã hết giá trị ở JDK 24 vì lý do phổ biến nhất bị loại bỏ).
- **Triệu chứng điển hình**: bật virtual threads cho một endpoint I/O-bound nhưng throughput không tăng, CPU của các carrier luôn 100%, latency tăng theo số request đồng thời → tìm chỗ {{synchronized}} bao lời gọi blocking (driver JDBC cũ, code gọi JNI, thư viện chỉ giữ {{synchronized}} lúc init) và pinning do native frame.
- **Cấu hình carrier**: nếu phần lớn thời gian là pinning không sửa được (thư viện native), tăng {{jdk.virtualThreadScheduler.parallelism}} là giảm đau, nhưng đừng đặt nó quá lớn so với số core vì carrier block vẫn chiếm CPU scheduling.
- **Không "pool" virtual thread**: {{Executors.newVirtualThreadPerTaskExecutor()}} là đúng; gộp 1 triệu task vào một pool 10 virtual thread chỉ tái tạo lại deadlock của pool platform. Giới hạn concurrency bằng {{Semaphore}} (ví dụ 200 request đồng thời xuống DB) — connection pool vẫn là trần tuyệt đối, virtual thread không nhân bản thêm connection.
- **Context**: log MDC/{{SecurityContext}} và {{ThreadLocal}}-based instrumentation phải được viết lại quanh virtual thread ({{ScopedValue}} là hướng đi, vẫn preview ở JDK 21–23); Spring Boot 3.2+ có {{spring.threads.virtual.enabled=true}} cho web MVC server.
- **KPI thật**: trước/sau khi bật, so sánh requests/giây trên mỗi core, p99 và số thread OS trong container ({{/proc}} hoặc metric {{process.threads}}). Virtual thread thắng ở **cùng một số core phục vụ nhiều request đang chờ**, không thắng ở tốc độ từng request.

### Lỗi hay gặp
- Di chuyển {{synchronized}} sang code blocking rồi quên rằng JDK 21–23 vẫn pin — phải kiểm tra bằng JFR chứ không phải bằng mắt.
- Đặt {{ThreadLocal}} chứa object lớn (connection, buffer) với hy vọng "một triệu thread thì có một triệu connection": hết RAM và phá sập DB pool.
- CPU-bound (parse, compress, loop) trên virtual thread: scheduler không giúp gì, chỉ thêm freeze/thaw.
- Tin rằng {{BufferedReader.lines}}, {{Scanner}}... trên virtual thread luôn non-blocking: những đường đi qua native code hoặc {{synchronized}} trong JDK cũ vẫn có thể pin.

### Trả lời miệng 1 phút
"Virtual thread là continuation: stack của đoạn code nằm trong stack chunk trên heap, và JVM mount/rã đông nó lên một carrier thread là worker của một ForkJoinPool nội bộ có parallelism bằng số core. Khi block, frame bị đóng băng, carrier được trả về pool, nên chi phí mỗi thread chỉ còn vài KB và số lượng thread không còn là tài nguyên quý. Pinning là khi carrier không nhả được vì stack còn neo vào tài nguyên của carrier: ở JDK 21 là {{synchronized}} quanh code block và frame native; JEP 491 trong JDK 24 loại bỏ trường hợp {{synchronized}}. Khi áp dụng tôi đo bằng JFR event {{jdk.VirtualThreadPinned}}, không pool virtual thread, giới hạn concurrency bằng semaphore, và luôn nhớ connection pool là trần thật sự — lợi ích là throughput trên mỗi core khi phần lớn thời gian là chờ IO, không phải tốc độ từng request."

> Senior tip: câu phân biệt người từng chạy virtual thread trên production là: "bạn có thấy {{maxPoolSize}}/pinning trong JFR không, và driver JDBC của bạn có path {{synchronized}} không?" Vì nếu còn pin, toàn bộ mô hình M:N bị suy hoá về pool platform thread, và dấu hiệu là CPU carrier 100% với p99 tăng theo concurrency — thứ mà benchmark "1 triệu thread" không bao giờ cho bạn thấy.`,
  follow: [
    'Stack chunk phình ra và co lại thế nào khi stack của bạn đệ quy sâu; hệ quả với {{StackOverflowError}} là gì?',
    'Vì sao {{LockSupport.park}}, {{ReentrantLock}} và {{BlockingQueue}} không pin carrier trong khi {{synchronized}} thì có (trước JDK 24)?',
    '{{ScopedValue}} giải quyết vấn đề gì của {{ThreadLocal}} trong thế giới M:N, và cơ chế gần như hoàn toàn là bất biến theo scope?',
  ],
  tags: ['virtual threads', 'Loom', 'continuation', 'carrier', 'JEP 491', 'pinning'],
  refs: [
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 491: Synchronized Blocks May Pin Carriers', url: 'https://openjdk.org/jeps/491' },
  ]
},
{
  id: 'concurrency-045',
  topic: 'concurrency',
  level: 'lead',
  q: '{{synchronized}} được cài đặt bên trong JVM ra sao: mark word của object chứa gì, chuyện gì xảy ra ở fast path không tranh chấp, khi nào lock bị inflate thành ObjectMonitor, vì sao biased locking bị gỡ ở JDK 18, và flag/debug nào cho phép bạn thấy điều đó?',
  a: `**Tóm tắt:** Mọi object Java đều có một **mark word** 64 bit ở đầu header, chứa (tuỳ trạng thái) identity hash code, 4 bit "age" cho GC và **2 bit trạng thái khoá**. Không ai khoá → bit "unlocked", {{monitorenter}} chỉ là một CAS đổi mark word sang **thin lock** (stack lock): JVM ghi "displaced mark word" cũ vào một {{LockRecord}} trong frame của thread đang giữ lock — **không cấp phát object nào**, không syscall, và reenter chỉ tăng một counter. Khi có thread thứ hai tranh chấp thật, lock bị **inflate** thành **ObjectMonitor** (fat lock) với {{_owner}}, {{_EntryList}} (thread BLOCKED) và {{_WaitSet}} (thread WAITING sau {{wait()}}); {{notify()}} chuyển waiter từ _WaitSet về _EntryList chứ không trao lock. **Biased locking** — tối ưu cho code mà lock chỉ ever thuộc một thread — bị deprecated ở JDK 15 (JEP 374) và **gỡ ở JDK 18**, vì chi phí revocation (phải dừng cả JVM tại safepoint để "tước" lock) và vì nó vô dụng với code hiện đại.

### Hiểu nhanh
Cửa phòng có một **bảng ghi trạng thái** ngay trên cánh (mark word). Không ai trong phòng: bảng trống. Một người vào: người đó ghi "tôi đang ở trong, chìa khoá ở túi tôi" (thin lock) — không cần lắp ổ khoá thật, ai tới thấy bảng thì chờ. Hai người muốn vào cùng lúc: toà nhà lắp **ổ khoá thật** (ObjectMonitor) — có hàng đợi đứng ngoài (_EntryList) và một phòng chờ cho người bấm chuông nghỉ tạm (_WaitSet). Nếu sau đó không còn ai chờ, ổ khoá thật có thể bị tháo ra (deflate) trả về trạng thái nhẹ.

### Thuật ngữ
- **Mark word**: 8 byte header của object; các trạng thái khoá được phân biệt bằng bit thấp. identity hash code (31 bit) cũng sống ở đây — đó là lý do nó xung đột với các chế độ khoá nhẹ.
- **Thin lock / stack lock**: khoá do **một** thread giữ, thông tin nằm trong frame (LockRecord) thay vì trong object.
- **Displaced mark word**: bản sao mark word cũ được cất đi khi lock bị chiếm; khôi phục khi nhả.
- **Inflation / deflation**: chuyển thin lock → ObjectMonitor, và ngược lại (deflate xảy ra tại safepoint khi monitor không còn ai chờ).
- **ObjectMonitor**: cấu trúc native của HotSpot, dùng mutex/condvar của OS cho thread thật sự ngủ; là thứ đứng sau {{BLOCKED}} và {{WAITING}} trong thread dump.
- **Biased locking**: "khoá thiên vị" — mặc định ghi tên thread vào mark word để lần vào sau chỉ cần kiểm tra, khỏi CAS; mất vì chi phí revoke.
- **Lock elision / coarsening**: tối ưu của C2 — xoá lock khi escape analysis chứng minh object không rò khỏi thread, hoặc gộp hai lock liền nhau; cả hai đều **không phải hợp đồng**.
- **{{monitorenter}} / {{monitorexit}}**: bytecode của {{synchronized}} block (method có cờ {{ACC_SYNCHRONIZED}}, JVM tự xử lý quanh toàn bộ method).

### Layout mark word (gợi hình, HotSpot 64 bit)
~~~text
63                              32 31        3  2  1 0
[ unused / identity hash (31 bit) ][age 4][biased][lock bits]
  lock bits = 01 : unlocked
  lock bits = 00 : thin (stack) lock  -> 8 byte tiep theo = con tro toi LockRecord
  lock bits = 10 : heavyweight        -> tro toi ObjectMonitor
  lock bits = 11 : biased              -> ( JDK <= 15, da bi go )
Khi thin lock, frame cua thread giu:
  LockRecord { address cua object | displaced mark word | owner | rec_count | ... }
Vong fast path: CAS mark word (word swap) -> thanh cong, khong cap phat, khong syscall.
Thread 2 tranh chan: inflate -> ObjectMonitor { _owner, _EntryList, _WaitSet, _recursions }
~~~
Điểm đáng chú ý: displaced mark word nằm trong **stack** của thread, nên lock nhẹ có chi phí bộ nhớ gần bằng không và tự biến mất khi method return. Ngược lại ObjectMonitor là bộ nhớ native, và mỗi lần block là một round-trip xuống OS.

### Từng bước của một {{synchronized}} block
1. C2 phát hành {{monitorenter}}; fast path thử "word swap" mark word: nếu object đang unlocked, CAS thành công → thin lock, ghi LockRecord.
2. Nếu object đã là thin lock của **chính thread** này → tăng {{rec_count}} (reentrant), không CAS phức tạp.
3. Nếu là thin lock của thread khác, hoặc CAS thất bại vì lý do khác → **inflate**: tạo ObjectMonitor, đặt {{_owner}}, chuyển người đang giữ lock vào monitor, thread hiện tại vào {{_EntryList}} và block (thread state BLOCKED trong dump).
4. Bên trong block, {{lockObj.wait()}}: nhả lock hoàn toàn ({{recursions}} về 0), chuyển thread vào {{_WaitSet}}, park; thread state WAITING.
5. {{notify()}} chọn một (hoặc all) thread trong _WaitSet và chuyển về _EntryList; **không** trao lock. Người được notify phải tranh lock lại từ đầu — vì vậy await phải ở trong vòng lặp {{while}}.
6. {{monitorexit}} (kể cả đường exception, JVM có Exception table) → nếu còn người trong _EntryList thì chuyển owner; nếu không, monitor có thể bị deflate ở safepoint kế tiếp.

### Bảng: chế độ và hệ quả
| Trạng thái | Dữ liệu nằm ở | Chi phí vào/ra | Ai thấy trong dump |
|---|---|---|---|
| Unlocked | mark word | 0 | — |
| Thin lock | mark word + LockRecord trong stack | 1 CAS, không cấp phát | {{- locked <0x...>}} |
| Heavyweight | ObjectMonitor native | mutex/condvar OS, context switch | {{waiting for monitor entry}}, BLOCKED |
| Biased (cũ) | tên thread trong mark word | ~0 khi cùng thread | đã gỡ ở JDK 18 |
| Elided | không còn lock trong code | 0 | không thấy gì — JIT đã xoá |

### Trên production
- **Đọc dump là chính**: {{jcmd <pid> Thread.print}} (nhiều lần cách nhau 1 giây) cho thấy ai {{locked <0x...>}}, ai {{waiting for monitor entry on <0x...>}}; chuỗi "A chờ lock của B, B chờ lock của C" = deadlock, JVM tự phát hiện và in "Found one Java-level deadlock".
- **Đo contention**: JFR event {{jdk.JavaMonitorEnter}} (có ngưỡng thời lượng, chỉ ghi khi thực sự phải chờ) và {{jdk.JavaMonitorWait}}; async-profiler {{-e lock}} lấy đúng các event đó và cho flame graph "ai chờ lock nào". Đây là cách có bằng chứng thay vì đoán.
- **Flag liên quan, nói đúng sự thật**: {{-XX:+UseHeavyMonitors}} ép mọi monitor thành heavyweight (chẩn đoán lỗi liên quan tới lock nhẹ, hiệu năng giảm mạnh, chỉ dùng trong điều tra); {{-XX:-EliminateLocks}} tắt lock elision của JIT khi bạn muốn chắc lock luôn tồn tại để đo. {{-XX:BiasedLockingStartupDelay}} chỉ còn ý nghĩa lịch sử (JDK ≤ 15/17 tuỳ bản).
- ** hashCode làm hỏng lock nhẹ**: gọi {{System.identityHashCode(obj)}} trên object đang bị thin lock buộc JVM inflate, vì mark word đã bị chiếm. Triệu chứng: thêm log {{obj.toString()}} (mặc định in hash code!) vào đường nóng mà latency tăng. Đây là lý do "log object ra log" trong critical section đắt hơn vẻ ngoài.
- **Không khoá trên object chia sẻ ngoài tầm kiểm soát**: String literal, {{Integer.valueOf}} cache, {{Boolean}}, {{Class}} — dễ gây deadlock với code khác (kể cả thư viện). Luôn tạo {{private final Object lock = new Object();}}.

### Lỗi hay gặp
- Tin rằng {{synchronized}} "chậm" và đổi sang ReentrantLock một cách vô ích: ở chế độ không tranh chấp, cả hai đều chỉ là một CAS; ReentrantLock hơn ở chỗ cần {{tryLock}}/timeout/fair/Condition.
- Dùng {{wait()}} ngoài {{while}} kiểm tra điều kiện → spurious wakeup, hoặc điều kiện bị thread khác lấy mất trước khi chạy tiếp.
- {{notify()}} khi có nhiều loại waiter trên cùng một condition → "lost wakeup", cả hệ thống chờ tới timeout; an toàn hơn là {{notifyAll()}} hoặc chuyển sang {{Condition}} riêng cho từng loại.
- Giữ lock khi gọi ra ngoài (HTTP, DB, log, callback của thư viện) → time giữ lock = latency của hệ ngoài; đây là nguyên nhân số một của contention không giải thích được.
- Nghĩ "JIT xoá lock nên không cần nghĩ về khoá": elision không phải hợp đồng, đổi input/dữ liệu là lock quay lại.

### Trả lời phỏng vấn 1 phút
"{{synchronized}} được JVM cài đặt theo từng bậc: object có mark word giữ trạng thái khoá; vào lock khi không tranh chấp là một CAS đổi mark word sang thin lock, với displaced header nằm trong LockRecord của stack — không cấp phát, không syscall. Có thread thứ hai tranh thì lock inflate thành ObjectMonitor với EntryList và WaitSet; {{wait()}} chuyển sang WaitSet, {{notify()}} đưa về EntryList chứ không trao lock, nên await phải ở trong while. Biased locking từng tồn tại để tối ưu lock một-thread nhưng bị gỡ ở JDK 18 vì chi phí revoke tại safepoint. Khi cần chứng minh contention tôi dùng JFR {{jdk.JavaMonitorEnter}} hoặc async-profiler {{-e lock}}, và đọc {{jcmd Thread.print}} để thấy ai đang {{locked}} và ai đang {{waiting for monitor entry}}."

> Senior tip: ba chi tiết "tôi đã thấy trên production" khiến câu trả lời đáng tin hơn mọi lý thuyết: (1) thêm một dòng log in {{obj.toString()}} làm tăng p99 vì nó tính identity hash code và ép inflate; (2) {{synchronized}} trong driver/thư viện kết hợp virtual thread là nguồn pinning trước JDK 24; (3) phần lớn "lock contention" thực chất là **giữ lock khi gọi I/O** — giải pháp là thu nhỏ critical section hoặc chuyển sang cấu trúc single-writer, không phải đổi loại khoá.`,
  follow: [
    'Điều gì xảy ra khi object có lock nhẹ bị gọi {{hashCode()}} lần đầu sau khi đã inflate — và vì sao {{identity hash}} là 31 bit?',
    'Deflation của ObjectMonitor diễn ra khi nào, vì sao cần safepoint, và hệ quả với latency đuôi (tail latency)?',
    'C2 xoá lock bằng escape analysis trong điều kiện nào, và làm sao kiểm chứng rằng lock còn tồn tại?',
  ],
  tags: ['synchronized', 'mark word', 'ObjectMonitor', 'biased locking', 'lock inflation'],
  refs: [
    { type: 'doc', title: 'JEP 374: Deprecate the Biased Synchronization Mechanism', url: 'https://openjdk.org/jeps/374' },
    { type: 'doc', title: 'JEP 142: Reduce Cache Contention on Modern Hardware', url: 'https://openjdk.org/jeps/142' },
  ]
},
{
  id: 'concurrency-046',
  topic: 'concurrency',
  level: 'senior',
  q: '{{VarHandle}} là gì, có các chế độ truy cập bộ nhớ nào, và dùng khi nào thay cho {{Unsafe}} hay các lớp {{java.util.concurrent.atomic}}?',
  a: `**Tóm tắt:** {{VarHandle}} (Java 9+) là cách chính thức thay {{sun.misc.Unsafe}} để đọc, ghi và so sánh-thay (CAS) trực tiếp trường của object, đồng thời kiểm soát thứ tự bộ nhớ. Có các chế độ truy cập: volatile (ghi và đọc đều tạo quan hệ happens-before), release/acquire (chỉ một chiều, rẻ hơn volatile), opaque (không ordering), và các rào bộ nhớ fullFence/loadFence/storeFence. Dùng khi cần CAS trực tiếp trên trường hoặc muốn thứ tự bộ nhớ tuỳ chỉnh với chi phí thấp hơn volatile; phần lớn code nghiệp vụ vẫn nên dùng {{AtomicInteger}} hay {{ConcurrentHashMap}} thay vì tự viết VarHandle.

### Hiểu nhanh
Hãy tưởng tượng mỗi trường của object là một ô giấy trong bảng ghi công ty. {{AtomicInteger}} giống một ô đã được sản xuất sẵn với quy tắc cố định (chỉ cộng, chỉ lấy giá trị mới nhất...). {{VarHandle}} giống bộ đèn soi và bút viết trực tiếp vào ô giấy: bạn có thể đọc ô, ghi ô, hoặc "nếu ô vẫn là giá trị A thì ghi giá trị B" — và bạn quy định xem việc ghi này phải đẩy công việc trước đó ra hay không, tương đương đưa tin cho thread khác theo quy tắc bạn chọn.

### Thuật ngữ
- **VarHandle**: đối tượng trong java.lang.invoke thay Unsafe, thao tác trực tiếp vào trường object với chế độ truy cập chọn được.
- **Access mode (chế độ truy cập)**: quy tắc thứ tự bộ nhớ kèm mỗi thao tác đọc/ghi/CAS.
- **Happens-before**: nếu A happens-before B thì B chắc chắn thấy mọi thứ A đã ghi.
- **Reordering (xếp lại lệnh)**: compiler, JIT hay CPU đổi thứ tự lệnh để nhanh hơn, miễn là trong một thread kết quả không đổi.
- **Store buffer / invalidate queue**: bộ đệm của CPU core khi ghi và danh sách thông báo bản cache cũ phải hủy — lý do vì sao ghi ở core này có thể chưa thấy ở core kia.
- **Fence / rào bộ nhớ**: lệnh cấm processor đổi thứ tự qua lại rào này.
- **Unsafe**: class nội bộ JDK, truy cập memory không an toàn, bị giới hạn truy cập từ JDK 9+, VarHandle là thay thế công khai.
- **CAS (compare-and-swap)**: lệnh CPU "ghi giá trị mới nếu giá trị hiện tại vẫn như đã đọc", nguyên tử mà không khoá.

### Các chế độ truy cập và khi nào dùng
VarHandle cung cấp ba nhóm phương thức cho mỗi trường:

1. **volatile mode** ({{getVolatile}}/{{setVolatile}}/{{compareAndSet}} volatile): ghi release, đọc acquire, tạo happens-before hai chiều. Tương đương trường {{volatile}}.
2. **release/acquire mode** ({{setRelease}}/{{getAcquire}}): ghi release đảm bảo mọi ghi trước đó đã đẩy ra khi bước này hoàn thành; đọc acquire đảm bảo mọi đọc sau này thấy bản mới nhất. Chỉ một chiều, rẻ hơn volatile trên một số kiến trúc, phù hợp cho cờ "dữ liệu đã xong, có thể đọc".
3. **opaque mode** ({{getOpaque}}/{{setOpaque}}): không có ordering, chỉ đảm bảo nguyên tử. Dùng cho bộ đếm thống kê không quan trọng thứ tự.
4. **Rào bộ nhớ**: {{fullFence()}} cấm đổi thứ tự ở cả hai bên; {{loadFence()}} cho các đọc trước; {{storeFence()}} cho các ghi trước. Rào đắt, chỉ dùng khi thực sự cần.

### Ví dụ: công bố cờ bằng release/acquire

~~~java
import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;

public class ReadyFlag {
    private static final VarHandle READY;
    private static final VarHandle VALUE;

    static {
        try {
            READY = MethodHandles.lookup()
                .findVarHandle(ReadyFlag.class, "ready", boolean.class);
            VALUE = MethodHandles.lookup()
                .findVarHandle(ReadyFlag.class, "value", int.class);
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    private boolean ready;
    private int value;

    public void publish(int v) {
        VALUE.setOpaque(v);           // ghi dữ liệu trước
        READY.setRelease(true);       // bật cờ release: mọi ghi trước đã đẩy ra
    }

    public boolean tryRead(int[] out) {
        if ((boolean) READY.getAcquire()) {   // đọc acquire: thấy ready => chắc chắn thấy value mới
            out[0] = (int) VALUE.getOpaque();
            return true;
        }
        return false;
    }
}
~~~
Lý do: ghi {{VALUE}} trước, bật cờ {{READY}} sau bằng setRelease. Thread đọc thấy {{READY}} bằng getAcquire thì chắc chắn đã thấy {{VALUE}}. Nếu dùng trường thường (không VarHandle, không volatile), JIT/CPU có thể xếp lại: thread đọc thấy cờ bật nhưng value vẫn là giá trị cũ.

### Bảng so sánh chế độ

| Chế độ | Ví dụ method | Tạo happens-before? | Chi phí | Dùng khi |
|---|---|---|---|---|
| volatile | setVolatile/getVolatile | Có, hai chiều | Cao nhất | Cờ dừng, publish object |
| release/acquire | setRelease/getAcquire | Có, một chiều | Thấp hơn volatile | Cờ "dữ liệu đã sẵn sàng" |
| opaque | setOpaque/getOpaque | Không | Thấp nhất | Bộ đếm thống kê, không quan tâm thứ tự |

### Trên production
- Hiếm khi cần VarHandle trong code nghiệp vụ: các lớp java.util.concurrent đã vận dụng đúng và được tối ưu bởi JVM.
- Nếu tự viết cấu trúc lock-free, hãy đo bằng async-profiler/JMH và chỉ dùng VarHandle khi bằng chứng thấy volatile/class atomic là nút thắt.
- {{sun.misc.Unsafe}} vẫn có thể dùng qua reflection nhưng bị cảnh báo và có thể bị chặn trong moduleization; VarHandle là cách được khuyến khích.

### Lỗi hay gặp
- **Nhầm getAcquire với getVolatile**: getAcquire chỉ đảm bảo thứ tự với các ghi release trước đó, không phải tất cả ghi trước đó trong thread khác. Cách tránh: ghi dữ liệu bằng setRelease trước khi bật cờ.
- **Dùng opaque cho cờ điều khiển**: opaque không ordering, thread đọc có thể thấy cờ mới nhưng dữ liệu cũ. Cách tránh: release/acquire hoặc volatile.
- **Quên rằng VarHandle không tự khởi tạo**: phải qua {{MethodHandles.lookup().findVarHandle(...)}} và ném checked exception trong static block.

### Trả lời phỏng vấn 1 phút
"VarHandle là cách công khai thay Unsafe để thao tác trực tiếp trường object, với các chế độ truy cập chọn được thứ tự bộ nhớ: volatile (ghi-đọc đều happens-before), release/acquire (chỉ một chiều, rẻ hơn), opaque (không ordering), và các rào bộ nhớ fullFence/loadFence/storeFence. Tôi dùng release/acquire cho mẫu 'ghi dữ liệu rồi bật cờ' để thread đọc thấy cờ mới thì chắc chắn thấy dữ liệu mới, chi phí thấp hơn volatile. Phần lớn thời gian tôi vẫn dùng AtomicInteger/ConcurrentHashMap, chỉ dùng VarHandle khi cần CAS trực tiếp trên trường hoặc đã đo thấy volatile là nút thắt."

> Senior tip: VarHandle không làm ma thuật — nó chỉ biểu lộ rõ ràng những gì JMM cho phép. Khi phỏng vấn hỏi "volatile vs release/acquire khác nhau thế nào", câu trả lời chuẩn: volatile tạo happens-before hai chiều (ghi release + đọc acquire) nên đắt hơn trên một số kiến trúc; release/acquire chỉ một chiều và đủ cho mẫu publisher/subscriber cờ. Hãy trả lời với ví dụ cụ thể và kèm lời khuyên "đo trước khi tối ưu".`,
  follow: [
    'Vì sao release/acquire rẻ hơn volatile trên một số kiến trúc CPU?',
    'VarHandle.compareAndSet khác AtomicInteger.compareAndSet ở điểm nào?',
    'Khi nào bạn chọn VarHandle thay cho các lớp java.util.concurrent.atomic?'
  ],
  tags: ['VarHandle', 'memory ordering', 'Unsafe', 'CAS', 'volatile'],
  refs: [
    { type: 'doc', title: 'VarHandle API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/VarHandle.html' }
  ]
},
{
  id: 'concurrency-047',
  topic: 'concurrency',
  level: 'senior',
  q: '{{ConcurrentSkipListMap}} hoạt động bên trong ra sao: cấu trúc skip list, các level, vì sao không cần khoá toàn bảng, và iterator của nó "yếu" là gì?',
  a: `**Tóm tắt:** {{ConcurrentSkipListMap}} là bản đồ có thứ tự, an toàn luồng, không khoá toàn bảng. Bên trong là skip list: mỗi node nằm trên nhiều lớp (level), lớp cao hơn chứa ít node hơn để "nhảy" nhanh. Việc chèn/xóa dùng CAS trên các liên kết node theo từng lớp, nên nhiều thread có thể làm việc trên vùng khác nhau đồng thời. Iterator là **yếu (weakly consistent)**: không ném ConcurrentModificationException, có thể thấy hoặc không thấy sự thay đổi sau khi tạo iterator, nhưng không bỏ qua phần tử đã đến được.

### Hiểu nhanh
Skip list giống một thang thép bên ngoài tòa nhà: lầu thường chạy từ trệt đến từng lầu (chậm), thang thép nhảy qua vài tầng một lần (nhanh). ConcurrentSkipListMap giữ nhiều "thang" này, mỗi node có thể xuất hiện ở một vài thang. Khi tìm khóa, bạn bắt đầu từ thang cao nhất, nhảy tới khi khóa lớn hơn mục tiêu, rồi xuống thang thấp hơn. Nhiều thread cùng tìm hoặc chèn ở vùng khác nhau không cần khoá chung vì mỗi liên kết node được cập nhật bằng CAS.

### Thuật ngữ
- **Skip list**: cấu trúc dữ liệu có nhiều lớp liên kết, lớp cao giúp bỏ qua nhiều phần tử, tìm kiếm O(log n) trung bình.
- **Node / liên kết (link)**: mỗi phần tử giữ mảng tham chiếu tới node tiếp theo ở từng lớp.
- **CAS**: so sánh-thay nguyên tử, cập nhật liên kết nếu vẫn như đã đọc.
- **Weakly consistent iterator**: iterator không khoá, phản ánh trạng thái tại thời điểm tạo hoặc sau đó, không ném lỗi khi map thay đổi.
- **ConcurrentModificationException**: lỗi các collection đơn luồng ném khi cấu trúc thay đổi trong khi duyệt.
- **Khoá toàn bảng (global lock)**: một khoá bảo vệ toàn bộ map, chỉ một thread thao tác tại một thời điểm — dễ bị nút thắt.

### Hoạt động từng bước

Tìm khóa:
1. Bắt đầu tại node sentinel (đầu), lớp cao nhất.
2. Di chuyển qua liên kết cùng lớp trong khi khóa node tiếp theo <= khóa tìm.
3. Khi khóa tiếp theo lớn, xuống một lớp, lặp lại cho tới lớp 0.
4. Node ở lớp 0 sau vị trí cuối cùng là kết quả (hoặc không tồn tại).

Chèn:
1. Tìm vị trí chèn ở mỗi lớp, lưu các node predecessors.
2. Random quyết định số lớp cho node mới (xấp xỉ 50% node lên một lớp, càng cao càng ít).
3. Dùng CAS cập nhật liên kết từ lớp cao nhất xuống lớp 0; nếu CAS thất bại (thread khác vừa thay đổi) thì đọc lại predecessors và thử lại.

Xóa: tương tự chèn, đánh dấu node bị xóa rồi CAS bỏ qua liên kết.

### Ví dụ code

~~~java
import java.util.concurrent.ConcurrentSkipListMap;

public class SkipListDemo {
    public static void main(String[] args) {
        ConcurrentSkipListMap<Integer, String> map = new ConcurrentSkipListMap<>();
        map.put(5, "lua");          // tự giữ thứ tự: 3, 5, 9 ...
        map.put(3, "ba");
        map.put(9, "chin");
        System.out.println(map.get(5));              // lua, O(log n)
        System.out.println(map.subMap(4, true, 8, false)); // [5=>lua], xem khoảng không khoá toàn bảng
        map.forEach((k, v) -> System.out.println(k + "=" + v));
    }
}
~~~

### Khi nào dùng / không dùng

| | ConcurrentSkipListMap | ConcurrentHashMap |
|---|---|---|
| Thứ tự | Có (theo khóa) | Không |
| Truy xuất khóa | O(log n) | O(1) trung bình |
| Khoá | Không khoá toàn bảng, CAS theo liên kết | CAS bin rỗng, synchronized node đầu |
| Dùng khi | Cần duyệt khoảng, theo thứ tự | Chỉ cần tra cứu, ghi nhiều |

### Trên production
- Dùng khi cần truy xuất theo khoảng (tìm tất cả đơn hàng từ mã A đến B) mà vẫn cho nhiều thread ghi.
- Iterator yếu: nếu cần ảnh chụp cố định, hãy copy sang danh sách khác trước khi xử lý dài.
- Đo ghi: skip list có nhiều liên kết nên tốn bộ nhớ hơn HashMap, mỗi node giữ mảng tham chiếu theo số lớp.

### Lỗi hay gặp
- **Fallback comparator null**: khóa không thể so sánh (không implements Comparable và không truyền Comparator) thì ném NullPointerException khi chèn phần tử thứ hai. Cách tránh: luôn dùng Comparable hoặc truyền Comparator.
- **Tưởng iterator xem mọi thay đổi**: iterator yếu có thể bỏ qua phần tử xóa sau khi tạo hoặc thấy phần tử mới thêm. Cách tránh: không dựa vào iterator để thống kê chính xác, hoặc snapshot trước.
- **Ghi nhiều vào cùng vùng**: nhiều thread chèn khóa gần nhau vẫn tranh chấp liên kết node, throughput giảm. Cách tránh: chia khóa sao cho phân tán.

### Trả lời phỏng vấn 1 phút
"ConcurrentSkipListMap là bản đồ có thứ tự an toàn luồng, không khoá toàn bảng. Bên trong là skip list: mỗi node nằm trên một vài lớp, lớp cao giúp nhảy qua nhiều phần tử để tìm O(log n). Chèn/xóa cập nhật liên kết bằng CAS theo từng lớp, nên nhiều thread làm việc vùng khác nhau không chặn nhau. Iterator là yếu: không ném ConcurrentModificationException, có thể thấy hay không thấy thay đổi sau khi tạo, nhưng không bỏ qua phần tử đã đến. Tôi dùng khi cần duyệt khoảng theo thứ tự khóa; nếu chỉ tra cứu thì ConcurrentHashMap nhanh hơn và nhẹ hơn."

> Senior tip: skip list trade-off là bộ nhớ: mỗi node giữ mảng tham chiếu theo số lớp (thống kê trung bình ít hơn 2 nhưng có thể cao), và random số lớp cần nguồn ngẫu nhiên an toàn luồng (ThreadLocalRandom). Khi cần bản đồ có thứ tự đồng thời ghi cao, đây là lựa chọn chính thức của JDK; nếu thứ tự không quan trọng, ConcurrentHashMap là đường lối đầu tiên.`,
  follow: [
    'Skip list giữ thứ tự O(log n) mà không khoá toàn bảng được nhờ cơ chế nào?',
    'Iterator yếu (weakly consistent) có thể bỏ qua phần tử mới thêm hay không, và lý do?',
    'ConcurrentSkipListMap vs ConcurrentHashMap: chọn cái nào khi nào?'
  ],
  tags: ['ConcurrentSkipListMap', 'skip list', 'CAS', 'iterator'],
  refs: [
    { type: 'doc', title: 'ConcurrentSkipListMap API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentSkipListMap.html' }
  ]
},
{
  id: 'concurrency-048',
  topic: 'concurrency',
  level: 'senior',
  q: '{{CopyOnWriteArrayList}} hoạt động thế nào: đọc không khoá, ghi sao chép toàn bộ mảng, iterator xem ảnh chụp, và dùng cho trường hợp nào?',
  a: `**Tóm tắt:** {{CopyOnWriteArrayList}} là danh sách an toàn luồng mà **đọc hoàn toàn không khoá**: mỗi lần đọc lấy một tham chiếu tới mảng nội bộ (không bao giờ thay đổi sau khi tạo). Ghi (thêm/xóa/cập nhật) khoá toàn danh sách, sao chép toàn bộ mảng, sửa bản sao, rồi trỏ tham chiếu nội bộ tới bản mới. Iterator giữ tham chiếu mảng tại thời điểm tạo → xem **ảnh chụp (snapshot)**, không thấy thay đổi sau đó và không ném ConcurrentModificationException. Dùng cho danh sách đọc nhiều, ghi hiếm, ví dụ danh sách listener/subscriber.

### Hiểu nhanh
Giống một bảng thông báo trên tường. Ai muốn xem thì chỉ cần nhìn bảng đang lắp — không cần xin phép ai (đọc không khoá). Ai muốn sửa thì phải dán bảng vào tường khác, viết nội dung mới, rồi tháo bảng cũ ra lắp bảng mới; trong lúc đó mọi người vẫn xem bảng cũ bình thường. Mỗi người lấy một "bản sao" của bảng khi bắt đầu xem, nên sau này bảng trên tường thay đổi thì bản tay họ vẫn giữ nguyên nội dung lúc đầu.

### Thuật ngữ
- **Copy-on-write**: ghi bằng cách sao chép toàn bộ cấu trúc, sửa bản sao, rồi thay tham chiếu; đọc luôn thấy một bản nhất quán mà không khoá.
- **Snapshot iterator**: iterator giữ tham chiếu mảng tại thời điểm tạo, nội dung không đổi trong suốt vòng đời iterator.
- **ReentrantLock**: khoá dùng để bảo vệ hành động ghi, chỉ một thread ghi tại một thời điểm.
- **ConcurrentModificationException**: lỗi collection đơn luồng ném khi cấu trúc thay đổi trong khi duyệt.
- **Tham chiếu mảng**: mảng trong Java là object, gán tham chiếu là thao tác nguyên tử (tham chiếu object là át chủ thể).

### Hoạt động từng bước

Đọc (get/size/iterator):
1. Lấy tham chiếu mảng nội bộ (array) — tham chiếu object đọc nguyên tử, không khoá.
2. Truy cập phần tử tại chỉ số trên mảng đó. Mảng không bao giờ được sửa chỗ nên thấy giá trị nhất quán.

Ghi (add/set/remove):
1. Lấy khoá ReentrantLock (chỉ một thread ghi).
2. Đọc mảng hiện tại, sao chép ra mảng mới (dùng Arrays.copyOf), sửa bản sao.
3. Gán tham chiếu nội bộ = mảng mới (tham chiếu object ghi nguyên tử).
4. Nhả khoá. Đọc cũ vẫn thấy mảng cũ, đọc mới thấy mảng mới.

Iterator:
1. Lấy tham chiếu mảng tại thời điểm tạo iterator.
2. Duyệt trên mảng đó; mảng không bao giờ thay đổi nên iterator không bao giờ invalid.

### Ví dụ code

~~~java
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Iterator;

public class ListenerListDemo {
    private final CopyOnWriteArrayList<Runnable> listeners = new CopyOnWriteArrayList<>();

    public void addListener(Runnable l) {
        listeners.add(l);               // sao chép mảng, có khoá
    }

    public void notifyAllListeners() {
        for (Runnable l : listeners) {  // iterator snapshot, không khoá
            l.run();                    // nếu listener tự unregister trong khi chạy, iterator vẫn duyệt xong bản snapshot
        }
    }
}
~~~

### Khi nào dùng / không dùng

| | CopyOnWriteArrayList | ArrayList (đơn luồng) | ConcurrentHashMap + danh sách |
|---|---|---|---|
| Đọc | Không khoá, rất nhanh | Không khoá, nhanh | Không khoá |
| Ghi | Sao chép toàn bộ mảng, chậm | Không an toàn luồng | Không áp dụng |
| Iterator | Snapshot, không lỗi | Lỗi nếu thay đổi | Phụ thuộc |
| Dùng khi | Danh sách listener, đọc áp đảo | Đơn luồng | Cập nhật thường xuyên |

### Trên production
- Dùng cho danh sách callback/listener: đọc rất nhiều (gọi listener mỗi sự kiện), ghi hiếm (đăng ký/hủy listener khi khởi động/thay đổi cấu hình).
- Không dùng cho danh sách lớn ghi thường xuyên: mỗi ghi sao chép mảng cả ngàn phần tử tốn CPU và GC.
- Iterator snapshot: nếu listener thêm listener khác trong khi đang thông báo, listener mới không được gọi trong chu kỳ này (không thấy trong snapshot) — thường là mong muốn, tránh đệ quy vô hạn.

### Lỗi hay gặp
- **T tưởng iterator thấy danh sách mới nhất**: iterator giữ ảnh chụp cũ, phần tử thêm sau tạo iterator không được duyệt. Cách tránh: nếu cần thấy mới nhất, lấy iterator mới hoặc dùng cấu trúc khác.
- **Ghi nhiều liên tục**: mỗi add/set/remove sao chép toàn bộ mảng, latency tăng theo kích thước danh sách. Cách tránh: điều tiết ghi, hoặc dùng ConcurrentLinkedQueue nếu thứ tự không quan trọng.
- **Giữ tham chiếu iterator lâu**: iterator không invalid nhưng nội dung cũ; code sau này giả định iterator phản ánh trạng thái hiện tại sẽ bị sai. Cách tránh: tạo iterator gần lúc sử dụng.

### Trả lời phỏng vấn 1 phút
"CopyOnWriteArrayList là danh sách đọc không khoá: mỗi đọc lấy tham chiếu mảng nội bộ và mảng không bao giờ bị sửa chỗ, nên đọc nhất quán và rất nhanh. Ghi khoá toàn danh sách, sao chép toàn bộ mảng, sửa bản sao rồi trỏ tham chiếu tới bản mới. Iterator giữ ảnh chụp mảng tại thời điểm tạo, không thấy thay đổi sau đó, không ném ConcurrentModificationException. Trade-off là đọc nhanh, ghi chậm (sao chép toàn bộ mảng), nên dùng cho danh sách listener/subscriber đọc nhiều ghi hiếm, không dùng cho danh sách lớn ghi thường xuyên."

> Senior tip: mẫu thiết kế này gọi là "phát hành bản mới thay vì sửa chỗ" — giống công bố cấu hình bằng object bất biến. Trong Spring, danh sách event listener hay các callback cấu hình là nơi CopyOnWriteArrayList hợp lý; nếu danh sách có mấy nghìn phần tử và ghi mỗi giây, hãy nghĩ lại vì mỗi ghi sao chép mảng cả ngàn phần tử, gây spike CPU và GC.`,
  follow: [
    'Vì sao đọc CopyOnWriteArrayList không cần khoá mà vẫn an toàn?',
    'Iterator của nó xem ảnh chụp (snapshot) hay trạng thái hiện tại?',
    'Không nên dùng CopyOnWriteArrayList cho trường hợp nào?'
  ],
  tags: ['CopyOnWriteArrayList', 'copy-on-write', 'snapshot', 'listener'],
  refs: [
    { type: 'doc', title: 'CopyOnWriteArrayList API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html' }
  ]
},
{
  id: 'concurrency-049',
  topic: 'concurrency',
  level: 'senior',
  q: '{{SynchronousQueue}} là hàng đợi không đệm: hai thread giao handoff trực tiếp, chính sách công bằng (fair) khác không công bằng ở đâu, và dùng trong trường hợp nào?',
  a: `**Tóm tắt:** {{SynchronousQueue}} là hàng đợi sức chứa 0: không chứa phần tử nào, mỗi lần put phải đợi một take (hoặc ngược lại) để giao handoff trực tiếp. Có hai chính sách: không công bằng (non-fair, mặc định) — thread đến sau có thể lấy phần tử ngay trước thread đã chờ lâu; và công bằng (fair) — theo thứ tự FIFO. Dùng khi producer và consumer cần xử lý cặp ngay (handoff), ví dụ ThreadPoolExecutor cached pool tạo thread mới cho mỗi task thay vì xếp hàng.

### Hiểu nhanh
Giống hai người giao hàng trực tiếp tại cửa hàng: người A mang hàng tới, người B lấy hàng ngay, không có kệ chứa hàng ở giữa. A không thể bỏ hàng trên kệ mà đi; B không thể lấy hàng nếu không có ai mang tới. Cả hai phải gặp nhau cùng lúc. "Công bằng" giống máy lấy số tại quầy: ai đến trước lấy số trước. "Không công bằng" giống ai tới lượt quầy trống trước được phục vụ trước, kể cả người sau đến hơn.

### Thuật ngữ
- **Handoff (giao trực tiếp)**: producer và consumer bắt tay, phần tử không nằm trong hàng đợi thậm chí một ngáf thời gian.
- **Sức chứa 0 (capacity 0)**: hàng đợi không chứa phần tử, put/take phải khớp cặp.
- **Transfer (chuyển giao)**: phương thức nội bộ của SynchronousQueue thực hiện handoff, có thể chờ vô hạn hoặc có timeout.
- **Chính sách công bằng (fair)**: handoff theo thứ tự thread gọi đến (FIFO).
- **Chính sách không công bằng (non-fair)**: thread đang chạy trên CPU có thể chen ngang lấy handoff trước thread đã chờ.
- **Exchanger**: tương tự nhưng hai người trao đổi đối tượng hai chiều; SynchronousQueue chỉ một chiều (producer đưa, consumer lấy).

### Hoạt động từng bước

Không công bằng (mặc định, dùng transfer stack kiểu LIFO):
1. Producer gọi put(x): nếu có consumer đang chờ → giao x ngay, cả hai tiếp tục.
2. Nếu không có consumer: producer đẩy yêu cầu vào stack (LIFO) và chờ.
3. Consumer gọi take(): nếu stack có yêu cầu → lấy yêu cầu mới nhất (LIFO), giao hàng.
4. Nếu stack trống: consumer đưa yêu cầu vào stack và chờ.
5. Khi một bên đến, khớp cặp ngay; thread chờ được đánh thức.

Công bằng (new SynchronousQueue(true)):
1. Mọi yêu cầu chờ vào hàng đợi FIFO (LinkedTransferQueue-like fair queue).
2. Handoff theo thứ tự đến, thread đã chờ lâu được ưu tiên.

### Ví dụ code

~~~java
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HandoffDemo {
    private static final SynchronousQueue<String> queue = new SynchronousQueue<>();

    public static void main(String[] args) throws InterruptedException {
        Thread producer = new Thread(() -> {
            try { queue.put("order-123"); System.out.println("đã giao"); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try { System.out.println("nhận: " + queue.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start(); consumer.start();
        producer.join(); consumer.join();
    }

    // SynchronousQueue dùng trong Executors.newCachedThreadPool():
    // mỗi task không có thread rảnh => tạo thread mới (SynchronousQueue không chứa)
}
~~~

### Khi nào dùng / không dùng

| | SynchronousQueue | ArrayBlockingQueue | LinkedBlockingQueue |
|---|---|---|---|
| Chứa phần tử | Không (0) | Có (bounded) | Có (bounded/vô hạn) |
| Producer khi không có consumer | Chờ handoff | Chờ hoặc xếp hàng | Xếp hàng |
| Dùng khi | Cần xử lý ngay, tạo thread theo request | Giới hạn số chờ | Xếp hàng Aufgabe |
| Ví dụ JDK | Executors.newCachedThreadPool | ThreadPoolExecutor tùy chỉnh | newFixedThreadPool (mặc định) |

### Trên production
- Executors.newCachedThreadPool dùng SynchronousQueue: mỗi task cần chạy ngay, nếu không có thread rảnh thì tạo thread mới (tối đa Integer.MAX_VALUE) — nên chỉ dùng cho task ngắn, không burst vô hạn, sẵn sàng OOM native thread.
- Dùng khi producer và consumer xử lý cùng nhịp (ví dụ worker nhận job từ feeder ngay khi feeder xong chuẩn bị).
- Không dùng khi cần đệm burst: không chở được phần tử, burst sẽ làm caller chờ ngay.

### Lỗi hay gặp
- **Tưởng SynchronousQueue "lưu" được task**: put sẽ chãi mãi nếu không có consumer, thread caller treo. Cách tránh: dùng offer(timeout) hoặc ArrayBlockingQueue nếu cần đệm.
- **Dùng newCachedThreadPool burst lớn**: mỗi task tạo thread, dễ OOM "unable to create native thread". Cách tránh: dùng ThreadPoolExecutor bounded hoặc virtual thread + semaphore.
- **Fair queue tốn hơn**: công bằng phải duy trì hàng FIFO và đánh thức đúng thread, throughput thấp hơn non-fair khi tranh chấp cao. Cách tránh: chỉ bật fair khi thấy starvation rõ rệt.

### Trả lời phỏng vấn 1 phút
"SynchronousQueue là hàng đợi không chứa phần tử nào: mỗi put phải khớp với một take để giao handoff trực tiếp, producer và consumer gặp nhau cùng lúc. Có hai chính sách: không công bằng (mặc định, LIFO, thread mới có thể chen trước) và công bằng (FIFO, theo thứ tự chờ). JDK dùng nó trong Executors.newCachedThreadPool để mỗi task tạo thread mới khi không có thread rảnh. Trade-off là không đệm burst, nên chỉ dùng khi producer/consumer xử lý cùng nhịp và task ngắn; burst lớn làm caller chờ hoặc tạo quá nhiều thread."

> Senior tip: SynchronousQueue không phải "hàng đợi nhanh" trong mọi trường hợp — nó chặn producer cho đến khi consumer sẵn sàng, nên latency của producer = thời gian consumer xử lý task trước. Dùng khi bạn muốn backpressure ép người gửi chờ ngay, không phải để "tách" producer ra khỏi consumer.`,
  follow: [
    'SynchronousQueue không công bằng và công bằng khác nhau ở cấu trúc bên trong thế nào?',
    'Vì sao Executors.newCachedThreadPool dùng SynchronousQueue và rủi ro là gì?',
    'Khi nào chọn SynchronousQueue thay cho ArrayBlockingQueue?'
  ],
  tags: ['SynchronousQueue', 'handoff', 'bounded queue', 'cached thread pool'],
  refs: [
    { type: 'doc', title: 'SynchronousQueue API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/SynchronousQueue.html' }
  ]
},
{
  id: 'concurrency-050',
  topic: 'concurrency',
  level: 'senior',
  q: '{{ExecutorCompletionService}} (CompletionService) là gì: gửi N task, lấy kết quả ngay khi có task xong, fail-fast hay wait-all, và khác CompletableFuture.allOf ở điểm nào?',
  a: `**Tóm tắt:** {{ExecutorCompletionService}} gói một Executor và một hàng đợi hoàn thành: gửi N task, sau đó gọi take()/poll() để lấy Future của task nào xong trước thì lấy nó trước, không cần đợi toàn bộ. Dùng cho mẫu "lấy N kết quả đầu tiên" hoặc "fail-fast: task nào lỗi đầu tiên thì dừng". Không phải wait-all (không đợi tất cả xong mới trả) và khác CompletableFuture.allOf (allOf đợi tất cả, CompletableFuture.compose ghép chuỗi). Nội dung internals: mỗi task được bọc thành FutureTask, khi xong thì put Future vào completion queue.

### Hiểu nhanh
Giống một quán ăn có 5 đầu bếp nấu 5 món khác nhau, và một người gọi món lấy món nào xong trước thì mang ra khách trước. Không phải đợi tất cả 5 món xong mới bắt đầu giao (do đó khách nhận món đầu nhanh hơn), và không phải món nào nấu lỗi thì toàn bộ đơn bị hủy (trừ khi bạn tự quyết định hủy). ExecutorCompletionService là cái kệ "đã xong" ở đầu bếp: đầu bếp xong món thì đặt Future lên kệ, nhân viên lấy từ kệ theo thứ tự xong.

### Thuật ngữ
- **CompletionService**: giao diện lấy kết quả task khi nào xong thì lấy nó (take/poll).
- **ExecutorCompletionService**: triển khai gói Executor + BlockingQueue<Future> làm hàng hoàn thành.
- **FutureTask**: Future chạy được, khi task xong thì đặt kết quả vào Future.
- **Take/poll**: take chãi mãi cho tới khi có task xong; poll trả về ngay null nếu chưa có.
- **Fail-fast**: dừng xử lý khi có lỗi đầu tiên thay vì chờ hết.
- **Wait-all**: đợi tất cả task xong mới xử lý (như CompletableFuture.allOf).

### Hoạt động từng bước

1. Tạo ExecutorCompletionService(executor).
2. submit(task1)...submit(taskN): mỗi task được bọc trong FutureTask, gửi executor chạy, và FutureTask được đăng ký để khi xong thì put vào hàng hoàn thành.
3. take(): lấy Future của task nào xong trước. Nếu chưa có task xong, chãi mãi.
4. future.get(): lấy kết quả (hoặc ném ExecutionException nếu task lỗi).
5. Lặp take() N lần để thu thập tất cả kết quả.

### Ví dụ code

~~~java
import java.util.concurrent.*;
import java.util.*;

public class CompletionServiceDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        ExecutorCompletionService<Integer> ecs = new ExecutorCompletionService<>(executor);

        List<Integer> ids = List.of(101, 102, 103, 104);
        for (int id : ids) {
            int taskId = id;
            ecs.submit(() -> process(taskId));   // mỗi task bọc FutureTask
        }

        // Lấy kết quả ngay khi có task xong (không đợi toàn bộ)
        for (int i = 0; i < ids.size(); i++) {
            Future<Integer> f = ecs.take();      // task nào xong trước, lấy nó trước
            try {
                System.out.println("xong: " + f.get());
            } catch (ExecutionException e) {
                System.err.println("task lỗi: " + e.getCause());
            }
        }
        executor.shutdown();
    }

    static int process(int id) {
        // giả lập công việc khác nhau
        return id * 10;
    }
}
~~~

### Fail-fast vs wait-all

- **Fail-fast**: submit N task, vòng lặp take() + get(); task đầu tiên lỗi ném ExecutionException ngay — bạn có thể hủy các task còn lại (future.cancel(true)) nếu không cần. Phù hợp "tìm kết quả đầu tiên thành công".
- **Wait-all**: gọi take() N lần, thu thập tất cả (thành công và lỗi), xử lý sau. Phù hợp cần toàn bộ kết quả để tổng hợp.

### So sánh CompletableFuture.allOf

| | ExecutorCompletionService | CompletableFuture.allOf |
|---|---|---|
| Lấy kết quả | Khi nào xong thì lấy đó (take) | Đợi tất cả xong |
| Lỗi | Task lỗi ném tại get() của Future đó | allOf hoàn tất bất thường nếu bất kỳ task nào lỗi |
| Ghi nhận sớm | Có, xử lý từng task khi xong | Không, phải đợi hết |
| Dùng khi | "N đầu tiên", fail-fast | Tổng hợp sau khi tất cả xong |
| Chuỗi bước | Không hỗ trợ compose tự nhiên | Hỗ trợ thenApply/thenCompose |

### Trên production
- Dùng cho fan-out gọi nhiều dịch vụ, lấy kết quả đầu tiên đạt chất lượng (ví dụ gọi 3 cache server, lấy cái nào phản hồi trước).
- Luôn shutdown executor sau dùng; Future.get() nên có timeout để không treo nếu task treo.
- Take() chãi mãi: kết hợp với poll(timeout) hoặc kiểm tra số task còn lại để tránh treo vĩnh viễn nếu một task không bao giờ xong.

### Lỗi hay gặp
- **Gọi take() nhiều hơn số task đã submit**: take() chãi mãi vì không đủ Future trên hàng hoàn thành. Cách tránh: take đúng số lần đã submit, hoặc dùng poll(timeout).
- **Task lỗi mà không gọi get()**: exception nằm trong Future, không ai thấy, tương tự submit() mà không get(). Cách tránh: luôn get() mỗi Future lấy từ ecs.
- **Future.cancel(true) không dừng task nếu task không kiểm tra interrupt**: tương tự ExecutorService, task phải hợp tác với interrupt.

### Trả lời phỏng vấn 1 phút
"ExecutorCompletionService gói Executor với hàng đợi hoàn thành: submit N task, rồi take() lấy Future của task nào xong trước. Không phải đợi tất cả (wait-all), nên phù hợp lấy N kết quả đầu tiên hoặc fail-fast. Nên sai khác CompletableFuture.allOf — allOf đợi tất cả xong mới hoàn tất, còn CompletionService xử lý từng task khi xong. Lưu ý luôn get() mỗi Future để thấy lỗi, và take() phải đúng số lần submit để không treo mãi."

> Senior tip: nếu cần "task đầu tiên thành công thì hủy các task còn lại", hãy tự hủy các Future còn lại trong khối catch, vì ExecutorCompletionService không tự hủy. Và với CompletableFuture, allOf là sự lựa chọn gọn hơn khi tổng hợp nhiều call sau khi tất cả xong; CompletionService thắng khi muốn xử lý kịp thời từng kết quả.`,
  follow: [
    'ExecutorCompletionService khác CompletableFuture.allOf ở điểm nào?',
    'Vì sao phải gọi get() trên mỗi Future lấy từ CompletionService?',
    'take() chãi mãi — làm sao tránh treo nếu một task không bao giờ xong?'
  ],
  tags: ['ExecutorCompletionService', 'CompletionService', 'Future', 'fail-fast'],
  refs: [
    { type: 'doc', title: 'ExecutorCompletionService API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorCompletionService.html' }
  ]
},
{
  id: 'concurrency-051',
  topic: 'concurrency',
  level: 'lead',
  q: '{{Exchanger}} là gì: hai thread trao đổi dữ liệu trực tiếp qua exchange(), mô hình pipeline double-buffer, và khác BlockingQueue ở điểm nào?',
  a: `**Tóm tắt:** {{Exchanger}} là điểm hẹn hai bên: hai thread gọi exchange(v), mỗi bên nhận dữ liệu của bên kia, gọi là rendezvous (hẹn gặp). Dùng cho mô hình pipeline double-buffer: người viết điền vào bộ đệm A trong khi người đọc đọc B, sau khi xong hai bên gọi exchange để tráo bộ đệm — viết tiếp vào B, đọc tiếp vào A, không bao giờ chạm cùng một mảng cùng lúc. Không có bộ đệm trung gian, khác BlockingQueue (có hàng chờ, producer/consumer không nhất thiết gặp trực tiếp).

### Hiểu nhanh
Giống hai người ở hai đầu một cái hầm, mỗi người cầm một thùng rỗng. Họ cùng đi vào giữa hầm, tráo thùng: người A nhận thùng đầy của B, người B nhận thùng rỗng của A, rồi mỗi người đi về phía của mình. Không có gian hàng trung gian lưu thùng; hai bên phải ở đó cùng lúc. exchange() giống ý "tôi đến đây rồi, hãy tráo thùng".

### Thuật ngữ
- **Rendezvous (hẹn gặp)**: hai bên đều phải đến điểm hẹn thì sự kiện mới xảy ra; một bên đến trước phải chờ.
- **exchange(v)**: gửi đối tượng v đi, nhận đối tượng của bên kia về; chãi mãi cho tới khi có partner.
- **Double-buffer (bộ đệm kép)**: hai mảng luân phiên, một bên viết vào một mảng, bên kia đọc mảng kia, rồi tráo nhau.
- **BlockingQueue**: hàng đợi chứa phần tử, producer đưa vào, consumer lấy ra, không nhất thiết phải gặp trực tiếp.
- **Exchanger vs BlockingQueue**: Exchanger một chiều trao đổi hai chiều (hai bên đều nhận), BlockingQueue một chiều (producer đưa, consumer lấy) và có đệm.

### Hoạt động từng bước

1. Thread A gọi exchange(objA): nếu chưa có thread B → A chờ (đăng ký vào chỗ trống).
2. Thread B gọi exchange(objB): thấy A đang chờ → khớp cặp ngay: B nhận objA, A nhận objB, cả hai tiếp tục.
3. Nếu cả hai cùng gọi: whichever đến đăng ký trước, kia đến khớp.
4. Có timeout: exchange(v, timeout, unit) chãi tối đa thời gian, hết giờ ném TimeoutException.

### Ví dụ code: pipeline double-buffer

~~~java
import java.util.Arrays;
import java.util.concurrent.Exchanger;

public class DoubleBufferDemo {
    private static final Exchanger<char[]> exchanger = new Exchanger<>();
    private static final int SIZE = 8192;

    // Người viết: ghi vào buffer, rồi tráo với người đọc
    static void writer() throws InterruptedException {
        char[] buf = new char[SIZE];
        while (true) {
            fill(buf);                    // ghi vào buf của mình
            buf = exchanger.exchange(buf); // nhận buffer trống từ reader, trả buf đã đọc
        }
    }

    // Người đọc: xử lý buffer đã ghi, rồi tráo lại
    static void reader() throws InterruptedException {
        char[] buf = new char[SIZE];
        while (true) {
            buf = exchanger.exchange(buf); // nhận buffer đã ghi từ writer, trả buf trống
            process(buf);
        }
    }

    static void fill(char[] b) { Arrays.fill(b, 'x'); }
    static void process(char[] b) { /* xử lý dữ liệu */ }
}
~~~

### Khi nào dùng / không dùng

| | Exchanger | BlockingQueue | SynchronousQueue |
|---|---|---|---|
| Số bên | Hai bên (tùy chọn) | Nhiều producer/consumer | Hai bên handoff |
| Dữ liệu | Hai bên đều nhận | Producer đưa, consumer lấy | Producer đưa, consumer lấy |
| Đệm | Không | Có | Không |
| Dùng khi | Double-buffer pipeline | Xếp hàng task | Handoff đơn chiều |

### Trên production
- Dùng cho pipeline xử lý luồng dữ liệu lớn (ví dụ mã hóa/giải mã khối, nén, đọc file lớn): một thread đọc dữ liệu vào buffer, thread khác xử lý, exchange để tráo buffer, không copy dữ liệu giữa các thread.
- exchange() chãi mãi: nếu một bên treo, kia cũng treo. Dùng overload có timeout và xử lý TimeoutException.
- Exchanger không dùng cho nhiều hơn hai người gọi cùng lúc không xác định: kỳ vọng đúng hai bên khớp cặp.

### Lỗi hay gặp
- **Một bên gọi exchange nhiều lần, kia ít hơn**: bên gọi nhiều sẽ chãi mãi đợi partner. Cách tránh: thiết kế hai bên cuộn đồng bộ, hoặc dùng BlockingQueue nếu tốc độ khác nhau.
- **Quên trả buffer đúng**: sau exchange, mỗi bên nhận buffer của kia; nếu viết nhầm vào buffer cũ thì ghi đè dữ liệu đang được kia đọc → hỏng dữ liệu. Cách tránh: luôn dùng đối tượng nhận lại từ exchange().
- **exchange() không timeout**: nếu partner crash, bên kia treo vĩnh viễn. Cách tránh: exchange(v, timeout, unit).

### Trả lời phỏng vấn 1 phút
"Exchanger là điểm hẹn hai bên: gọi exchange(v) thì tôi gửi v đi và nhận đối tượng của partner về, cả hai phải đến điểm hẹn mới xảy ra. Mô hình điển hình là double-buffer pipeline: viết ghi vào buffer A, đọc xử lý buffer B, sau đó exchange tráo hai buffer, không copy dữ liệu và không chạm cùng mảng. Khác BlockingQueue: Exchanger không đệm, hai bên phải gặp trực tiếp, và cả hai đều nhận dữ liệu. Lưu ý luôn dùng đối tượng trả về từ exchange và dùng overload có timeout để không treo nếu partner lỗi."

> Senior tip: Exchanger ít dùng nhưng rất hiệu quả cho pipeline xử lý khối dữ liệu lớn nơi chi phí copy là nút thắt (ví dụ nén, mã hóa, đọc/ghi file lớn). Nếu hai bên tốc độ xử lý khác nhau rõ rệt, BlockingQueue là lựa chọn tốt hơn vì có đệm để hấp thụ độ chênh lệch; Exchanger bắt hai bên cùng nhịp.`,
  follow: [
    'Exchanger khác BlockingQueue ở điểm nào, và chọn cái nào khi nào?',
    'Vì sao phải dùng đối tượng trả về từ exchange() chứ không dùng buffer cũ?',
    'Một bên treo thì bên kia xảy ra gì, xử lý thế nào?'
  ],
  tags: ['Exchanger', 'rendezvous', 'double-buffer', 'pipeline'],
  refs: [
    { type: 'doc', title: 'Exchanger API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Exchanger.html' }
  ]
},
{
  id: 'concurrency-052',
  topic: 'concurrency',
  level: 'lead',
  q: '{{Phaser}} là điểm hẹn nhiều pha với số thành viên thay đổi: arrive/arriveAndAwaitAdvance, số pha, hook onAdvance, và khác CyclicBarrier ở điểm nào?',
  a: `**Tóm tắt:** {{Phaser}} là điểm hẹn linh hoạt: số thành viên có thể thay đổi giữa các pha (register/deregister), mỗi pha có số thứ tự, thread gọi arrive() để báo đã đến rồi có thể tiếp tục, hoặc arriveAndAwaitAdvance() để chờ đủ thành viên mới vào pha tiếp theo. Hook onAdvance() chạy khi đủ thành viên chuyển pha, dùng để quyết định tiếp tục hay kết thúc. Khác CyclicBarrier: số thành viên cố định, tất cả phải chờ ở mỗi điểm hẹn; Phaser cho phép thành viên chậm hơn, vào chậm, ra sớm, và pha tiếp tục cho những người đã đến.

### Hiểu nhanh
Giống một nhóm du lịch hẹn nhau ở mỗi điểm nghỉ: trong CyclicBarrier, tất cả đều phải đủ người tại điểm nghỉ mới cùng đi chặng tiếp theo, số người cố định. Trong Phaser, số người có thể tăng (kích thêm bạn bè trên đường) hoặc giảm (mẹo về nhà giữa chừng); mỗi người báo đã đến điểm nghỉ (arrive), người muốn cùng nhóm đi tiếp thì chờ đủ (arriveAndAwaitAdvance); tour guide (onAdvance) quyết định chặng tiếp theo có tiếp hay kết thúc tour.

### Thuật ngữ
- **Phaser**: điểm hẹn nhiều pha, số thành viên thay đổi được.
- **Party (thành viên)**: thread đã đăng ký tham gia phaser.
- **register()/register(int parties)**: đăng ký một hoặc nhiều thành viên.
- **arrive()**: báo đã đến điểm hẹn pha hiện tại, không chờ, tiếp tục làm việc khác.
- **arriveAndAwaitAdvance()**: báo đã đến và chờ đủ thành viên mới chuyển pha.
- **arriveAndDeregister()**: báo đến rồi rời khỏi phaser.
- **onAdvance(phase, registeredParties)**: hook chạy khi đủ thành viên chuyển pha; trả về true để kết thúc phaser.
- **Số pha (phase)**: số nguyên tăng mỗi khi đủ thành viên chuyển pha mới.

### Hoạt động từng bước

1. Tạo Phaser: new Phaser() (có 1 party là chính thread tạo) hoặc new Phaser(1).
2. Các worker register(): số party tăng.
3. Mỗi worker làm công việc pha 1, rồi arriveAndAwaitAdvance(): báo đến và chờ.
4. Khi đủ party báo đến → số pha tăng 1, onAdvance() chạy, tất cả worker được đánh thức sang pha 2.
5. Worker có thể register thêm (phía mới vào) hoặc arriveAndDeregister() (rời).
6. Phaser kết thúc khi onAdvance trả về true hoặc số party về 0.

### Ví dụ code

~~~java
import java.util.concurrent.Phaser;
import java.util.List;
import java.util.ArrayList;

public class PhaserDemo {
    public static void main(String[] args) throws InterruptedException {
        int parties = 3;
        Phaser phaser = new Phaser(1);  // 1 party là main thread

        List<Thread> workers = new ArrayList<>();
        for (int i = 0; i < parties; i++) {
            Thread t = new Thread(() -> {
                for (int phase = 0; phase < 3; phase++) {
                    doWork();                       // làm công việc pha này
                    phaser.arriveAndAwaitAdvance(); // chờ đủ người sang pha tiếp theo
                }
                phaser.arriveAndDeregister();       // xong, rời khỏi phaser
            });
            workers.add(t);
            t.start();
        }

        // main cũng tham gia mỗi pha (do tạo với 1 party)
        for (int phase = 0; phase < 3; phase++) {
            doWork();
            phaser.arriveAndAwaitAdvance();
        }
        phaser.arriveAndDeregister();

        for (Thread t : workers) t.join();
        System.out.println("Tất cả pha hoàn thành, pha cuối: " + phaser.getPhase());
    }

    static void doWork() { /* xử lý */ }
}
~~~

### Phaser vs CyclicBarrier

| | Phaser | CyclicBarrier |
|---|---|---|
| Số thành viên | Thay đổi được (register/deregister) | Cố định tại tạo |
| Hành vi khi đến | arrive() không chờ, arriveAndAwaitAdvance() chờ | Tất cả await() chờ |
| Pha | Có số thứ tự, onAdvance() hook | Không có số pha rõ ràng |
| Kết thúc | onAdvance trả true hoặc party = 0 | Reset cho pha sau |

### Khi nào dùng
- Pipeline nhiều giai đoạn, số worker thay đổi giữa các giai đoạn (ví dụ giai đoạn 1 có 5 worker, giai đoạn 2 chỉ cần 2 worker).
- Thành viên có thể vào chậm hoặc ra sớm mà không làm treo toàn bộ nhóm.
- Cần hook quyết định khi đủ thành viên chuyển pha (onAdvance).

### Trên production
- onAdvance có thể trả true để chấm dứt phaser (ví dụ đủ số lần lặp, hoặc nhận tín hiệu dừng).
- getPhase() cho biết pha hiện tại, dùng để theo dõi tiến độ.
- Nếu tất cả worker dùng arriveAndAwaitAdvance, một worker chậm làm toàn bộ nhóm chờ ở mỗi pha — giảm payload mỗi pha hoặc chia nhỏ công việc.

### Lỗi hay gặp
- **register() sau khi phaser kết thúc**: ném IllegalStateException. Cách tránh: kiểm tra isTerminated() trước khi register.
- **arrive() không chờ mà code giả định đã chuyển pha**: chỉ arriveAndAwaitAdvance() mới chờ. Cách tránh: dùng đúng method theo ý muốn.
- **Phaser không bao giờ kết thúc**: onAdvance luôn trả false và party không về 0 → thread chãi mãi. Cách tránh: thiết kế điều kiện kết thúc trong onAdvance.

### Trả lời phỏng vấn 1 phút
"Phaser là điểm hẹn nhiều pha cho phép số thành viên thay đổi: register() thêm thành viên, deregister() bỏ, arrive() báo đến không chờ, arriveAndAwaitAdvance() báo đến và chờ đủ thành viên chuyển pha, onAdvance() hook chạy khi đủ thành viên chuyển pha để quyết định tiếp tục hay kết thúc. Khác CyclicBarrier: số thành viên cố định và tất cả phải chờ; Phaser linh hoạt hơn, hợp cho pipeline nhiều giai đoạn với số worker thay đổi. Lưu ý arrive() không chờ, và phải thiết kế điều kiện kết thúc để phaser không treo mãi."

> Senior tip: Phaser mạnh nhưng phức tạp, phần lớn nhu cầu "đợi N công việc xong" dùng CountDownLatch, "nhóm chờ nhau mỗi pha" dùng CyclicBarrier. Chỉ dùng Phaser khi thực sự cần số thành viên thay đổi giữa các pha hoặc hook onAdvance để kiểm soát vòng đời; thêm phức tạp nghĩa là thêm chỗ bị hiểu sai trong code review.`,
  follow: [
    'Phaser khác CyclicBarrier ở điểm nào, và chọn cái nào khi nào?',
    'arrive() vs arriveAndAwaitAdvance(): chờ hay không chờ?',
    'Làm sao để phaser kết thúc thay vì chãi mãi?'
  ],
  tags: ['Phaser', 'barrier', 'multi-phase', 'synchronizer'],
  refs: [
    { type: 'doc', title: 'Phaser API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Phaser.html' }
  ]
},
{
  id: 'concurrency-053',
  topic: 'concurrency',
  level: 'lead',
  q: '{{ScheduledThreadPoolExecutor}} và {{DelayQueue}} hoạt động bên trong ra sao: tại sao scheduleAtFixedRate bị trễ chồng chéo khi một lần chạy lâu, và khác scheduleWithFixedDelay ra sao?',
  a: `**Tóm tắt:** {{ScheduledThreadPoolExecutor}} chạy task định kỳ bên trong {{DelayQueue}}: hàng đợi sắp xếp task theo thời gian chạy tiếp theo, worker lấy task khi đến giờ, chạy xong thì nếu là định kỳ thì chèn lại task vào queue với thời gian mới. scheduleAtFixedRate tính thời gian chạy tiếp theo từ **lần chạy trước được lên lịch** (bị trễ chồng chéo nếu một lần chạy lâu: các lần sau chạy sát nhau để bù); scheduleWithFixedDelay tính từ **khi lần trước kết thúc** (khoảng nghỉ cố định giữa các lần). Một lần chạy lâu chèn toàn bộ hàng đợi định kỳ.

### Hiểu nhanh
Giống một người đặt đồng hồ báo thức cho việc làm mỗi ngày: scheduleAtFixedRate đặt báo thức theo lịch (7 giờ sáng hôm nay, 7 giờ sáng ngày mai) — nếu hôm nay làm việc từ 7 giờ đến 9 giờ (lâu), ngày mai báo thức vẫn 7 giờ nên hai ngày chạy sát nhau để bù. scheduleWithFixedDelay đặt báo thức 24 giờ sau khi hôm nay xong việc (9 giờ hôm nay → 9 giờ ngày mai) — luôn có khoảng nghỉ giữa các lần. Cả hai dùng một cái "kệ đặt công việc theo giờ" (DelayQueue): công việc nào đến giờ thì lấy ra làm.

### Thuật ngữ
- **ScheduledThreadPoolExecutor**: executor chạy task sau trễ hoặc định kỳ, dùng ScheduledFutureTask.
- **DelayQueue**: hàng đợi sắp xếp theo thời điểm hết hạn (delay), take() chãi cho tới khi phần tử đầu đến giờ.
- **scheduleAtFixedRate**: lặp theo nhịp cố định tính từ thời điểm lên lịch lần trước.
- **scheduleWithFixedDelay**: lặp có khoảng nghỉ cố định tính từ khi lần trước kết thúc.
- **ScheduledFutureTask**: task định kỳ, giữ thời gian chạy tiếp theo và khoảng lặp.
- **Head-of-line blocking (chẹn đầu hàng)**: một task lâu chèn các task sau đó trong hàng định kỳ.

### Hoạt động từng bước

scheduleAtFixedRate(task, initialDelay, period, unit):
1. Tạo ScheduledFutureTask, thời gian chạy đầu tiên = now + initialDelay.
2. Chèn vào DelayQueue theo thời điểm chạy.
3. Worker lấy task khi đến giờ, chạy.
4. Task xong, nếu chưa bị hủy: tính thời gian tiếp theo = lastScheduledTime + period (tính từ lần **được lên lịch**, không phải khi kết thúc).
5. Chèn lại vào DelayQueue, lặp lại.

scheduleWithFixedDelay:
1. Tương tự, nhưng thời gian tiếp theo = now (khi kết thúc) + delay.
2. Luôn có khoảng nghỉ {{delay}} sau khi lần trước xong.

### Ví dụ code

~~~java
import java.util.concurrent.*;

public class ScheduledDemo {
    public static void main(String[] args) throws InterruptedException {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // Chạy ngay, sau đó mỗi 2 giây (tính từ lần được lên lịch trước)
        scheduler.scheduleAtFixedRate(() -> {
            System.out.println("fixedRate: " + System.currentTimeMillis());
            longWork(); // giả lập chạy lâu
        }, 0, 2, TimeUnit.SECONDS);

        Thread.sleep(15000);
        scheduler.shutdownNow();
    }

    static void longWork() {
        try { Thread.sleep(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
~~~

Nếu longWork() chạy 5 giây trong khi period 2 giây: lần thứ 2 bị trễ (vì worker đang bận), lần thứ 3 sẽ chạy sớm sau lần 2 để bù (theo lastScheduledTime + period) — có thể hai lần chạy sát nhau.

### Khi nào dùng / không dùng

| | scheduleAtFixedRate | scheduleWithFixedDelay |
|---|---|---|
| Tính toán lần sau | Từ lần được lên lịch trước | Từ khi lần trước kết thúc |
| Khoảng cách giữa các lần | Bị biến động nếu task lâu | Luôn cố định (delay) |
| Dùng khi | Cần cron-like (10:00, 10:05...) | Cần khoảng nghỉ giữa các lần |
| Rủi ro | Các lần chạy sát nhau nếu task lâu | Chu kỳ tổng dài hơn |

### Trên production
- Một task định kỳ chạy lâu chèn các lần sau (fixedRate): giảm payload task, chia nhỏ, hoặc dùng scheduleWithFixedDelay nếu cần khoảng nghỉ.
- Tách executor theo mức độ quan trọng: job thanh toán có scheduler riêng, không bị job báo cáo chèn.
- Java 21: có thể dùng virtual thread cho task định kỳ I/O, nhưng vẫn cần giới hạn số task đang chạy (semaphore) để không quũng tài nguyên phía sau.
- shutdownNow() interrupt các task đang chạy; task không kiểm tra interrupt vẫn chạy tiếp.

### Lỗi hay gặp
- **Một task định kỳ chạy lâu làm chèn các lần sau (fixedRate)**: worker đơn (hoặc ít worker) chạy tuần tự các ScheduledFutureTask. Cách tránh: số worker >= số task định kỳ chạy đồng thời, hoặc dùng scheduleWithFixedDelay.
- **Future.cancel(true) không dừng task nếu task không kiểm tra interrupt**: tương tự ExecutorService. Cách tránh: task kiểm tra Thread.interrupted().
- **Lỗi trong task định kỳ (ScheduledThreadPoolExecutor)**: exception làm task dừng lặp, không ném ra ngoài, không log trừ khi lấy Future.get(). Cách tránh: try/catch bao toàn thân task, log và metric.

### Trả lời phỏng vấn 1 phút
"ScheduledThreadPoolExecutor dùng DelayQueue sắp xếp task định kỳ theo thời gian chạy tiếp theo, worker lấy khi đến giờ. scheduleAtFixedRate tính lần sau từ thời gian được lên lịch trước (bị trễ chồng chéo nếu một lần chạy lâu), còn scheduleWithFixedDelay tính từ khi lần trước kết thúc (luôn có khoảng nghỉ). Một task lâu chèn toàn bộ hàng đợi định kỳ nên tách executor theo mức quan trọng và gói task bằng try/catch log metric. Nếu task chạy lâu, hãy chia nhỏ hoặc chuyển sang fixedDelay."

> Senior tip: trong production, việc quan trọng không chỉ chọn fixedRate hay fixedDelay mà là **giới hạn số task định kỳ chạy đồng thời** và **luôn bọc task bằng try/catch log metric** — task định kỳ ném exception thì dừng lặp âm thầm, không ai biết trừ khi bạn đo "lần chạy thành công gần nhất". Hãy dùng scheduler riêng cho từng tier công việc để job ít quan trọng không chèn job quan trọng.`,
  follow: [
    'scheduleAtFixedRate và scheduleWithFixedDelay khác nhau khi một lần chạy bị chậm ra sao?',
    'Một task định kỳ chạy lâu làm chèn các lần sau — xử lý thế nào?',
    'Lỗi trong task định kỳ ScheduledThreadPoolExecutor có được log không?'
  ],
  tags: ['ScheduledThreadPoolExecutor', 'DelayQueue', 'fixedRate', 'fixedDelay'],
  refs: [
    { type: 'doc', title: 'ScheduledThreadPoolExecutor API (JDK 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ScheduledThreadPoolExecutor.html' }
  ]
}
,
{
  id: 'jvm-037',
  topic: 'jvm',
  level: 'senior',
  q: 'Safepoint là gì, time-to-safepoint (TTSP) là gì, vì sao một vòng lặp dài (counted loop) làm cả ứng dụng dừng?',
  a: `**Tóm tắt:** Safepoint là thời điểm JVM dừng mọi thread Java để làm việc toàn cục (GC, deoptimization, class redefinition). Time-to-safepoint (TTSP) là thời gian từ khi JVM yêu cầu dừng tới khi thread cuối cùng thực sự dừng. Một vòng lặp dài không có điểm dừng (hoặc counted loop chưa được poll safepoint) khiến thread đó không thể dừng đúng lúc, nên JVM phải chờ, TTSP tăng, và toàn bộ app bị treo trong lúc chờ.

### Hiểu nhanh
Hãy tưởng tượng cả công ty phải dừng làm việc để kiểm kê kho. Người quản lý hô "tất cả dừng lại", nhưng một nhân viên đang chạy trên máy chạy bộ không nhìn đồng hồ nên không dừng. Cả công ty phải chờ nhân viên đó nhìn thấy tín hiệu. Safepoint là tín hiệu dừng; TTSP là thời gian chờ nhân viên "nhìn thấy tín hiệu".

### Cơ chế
1. JVM chèn các điểm safepoint vào bytecode (method entry, backward branch, loop back edge) để thread có thể dừng.
2. Khi cần safepoint, JVM đặt cờ; thread khi đi qua điểm safepoint sẽ kiểm tra cờ và dừng.
3. Counted loop (vòng for với số lần lặp đã biết) có thể bị JIT tối ưu và không chèn poll safepoint trong thân loop → thread không dừng cho tới khi loop kết thúc.
4. Vì sao counted loop không poll: để loop chạy nhanh, JIT bỏ poll; trade-off là TTSP có thể tăng.
5. JVM flag {{-Xlog:safepoint}} (Java 9+) in ra thời gian TTSP và thời gian dừng.

### Trên production
- Triệu chứng: pause bất thường, p99 tăng vọt, log safepoint cho thấy TTSP lớn.
- Đo: {{-Xlog:safepoint*=info:file=safepoint.log}}; xem TTSP và total time.
- Tuning: tránh vòng lặp dài không poll; chia nhỏ; dùng {{-XX:+UseCountedLoopSafepoints}} (chi phí cao hơn nhưng TTSP thấp hơn); trên Java 17+ mặc định đã bật cho một số trường hợp.

### Lỗi hay gặp
- Vòng lặp xử lý hàng triệu record không có điểm dừng → TTSP lớn.
- JIT inline method lớn làm mất safepoint poll → pause không giải thích được.

### Trả lời miệng 1 phút
"Safepoint là thời điểm JVM dừng mọi thread để làm việc toàn cục như GC. TTSP là thời gian từ yêu cầu dừng tới khi thread cuối cùng dừng. Một vòng lặp dài, đặc biệt counted loop, có thể không có poll safepoint trong thân, nên thread không dừng đúng lúc, JVM phải chờ, TTSP tăng và cả app bị treo. Tôi đo bằng -Xlog:safepoint và nếu cần bật UseCountedLoopSafepoints."

### Ví dụ đời thực
Service tính điểm rủi ro có p99 thỉnh thoảng nhảy lên 1,5 giây dù GC log báo các lần GC chỉ 20ms. Bật {{-Xlog:safepoint}}: một số dòng có "Reaching safepoint: 1480 ms" — JVM phải chờ gần 1,5 giây để mọi thread dừng. Dùng async-profiler ở chế độ ghi nhận thread chậm vào safepoint, tìm ra một vòng lặp {{for (int i = 0; i < n; i++)}} xử lý mảng 50 triệu phần tử trong một batch nội bộ: vòng lặp đếm bằng {{int}} được C2 tối ưu **bỏ safepoint poll** bên trong. Sửa: chia batch thành các đoạn 100.000 phần tử. Từ JDK 10, cơ chế loop strip mining ({{-XX:+UseCountedLoopSafepoints}}, mặc định bật với G1 trên các JDK hiện đại) đã giảm vấn đề này, nhưng service vẫn chạy JDK 8 nên phải sửa trong code; sau khi nâng JDK 17, TTSP tối đa còn dưới 5ms.

> Senior tip: TTSP lớn thường bị nhầm là GC pause; log safepoint phân biệt rõ. Một method có vòng lặp 10 triệu lần không poll có thể làm TTSP hàng trăm ms.`,
  follow: ['Làm sao đo TTSP trên production?', 'Khi nào bật UseCountedLoopSafepoints?'],
  tags: ['safepoint', 'TTSP', 'JIT']
}
,
{
  id: 'jvm-038',
  topic: 'jvm',
  level: 'senior',
  q: 'JIT tiered compilation (C1/C2, tier 0–4): inlining (MaxInlineSize, FreqInlineSize), deoptimization khi giả định sai (uncommon trap), warm-up khi deploy.',
  a: `**Tóm tắt:** JVM dùng tiered compilation để cân bằng khởi động nhanh và hiệu năng ổn định: code chạy từ interpreter (tier 0) để thu thập profile, biên dịch nhanh bằng C1 (tier 1–3), rồi tối ưu mạnh bằng C2 (tier 4) cho hot method. Inlining gộp method nhỏ vào caller, giảm chi phí gọi và mở ra tối ưu sâu hơn; MaxInlineSize/FreqInlineSize là các ngưỡng quyết định. Khi giả định tối ưu sai, C2 rơi vào uncommon trap và deoptimize an toàn về interpreter. Sau deploy, ứng dụng cần warm-up.

### Thuật ngữ (giải thích lần đầu)
- **Bytecode**: mã trung gian trong file .class mà JVM hiểu; không phải mã máy của CPU.
- **Interpreter**: bộ thực thi bytecode từng bước, chạy ngay nhưng chậm hơn native code (mã máy).
- **JIT (Just-In-Time compiler)**: trình biên dịch chạy ngay trong lúc ứng dụng đang chạy, biến bytecode "nóng" thành native code.
- **Tiered compilation**: chiến lược dùng nhiều tầng biên dịch để vừa khởi động nhanh vừa tối ưu sâu về sau.
- **Profile**: số liệu thống kê khi chạy thật (số lần gọi method, nhánh hay xảy ra, kiểu object thực tế).
- **Hot method / hot path**: đoạn code chạy rất nhiều lần, đáng để tối ưu.
- **Inlining**: thay lời gọi method bằng chính thân method tại chỗ gọi.
- **Deoptimization**: hủy native code đã tối ưu và quay về interpreter khi giả định không còn đúng.
- **Uncommon trap**: "bẫy" trong code C2 cho trường hợp hiếm; khi chạm tới, JVM kích hoạt deoptimization.
- **Warm-up**: giai đoạn sau deploy để JIT thu thập profile và biên dịch hot path.

### Vì sao cần cơ chế này
Hãy tưởng tượng bạn mới vào bếp: ban đầu làm theo sách từng bước (chậm nhưng an toàn), quen dần thì làm nhanh hơn (C1), với món bán chạy nhất bạn tối ưu từng động tác (C2). Nếu có món hiếm, bạn quay lại làm cẩn thận theo sách (deoptimize). JVM làm vậy vì: (1) không biết trước code nào nóng; (2) C2 biên dịch chậm nên không thể dùng cho mọi thứ ngay; (3) tối ưu tốt nhất cần dữ liệu thật; (4) khi dữ liệu thay đổi, JVM phải quay lui an toàn.

### Các tier (mức biên dịch)
| Tier | Thực hiện | Đặc điểm |
|---|---|---|
| 0 | Interpreter | Chạy ngay, thu thập profile |
| 1 | C1 | Biên dịch nhanh, ít tối ưu (method đơn giản) |
| 2 | C1 + profiling nhẹ | Nhanh hơn interpreter, thu thập thêm dữ liệu |
| 3 | C1 + profiling đầy đủ | Chuẩn bị profile tốt cho C2 |
| 4 | C2 | Tối ưu mạnh dựa trên profile (inlining sâu, bỏ check thừa, tối ưu vòng lặp) |

HotSpot mặc định bật tiered compilation. Method thường đi dần từ tier 0 lên tier 3, rồi lên tier 4 khi đủ nóng.

### Inlining: MaxInlineSize và FreqInlineSize
Inlining quan trọng vì không chỉ giảm chi phí gọi hàm. Khi thân method nằm ngay trong caller, JIT nhìn thấy bức tranh lớn hơn và có thể: loại bỏ nhánh chết, gộp hằng số, bỏ null check không cần thiết, hoặc áp dụng escape analysis.

- **MaxInlineSize**: ngưỡng kích thước bytecode cho method "thường" được xem xét inline.
- **FreqInlineSize**: ngưỡng lớn hơn cho call site rất nóng. Gọi nhiều lần nên lợi ích inline lớn hơn chi phí mã phình ra.
- Đây là JVM flag dạng {{-XX:MaxInlineSize=...}} và {{-XX:FreqInlineSize=...}}. Giá trị mặc định tùy phiên bản/kiến trúc. Khi phỏng vấn, nêu đúng ý nghĩa và trade-off quan trọng hơn thuộc lòng con số.

~~~java
class Tax {
    int rate() { return 10; } // method nhỏ, ứng viên tốt để inline
}
class PriceService {
    long total(long price, Tax tax) {
        // Sau inlining, JIT có thể "thấy" rate() = 10
        return price + (price * tax.rate() / 100);
    }
}
~~~

### Deoptimization và uncommon trap
C2 tối ưu dựa trên giả định (ví dụ: site này hầu như luôn là {{ArrayList}}, nhánh này hiếm xảy ra). Khi input hiếm vi phạm giả định, native code chạm **uncommon trap**: (1) JVM tạm dừng native frame; (2) khôi phục trạng thái về dạng interpreter hiểu được; (3) chạy tiếp bằng interpreter; (4) thu thập profile mới và có thể compile lại. Deoptimization an toàn, không phải lỗi. Nhưng nếu xảy ra liên tục (**deopt storm**) sẽ làm p99 tăng rõ.

### Ví dụ đời thực
Giả định: dịch vụ đặt hàng 8 pod, mỗi pod 2 vCPU, 2 GB heap, ~1.200 req/s ổn định, p99 = 90 ms. Lúc 09:00 deploy phiên bản mới, p99 tăng lên 520 ms trong 7 phút đầu dù CPU chỉ ~55%. JFR cho thấy nhiều {{Compilation}} và {{Deoptimization}} trên hot controller. Nguyên nhân: campaign làm một nhánh hiếm xuất hiện thường xuyên hơn; C2 compile theo profile cũ rồi deoptimize lặp lại. Xử lý: pre-warm sau health check, gửi 2.000 request tổng hợp vào 5 endpoint chính, có cả case hiếm. Kết quả: p99 chỉ tăng lên ~140 ms trong 90 giây rồi về 90 ms. SLA không bị ảnh hưởng.

### Lỗi hay gặp
- **Method quá lớn**: khó inline, JIT tối ưu kém. Tách hot path cho gọn.
- **Đo benchmark khi chưa warm-up**: số liệu sai lệch. Dùng JMH hoặc warm-up thủ công.
- **Deopt storm khi traffic đổi đột ngột**: theo dõi JFR event {{jdk.Deoptimization}}.
- **Chỉnh flag JIT mù quáng** (đổi MaxInlineSize): có thể làm tệ hơn. Chỉ đổi khi có dữ liệu đo.

### Trả lời mẫu khi phỏng vấn
"JVM dùng tiered compilation để cân bằng giữa khởi động và hiệu năng. Ban đầu code chạy ở interpreter tier 0 để thu thập profile, sau đó C1 biên dịch nhanh ở tier 1 đến 3, và hot method lên C2 tier 4 để tối ưu mạnh dựa trên profile thật. Inlining rất quan trọng vì nó gộp method nhỏ vào caller, giảm chi phí gọi và giúp JIT nhìn thấy bức tranh lớn hơn; JIT dùng MaxInlineSize cho method thường và FreqInlineSize cho method nóng. Khi C2 dựa trên giả định sai, ví dụ một kiểu dữ liệu hiếm bỗng xuất hiện nhiều, native code chạm uncommon trap và JVM deoptimize an toàn về interpreter rồi compile lại. Trên production, tôi luôn tính đến warm-up sau deploy: pre-warm hot path, theo dõi JFR để xem compilation và deoptimization, và giữ hot method đủ gọn để dễ inline."

> Senior tip: sau deploy, theo dõi p99 theo từng phút thay vì chỉ nhìn trung bình. p99 tăng rồi tự hạ thường là warm-up hoặc deopt. Tránh chỉnh flag {{-XX:MaxInlineSize}} hay tắt tiered compilation trên production nếu chưa có dữ liệu JFR chứng minh lợi ích.`,
  follow: ['Làm sao phát hiện deoptimization storm trên production?', 'Tại sao pre-warm hiệu quả hơn chỉ chờ traffic thật?'],
  tags: ['JIT', 'tiered compilation', 'inlining', 'deoptimization']
}
,
{
  id: 'jvm-039',
  topic: 'jvm',
  level: 'senior',
  q: 'G1 GC bên trong: region, remembered set, card table, write barrier, mixed GC, vì sao pause dự đoán được.',
  a: `**Tóm tắt:** G1 (Garbage-First) chia heap thành nhiều region nhỏ thay vì một vùng young/old liền mạch. Để dọn một region mà không quét toàn bộ heap, G1 dùng remembered set (RSet) — sổ ghi "ai đang trỏ vào region này", được duy trì nhờ card table và write barrier. G1 chọn dọn các region có nhiều rác nhất trước (garbage-first) và ước lượng thời gian để giữ pause trong mục tiêu {{-XX:MaxGCPauseMillis}}. Vì vậy pause thường ngắn và tương đối dự đoán được.

### Thuật ngữ (giải thích lần đầu)
- **GC (Garbage Collection)**: cơ chế tự động thu hồi bộ nhớ của object không còn ai dùng.
- **Heap**: vùng nhớ JVM dùng để cấp phát object.
- **Region**: mảnh heap có kích thước cố định (thường 1–32 MB, JVM tự chọn theo heap); mỗi region có thể là Eden, Survivor, Old, hoặc Humongous.
- **RSet (Remembered Set)**: cấu trúc dữ liệu ghi lại các tham chiếu từ region khác trỏ vào region này.
- **Card table**: bảng đánh dấu các "ô" nhỏ (thường 512 byte) trong heap đã bị ghi đè tham chiếu; dùng để cập nhật RSet.
- **Write barrier**: đoạn mã nhỏ JVM chèn vào mỗi lần ghi tham chiếu ({{obj.field = other}}) để cập nhật card table/RSet.
- **Mixed GC**: đợt GC dọn cả young region và một số old region cùng lúc.
- **Pause time goal**: mục tiêu thời gian dừng ứng dụng cho mỗi lần GC.
- **Humongous object**: object lớn hơn 50% kích thước một region; G1 xếp vào humongous region riêng.

### Vì sao G1 thiết kế như vậy
GC cổ điển (như Parallel/Serial thế hệ cũ) thường phải quét vùng nhớ lớn, gây pause dài khi heap lớn. Tưởng tượng dọn một tòa nhà: thay vì mỗi lần dọn phải kiểm tra toàn bộ tòa nhà, bạn chia thành từng phòng (region) và mỗi phòng có sổ ghi "phòng nào đang giữ chìa/đồ liên quan tới phòng này" (RSet). Muốn dọn phòng A, bạn chỉ cần nhìn sổ của A, không cần lục hết tòa nhà. G1 làm đúng điều đó để pause ngắn và có thể kiểm soát.

### Cơ chế hoạt động từng bước
1. **Chia heap thành region.** Mỗi region đóng một vai trò (Eden/Survivor/Old/Humongous) và vai trò có thể thay đổi giữa các lần GC.
2. **Young GC (Evacuation Pause).** Dọn Eden và Survivor: copy object còn sống sang Survivor hoặc Old region mới, giải phóng toàn bộ young region đã dọn. Pause thường ngắn.
3. **Concurrent marking.** Khi heap dùng nhiều, G1 chạy đánh dấu song song với ứng dụng để tìm region old có nhiều rác (live ratio thấp).
4. **Mixed GC.** Sau marking, G1 dọn young region cộng thêm một số old region có nhiều rác nhất. Đây là "garbage-first": dọn vùng cho lại nhiều bộ nhớ nhất trước.
5. **Dự đoán pause.** G1 theo dõi thời gian dọn từng region trong quá khứ, ước lượng và chọn số region vừa đủ để tổng thời gian nằm trong {{MaxGCPauseMillis}} (mặc định thường 200 ms).

### RSet, card table, write barrier
Để dọn region A, G1 phải biết object sống trong A có được tham chiếu từ đâu. Quét toàn heap sẽ phá mục tiêu pause. Vì vậy:
- **Card table** chia heap thành các card nhỏ (512 byte). Khi ứng dụng ghi {{x.field = y}}, **write barrier** đánh dấu card của {{x}} là "bẩn" (dirty).
- Ở thời điểm phù hợp, G1 xử lý dirty card để cập nhật **RSet** của region chứa {{y}}: "region của x có tham chiếu trỏ vào region của y".
- Chi phí: write barrier chạy rất thường xuyên (mọi lần ghi tham chiếu), nên có overhead nhỏ nhưng liên tục. RSet cũng tốn bộ nhớ (có thể vài % heap).

~~~text
Region 1 (Old)  ----ref---->  Region 7 (Old, nhiều rác)
Region 3 (Young) ---ref--->  Region 7
=> RSet của Region 7 ghi: {Region 1, Region 3}
Khi mixed GC dọn Region 7: chỉ cần quét root + Region 1 + Region 3,
không cần quét toàn bộ heap.
~~~

### Ví dụ đời thực
Giả định: dịch vụ API Java 17, heap 8 GB, ~3.000 req/s, object sống ngắn nhiều (JSON/request context). Dùng G1 với {{-XX:MaxGCPauseMillis=200}}. Trạng thái ổn: young GC 20–40 ms, 8–12 lần/phút; mixed GC thỉnh thoảng 60–120 ms. Một ngày team phát hiện p99 tăng vọt 1–2 giây theo chu kỳ. GC log cho thấy có humongous allocation (object ~5 MB, trong khi region 4 MB) và to-space exhausted/evacuation failure. Nguyên nhân: một API trả về mảng byte lớn dựng trong bộ nhớ. Xử lý: chuyển sang stream/ghi từng phần (chunk) để tránh object khổng lồ, đồng thời xem xét {{-XX:G1HeapRegionSize}} phù hợp. Kết quả: humongous allocation biến mất, pause p99 ổn lại dưới 150 ms.

### Lỗi hay gặp
- **Humongous object** (object > 50% region): chiếm humongous region liên tiếp, khó thu hồi, có thể gây pause/Full GC bất lợi. Tránh tạo object cực lớn; dùng streaming/chia nhỏ.
- **MaxGCPauseMillis đặt quá thấp** (ví dụ 20 ms) so với heap/tải: G1 không kịp đạt mục tiêu, có thể thu gom ít hơn, dẫn tới áp lực bộ nhớ. Đặt mục tiêu thực tế.
- **Heap quá chật**: evacuation failure (không còn region trống để copy object sống). Tăng heap hoặc giảm allocation rate.
- **Bỏ qua allocation rate**: GC tuning không cứu được code tạo rác quá nhiều. Dùng JFR/async-profiler xem allocation.

### Trả lời mẫu khi phỏng vấn
"G1 chia heap thành nhiều region để có thể thu gom từng phần thay vì quét toàn bộ heap. Mỗi region có remembered set ghi các tham chiếu trỏ vào nó, và G1 duy trì RSet nhờ card table cùng write barrier mỗi khi ứng dụng ghi tham chiếu. Young GC dọn Eden/Survivor bằng cách copy object sống; concurrent marking tìm old region có nhiều rác; mixed GC dọn cả young và một số old region nhiều rác nhất, đúng tinh thần garbage-first. Pause dự đoán được vì G1 đo thời gian dọn region trong quá khứ và chọn số region vừa đủ để nằm trong MaxGCPauseMillis. Trên production, tôi đọc GC log/JFR, tránh humongous object, và đặt mục tiêu pause thực tế thay vì quá thấp."

> Senior tip: nếu p99 tăng theo chu kỳ, đừng vội đổi sang ZGC. Hãy kiểm tra allocation rate, humongous allocation và evacuation failure trong GC log trước. Nhiều trường hợp "GC chậm" thực ra là ứng dụng tạo rác quá nhanh hoặc tạo object quá lớn.`,
  follow: ['Humongous object gây ảnh hưởng gì đến G1?', 'Khi nào G1 không đạt được MaxGCPauseMillis?'],
  tags: ['G1', 'GC', 'region', 'RSet', 'write barrier']
}
,
{
  id: 'jvm-040',
  topic: 'jvm',
  level: 'lead',
  q: 'ZGC generational (Java 21): colored pointers, load barrier, concurrent relocation; khi nào chọn ZGC vs G1.',
  a: `**Tóm tắt:** ZGC thế hệ (generational, JEP 439 từ Java 21, mặc định từ JDK 23) là GC độ trễ thấp: phần lớn công việc đánh dấu, di chuyển (relocate) object diễn ra song song với luồng ứng dụng, nên pause thường rất ngắn (thường dưới 1 ms) ngay cả heap lớn. Nó dùng colored pointers (mã hóa trạng thái GC ngay trong bit của con trỏ), load barrier (kiểm tra khi đọc tham chiếu) và concurrent relocation. Chọn ZGC khi mục tiêu là tail latency/p99 nghiêm ngặt hoặc heap rất lớn; chọn G1 khi cần throughput tổng thể tốt, vận hành quen thuộc, hoặc workload không quá nhạy latency.

### Thuật ngữ (giải thích lần đầu)
- **GC pause (STW - Stop-The-World)**: khoảng thời gian JVM tạm dừng luồng ứng dụng để làm việc GC.
- **Latency / p99**: latency là độ trễ; p99 là mức độ trễ mà 99% request nhanh hơn (đuôi chậm).
- **Throughput**: tổng lượng công việc hoàn thành; GC throughput cao nghĩa là ít thời gian CPU dành cho GC.
- **Concurrent**: chạy song song/cùng thời gian với luồng ứng dụng (không phải lúc nào cũng STW).
- **Colored pointer**: con trỏ (địa chỉ tham chiếu) có vài bit mang metadata trạng thái GC (ví dụ đã đánh dấu, đã remap).
- **Load barrier**: mã JVM chèn khi ứng dụng đọc một tham chiếu; dùng để kiểm tra/sửa tham chiếu nếu object đã bị di chuyển.
- **Relocation**: di chuyển object sang vùng nhớ mới để gom vùng trống (compaction), tránh phân mảnh.
- **Generational**: chia object theo tuổi (young/old). Object mới chết sớm rất nhiều, nên gom young thường hiệu quả.

### Vì sao ZGC ra đời
Với heap lớn (chục đến trăm GB) và yêu cầu p99 thấp, GC truyền thống dễ gây pause dài khi phải quét/di chuyển nhiều dữ liệu. Hãy tưởng tượng đang dọn kho rất lớn mà bắt tất cả công nhân dừng làm việc: kho càng lớn, thời gian dừng càng lâu. ZGC chọn cách khác: vừa dọn vừa để công nhân tiếp tục làm, chỉ dừng rất ngắn để chốt các điểm gốc (roots). Đổi lại, ZGC phức tạp hơn và có overhead (barrier, thêm metadata).

### Cơ chế chính (ở mức hiểu để phỏng vấn)
1. **Colored pointers.** Thay vì chỉ lưu địa chỉ, con trỏ mang thêm "màu" (bit metadata) cho biết trạng thái liên quan tới GC (ví dụ: tham chiếu còn hợp lệ theo mapping hiện tại hay cần sửa). Nhờ đó ZGC biết khi nào cần xử lý tham chiếu.
2. **Load barrier.** Mỗi khi ứng dụng tải (load) một tham chiếu từ heap/stack theo ngữ cảnh cần thiết, barrier kiểm tra metadata. Nếu object đã được relocate, barrier giúp lấy đúng địa chỉ mới (self-healing/remap). Vì chạy khi đọc, nó có chi phí nhỏ nhưng phân tán.
3. **Concurrent marking.** ZGC đánh dấu object còn sống song song với ứng dụng.
4. **Concurrent relocation (compaction).** ZGC di chuyển object sống sang region mới để giải phóng vùng nhớ và giảm phân mảnh, vẫn song song với ứng dụng. Ứng dụng có thể đọc object đang/đã di chuyển nhờ load barrier.
5. **Generational (Java 21).** ZGC generational gom young generation thường xuyên (object chết trẻ) và gom old ít hơn. Điều này cải thiện hiệu quả so với ZGC non-generational trước đó vì phù hợp đặc tính "đa số object chết sớm".

### ZGC vs G1: chọn thế nào
| Tiêu chí | G1 | ZGC generational |
|---|---|---|
| Mục tiêu chính | Cân bằng throughput/latency | Latency rất thấp (pause ngắn) |
| Pause điển hình | Vài chục đến vài trăm ms (tùy heap/tải) | Thường sub-millisecond đến rất thấp (tùy workload) |
| Heap lớn | Tốt, nhưng pause có thể tăng | Thiết kế cho heap lớn với pause ổn định |
| Overhead CPU/bộ nhớ | Thường thấp hơn, quen thuộc | Có overhead barrier/metadata; throughput có thể thấp hơn trong một số workload |
| Độ trưởng thành vận hành | Rất phổ biến, mặc định nhiều môi trường | Cần đo kỹ; Java 21+ generational là lựa chọn chính |

Quy tắc thực dụng: **đừng chọn theo "mới/ngầu"**. Chọn theo SLO (mục tiêu p99/p999), heap size, allocation rate, và kết quả benchmark/profiling thực tế.

### Ví dụ đời thực
Giả định: hệ thống pricing/gợi ý giá, Java 21, heap 32 GB, 2.500 req/s, SLO p99 < 120 ms. Dùng G1, phần lớn thời gian p99 ổn, nhưng khi traffic tăng và mixed GC xảy ra, có nhịp pause 180–350 ms làm p99 vượt SLO 2–3 lần/giờ. Allocation rate ~1.8 GB/s, chủ yếu object sống ngắn. Team thử ZGC generational trên môi trường staging với cùng traffic replay: pause GC giảm mạnh (quan sát dưới 1 ms phần lớn), p99 ổn định ~85–95 ms; CPU tổng thể tăng khoảng 6–8% do barrier/GC concurrent. Đánh đổi được chấp nhận vì SLO latency quan trọng hơn chi phí CPU. Trước khi lên production, team xác nhận bằng JFR và test 48 giờ.

### Lỗi hay gặp
- **Kỳ vọng throughput tăng khi chuyển ZGC**: ZGC tối ưu latency, có thể giảm throughput. Luôn đo.
- **Allocation rate quá cao**: GC nào cũng vất vả nếu tạo rác quá nhanh. Tối ưu cấp phát trước.
- **Heap sizing không phù hợp**: heap quá chật làm GC chạy liên tục. Đặt heap đủ và theo dõi.
- **Không đo trên workload thật**: benchmark vi mô không phản ánh allocation/pause thực tế.

### Trả lời mẫu khi phỏng vấn
"ZGC generational (Java 21+, mặc định từ JDK 23) hướng tới độ trễ rất thấp bằng cách làm phần lớn công việc GC song song với ứng dụng. Nó dùng colored pointers để gắn metadata trạng thái vào con trỏ, load barrier để kiểm tra khi đọc tham chiếu và sửa khi object đã được relocate, cùng concurrent relocation để di chuyển object mà không cần dừng ứng dụng lâu. Chế độ generational giúp tận dụng đặc tính object chết trẻ nên hiệu quả hơn. Tôi chọn ZGC khi SLO p99/p999 rất nghiêm ngặt hoặc heap lớn và G1 đã gây pause ảnh hưởng rõ; chọn G1 khi cần throughput ổn, vận hành đơn giản và latency hiện tại đạt yêu cầu. Trước khi đổi collector, tôi luôn đo bằng GC log/JFR trên workload thật để xem pause, throughput và chi phí CPU."

> Senior tip: thay GC là quyết định có đánh đổi. Hãy có baseline (p99, throughput, CPU, allocation rate) trước và sau; nếu chỉ nhìn "pause thấp hơn" mà bỏ qua CPU/chi phí hạ tầng, bạn có thể tối ưu sai mục tiêu.`,
  follow: ['Load barrier ảnh hưởng hiệu năng thế nào?', 'Khi nào G1 là lựa chọn đủ tốt thay vì ZGC?'],
  tags: ['ZGC', 'GC', 'colored pointers', 'load barrier', 'latency']
}
,
{
  id: 'jvm-041',
  topic: 'jvm',
  level: 'senior',
  q: 'JVM trong container: UseContainerSupport, MaxRAMPercentage, active processor count, OOMKilled vs OutOfMemoryError, native memory.',
  a: `**Tóm tắt:** JVM trong container đọc limit của container (cgroup) nhờ UseContainerSupport (mặc định bật từ JDK 8u191+). MaxRAMPercentage đặt heap = % RAM container. Active processor count ảnh hưởng thread pool mặc định. OOMKilled là kernel kill process (hết memory cgroup) còn OutOfMemoryError là JVM ném exception khi heap đầy. Native memory (metaspace, thread stack, code cache) nằm ngoài heap và theo dõi bằng -XX:NativeMemoryTracking + jcmd VM.native_memory.

### Hiểu nhanh
Container giống một căn phòng có trần thấp; JVM phải biết trần thấp để không xây tủ cao chạm trần. Nếu không biết, JVM xây tủ cao → bị đập đầu (OOMKilled).

### Cơ chế
1. UseContainerSupport: JVM đọc cgroup memory/CPU limit.
2. MaxRAMPercentage: heap = % của limit (mặc định ~25% trước, nên đặt ~75%).
3. Active processor count: số CPU container → affect ForkJoinPool/commonPool parallelism và GC thread.
4. OOMKilled: kernel kill khi vượt cgroup memory; không có stack trace Java.
5. OutOfMemoryError: JVM heap đầy, ném exception.
6. Native memory: metaspace, thread stack, code cache, direct buffer; NMT theo dõi.

### Trên production
- Triệu chứng: pod restart không log, OOMKilled trong k8s events; hoặc OOM heap.
- Đo: kubectl describe pod; jcmd VM.native_memory summary.
- Tuning: MaxRAMPercentage=75, -XX:NativeMemoryTracking=summary, giới hạn thread/direct buffer.

### Lỗi hay gặp
- MaxRAMPercentage mặc định thấp → heap nhỏ, throughput thấp.
- Thread leak → native memory tăng → OOMKilled.

### Trả lời miệng 1 phút
"UseContainerSupport làm JVM đọc limit container. MaxRAMPercentage đặt heap theo % RAM. OOMKilled là kernel kill, OutOfMemoryError là JVM exception. Native memory theo dõi bằng NMT + jcmd."

> Senior tip: OOMKilled không có stack trace; luôn bật NMT summary trong production để điều tra.`,
  follow: ['Cách phân biệt OOMKilled và OutOfMemoryError?', 'NMT summary đọc thế nào?'],
  tags: ['container', 'cgroup', 'OOMKilled', 'NMT']
}
,
{
  id: 'jvm-042',
  topic: 'jvm',
  level: 'senior',
  q: 'JFR + JMC và async-profiler: profile allocation và lock contention trên production với overhead thấp; flame graph.',
  a: `**Tóm tắt:** Để tìm nguyên nhân CPU cao, GC nhiều, latency tăng trên production, cần profiler có overhead thấp. **JFR (Java Flight Recorder)** là "hộp đen" của JVM: ghi sự kiện (GC, allocation, lock, safepoint, thread...) với chi phí thấp, có thể chạy liên tục. **JMC (Java Mission Control)** mở và phân tích file {{.jfr}}. **async-profiler** lấy mẫu stack trace theo CPU, allocation, lock và xuất **flame graph** để thấy nhanh hotspot. Ba công cụ bổ trợ nhau: JFR cho bức tranh toàn cảnh theo thời gian, async-profiler cho khoanh vùng nguyên nhân cụ thể.

### Thuật ngữ (giải thích lần đầu)
- **Profiler**: công cụ đo chương trình đang tiêu tốn CPU, bộ nhớ, lock ở đâu.
- **Overhead**: chi phí thêm do công cụ đo gây ra. Production cần overhead thấp.
- **Sampling**: lấy mẫu định kỳ (ví dụ chụp stack trace theo chu kỳ) thay vì ghi mọi thứ.
- **Allocation profiling**: đo nơi code cấp phát object nhiều, thường gây GC pressure (áp lực GC).
- **Lock contention**: nhiều thread tranh cùng lock phải chờ nhau, làm tăng latency.
- **Flame graph**: biểu đồ stack trace; **bề ngang** biểu thị tỷ lệ mẫu/thời gian, bề dọc là call stack.
- **Hotspot**: đoạn code chiếm tỷ lệ lớn tài nguyên.

### JFR (Java Flight Recorder)
JFR tích hợp trong JVM (OpenJDK), ghi sự kiện như GC, allocation, thread, lock contention, safepoint, compilation. Ưu điểm: overhead thấp, phù hợp production.

~~~text
// Khởi động kèm recording
-XX:StartFlightRecording=filename=app.jfr,dumponexit=true,settings=profile

// Hoặc dùng jcmd khi đang chạy
jcmd <pid> JFR.start settings=profile filename=/tmp/app.jfr duration=10m
jcmd <pid> JFR.dump filename=/tmp/app.jfr
jcmd <pid> JFR.stop
~~~

{{settings=profile}} thu thập chi tiết hơn {{default}} (overhead có thể nhỉnh hơn một chút, vẫn cần đánh giá theo hệ thống).

### JMC (Java Mission Control)
JMC phân tích file {{.jfr}}: biểu đồ CPU/heap/GC theo thời gian, allocation hot methods/classes, lock contention, thread, safepoint. JMC trả lời: "sự cố xảy ra lúc nào, trùng với GC/lock/allocation gì?".

### async-profiler
async-profiler lấy mẫu stack trace (thường ít bị safepoint bias hơn profiler cũ) và xuất flame graph HTML.
~~~text
./asprof -d 60 -e cpu   -f cpu.html   <pid>
./asprof -d 60 -e alloc -f alloc.html <pid>
./asprof -d 60 -e lock  -f lock.html  <pid>
~~~

### Đọc flame graph đúng cách
- Trục dọc: call stack (hàm dưới gọi hàm trên).
- Trục ngang: **chiều rộng** = tỷ lệ mẫu (CPU/allocation/lock). "Bức tường" rộng là hotspot.
- Không đọc độ cao stack như thời gian. Hàm sâu không đồng nghĩa chậm.

### Ví dụ đời thực
Giả định: API tìm kiếm 6 pod, 4 vCPU/pod, 4 GB heap, p99 thường 110 ms. Sau release, CPU tăng 45% -> 78%, GC young tăng gấp đôi, p99 420 ms. JFR 15 phút (settings=profile) mở bằng JMC cho thấy allocation rate tăng mạnh, nhiều {{String}}/{{HashMap}} tạm. async-profiler {{-e alloc}} 60 giây cho flame graph chỉ hotspot ở {{buildResponse()}}: tạo map mới mỗi phần tử và serialize trung gian. Tối ưu: bỏ bước trung gian, giảm object tạm. Kết quả: allocation rate giảm ~55%, CPU ~50%, p99 ~130 ms. Không cần restart hay attach debugger.

### Lỗi hay gặp
- **Cấu hình profiler quá nặng**: sample quá dày làm overhead tăng. Chọn profile phù hợp.
- **Đọc sai flame graph**: nhìn chiều cao thay vì chiều rộng.
- **Chỉ profile CPU**: latency cao có thể do allocation/GC hoặc lock contention. Chọn mode {{alloc}}/{{lock}} khi phù hợp.
- **Chụp sai thời điểm**: snapshot 60 giây phải rơi vào lúc có sự cố; JFR timeline giúp chọn đúng.

### Trả lời mẫu khi phỏng vấn
"Khi điều tra performance trên production, tôi ưu tiên công cụ overhead thấp. JFR là lựa chọn đầu tiên vì tích hợp trong JVM, ghi được GC, allocation, lock, safepoint và thread theo thời gian; tôi dùng JMC để phân tích file .jfr. Với hotspot cụ thể, tôi dùng async-profiler để lấy mẫu CPU, allocation hoặc lock contention và xuất flame graph. Khi đọc flame graph, tôi nhìn bề ngang vì nó biểu thị tỷ lệ mẫu, còn bề dọc chỉ là call stack. Tôi thường kết hợp: JFR cho bức tranh toàn cảnh theo timeline, async-profiler cho nguyên nhân ở method nào. Bước đầu tiên luôn là xác định bottleneck là CPU-bound, allocation/GC-bound, lock contention hay I/O, rồi chọn mode profile phù hợp."

> Senior tip: đừng tối ưu trước khi biết bottleneck. CPU, allocation và lock contention có triệu chứng giống nhau (latency cao) nhưng cách sửa khác nhau. Sai mode profiler sẽ dẫn tới kết luận sai.`,
  follow: ['Làm sao phân biệt bottleneck do allocation và do lock contention?', 'Khi nào nên dùng JFR continuous recording?'],
  tags: ['JFR', 'JMC', 'async-profiler', 'flame graph', 'profiling']
}
,
{
  id: 'jvm-043',
  topic: 'jvm',
  level: 'lead',
  q: 'Metaspace: class metadata, classloader leak, vì sao redeploy Tomcat làm metaspace tăng và cách xử lý.',
  a: `**Tóm tắt:** **Metaspace** là vùng native memory (ngoài heap Java) lưu metadata của class: cấu trúc class, method, field, constant pool... (từ Java 8 thay PermGen). **Classloader leak** xảy ra khi một GC root vẫn giữ tham chiếu tới {{ClassLoader}} của ứng dụng đã redeploy, khiến GC không thể thu hồi classloader đó và toàn bộ class metadata liên quan. Trên Tomcat, mỗi lần redeploy tạo ClassLoader mới; nếu ClassLoader cũ bị leak, Metaspace tăng dần qua các lần deploy và có thể gây {{OutOfMemoryError: Metaspace}}.

### Thuật ngữ (giải thích lần đầu)
- **Class metadata**: thông tin JVM cần để hiểu class (tên, method, bytecode metadata, constant pool...), không phải dữ liệu instance.
- **Metaspace**: vùng native memory chứa class metadata. Không cố định kiểu PermGen, nhưng vẫn có thể cạn khi leak.
- **ClassLoader**: thành phần nạp class. Trên Tomcat, mỗi webapp thường có ClassLoader riêng để cô lập.
- **Redeploy**: gỡ bản cũ và nạp bản mới mà không restart toàn bộ JVM.
- **Classloader leak**: ClassLoader cũ còn được tham chiếu nên GC không thu hồi; các class do nó nạp cũng không giải phóng.
- **GC root**: điểm xuất phát để GC xác định object còn sống (thread stack, static field, JNI ref...). Nếu từ GC root còn đường tới ClassLoader cũ, nó vẫn sống.

### Metaspace và vòng đời ClassLoader
Khi JVM nạp class qua ClassLoader, metadata nằm trong Metaspace. Khi ClassLoader không còn tham chiếu và được GC, JVM có thể giải phóng metadata của các class do nó nạp. Vì vậy Metaspace phụ thuộc mạnh vào vòng đời ClassLoader — rất quan trọng khi redeploy.

Cờ liên quan:
- {{-XX:MetaspaceSize}}: ngưỡng kích hoạt GC/điều chỉnh metadata (không phải "kích thước cố định").
- {{-XX:MaxMetaspaceSize}}: giới hạn tối đa Metaspace. Giúp fail fast khi leak, nhưng đặt quá thấp gây OOME giả.

### Vì sao redeploy Tomcat làm Metaspace tăng
1. Deploy webapp v1: Tomcat tạo WebappClassLoader W1, nạp class v1 -> Metaspace tăng.
2. Redeploy v2: Tomcat tạo W2. Nếu sạch, W1 không còn tham chiếu -> GC thu hồi W1 -> metadata v1 giải phóng.
3. Nếu có leak (ThreadLocal chưa {{remove()}}, thread nền chưa shutdown, JDBC driver/MBean đăng ký toàn cục chưa gỡ, cache static giữ object webapp...), GC root vẫn trỏ tới W1.
4. W1 không GC được. Sau N lần redeploy, W1..Wn-1 còn sống -> Metaspace tích lũy -> {{OutOfMemoryError: Metaspace}}.

Hãy tưởng tượng mỗi lần đổi người thuê (redeploy) bạn cấp chìa khóa mới (ClassLoader mới), nhưng người bảo vệ (thread pool server, sống lâu) vẫn giữ đồ của người thuê cũ (ThreadLocal/static ref). Phòng cũ không bao giờ dọn được.

### Nguyên nhân leak phổ biến
- **ThreadLocal không remove**: thread Tomcat pool sống qua redeploy; giá trị ThreadLocal giữ object/class webapp cũ.
- **Thread/timer/executor tự tạo không shutdown**: thread nền còn chạy, giữ classloader cũ.
- **Đăng ký toàn cục không gỡ**: JDBC driver, JMX MBean, logging hook, serialization hook.
- **Cache static**: cache ở parent/common classloader chứa object webapp.
- **Thư viện bên thứ ba**: cần kiểm tra phiên bản và cơ chế shutdown.

### Cách phát hiện
1. **Triệu chứng**: sau mỗi redeploy Metaspace/native memory tăng và không giảm; vài lần sau bị OOM Metaspace.
2. **Theo dõi**: JFR, {{jcmd <pid> VM.metaspace}}, VisualVM/JMC.
3. **Heap dump**: sau vài lần redeploy, dùng Eclipse MAT tìm nhiều ClassLoader cùng webapp, xem **Path to GC Roots** để biết ai giữ.
4. **Tomcat log**: Tomcat có cảnh báo một số leak khi undeploy (không bao phủ hết).

### Ví dụ đời thực
Giả định: Tomcat chạy webapp nội bộ, redeploy 1–2 lần/ngày, heap 2 GB. Ban đầu Metaspace ~180 MB. Mỗi redeploy tăng 60–90 MB, Full GC không giảm. Lần redeploy thứ 12 gặp {{OutOfMemoryError: Metaspace}}. Heap dump (MAT) cho thấy 11 {{WebappClassLoader}} còn sống; GC root từ thread pool Tomcat tới {{ThreadLocal}} chứa {{UserContext}} của webapp cũ. Nguyên nhân: filter {{set}} ThreadLocal nhưng không {{remove()}} trong {{finally}}. Cách xử lý: luôn {{remove()}} ở {{finally}}, shutdown thread nền ở {{ServletContextListener.contextDestroyed}}, kiểm tra deregister JDBC/MBean. Kết quả: redeploy 20 lần, Metaspace dao động 170–210 MB, không tăng tích lũy.

### Cách xử lý và phòng tránh
- **Dọn khi undeploy**: {{contextDestroyed}} shutdown thread pool, timer, scheduler, client.
- **ThreadLocal**: {{set}} đi kèm {{remove}} trong {{finally}}.
- **Gỡ đăng ký toàn cục**: deregister JDBC driver, MBean, hook.
- **Giới hạn/giám sát**: {{MaxMetaspaceSize}} hợp lý để phát hiện leak sớm.
- **Giảm redeploy nóng dài hạn**: rolling restart process/pod là cách "sạch" nhất; redeploy nóng cần kỷ luật quản lý tài nguyên.

### Trả lời mẫu khi phỏng vấn
"Metaspace lưu class metadata trong native memory, thay PermGen từ Java 8. Trên Tomcat, mỗi lần redeploy tạo ClassLoader mới; nếu ClassLoader cũ được GC thì metadata cũ giải phóng. Classloader leak xảy ra khi còn GC root giữ ClassLoader cũ, ví dụ ThreadLocal chưa remove, thread nền chưa shutdown, hoặc đăng ký toàn cục như JDBC/MBean chưa gỡ. Khi đó Metaspace tăng dần sau mỗi redeploy và có thể gây OutOfMemoryError: Metaspace. Để xử lý, tôi theo dõi Metaspace bằng JFR hoặc jcmd, chụp heap dump và dùng MAT tìm ClassLoader còn sống rồi xem Path to GC Roots. Phòng tránh: luôn remove ThreadLocal trong finally, shutdown resource ở contextDestroyed, và đặt MaxMetaspaceSize để phát hiện leak sớm."

> Senior tip: tiêu chuẩn "redeploy an toàn" là redeploy nhiều lần mà Metaspace và số ClassLoader webapp không tăng tích lũy. Chỉ test một lần redeploy có thể bỏ sót leak tích lũy chậm.`,
  follow: ['Làm sao dùng heap dump/MAT để tìm classloader leak?', 'Tại sao ThreadLocal trong thread pool nguy hiểm khi redeploy?'],
  tags: ['metaspace', 'classloader', 'memory leak', 'tomcat']
}
,
{
  id: 'jvm-044',
  topic: 'jvm',
  level: 'lead',
  q: 'GC tuning tổng thể: chọn collector theo workload, đọc GC log, heap sizing, pause target; khi nào đổi collector.',
  a: `**Tóm tắt:** GC tuning là bài toán đo lường và đánh đổi, không phải "chọn cờ thần kỳ". Chọn collector theo workload: **Serial** cho app nhỏ/ít lõi; **Parallel** ưu tiên throughput; **G1** cân bằng, phổ biến cho server; **ZGC generational** (Java 21+) ưu tiên pause rất thấp/heap lớn. Đọc GC log/JFR để hiểu pause, tần suất, allocation rate, promotion. Heap sizing cần đủ rộng; thường đặt {{-Xms}}={{-Xmx}}. Đổi collector chỉ khi có dữ liệu cho thấy collector hiện tại không đạt SLO và đã loại trừ nguyên nhân do allocation/object lifecycle.

### Thuật ngữ (giải thích lần đầu)
- **Workload**: đặc tính tải (request ngắn/dài, allocation rate, object sống lâu, yêu cầu latency hay throughput).
- **Throughput**: tỷ lệ thời gian ứng dụng làm việc hữu ích (ít bị GC chiếm).
- **Pause (STW)**: thời gian ứng dụng bị dừng do GC.
- **Allocation rate**: tốc độ tạo object mới (MB/s). Cao -> GC thường xuyên.
- **Promotion**: object sống qua young GC được đẩy sang old generation.
- **GC log**: nhật ký GC; JDK 9+ dùng Unified Logging {{-Xlog:gc*}}.
- **SLO**: mục tiêu mức dịch vụ (ví dụ p99 < 200 ms).

### Chọn collector theo workload
| Collector | Phù hợp | Đánh đổi |
|---|---|---|
| Serial | Heap nhỏ, 1 lõi, CLI/batch đơn giản | Pause dài khi heap/tải tăng |
| Parallel | Batch/throughput, chấp nhận pause | Pause STW có thể lớn |
| G1 | Server đa số, cần cân bằng | Pause khá, không thấp như ZGC |
| ZGC generational | p99/p999 nghiêm ngặt, heap lớn | Overhead CPU/throughput có thể đổi; cần đo |

Không có collector tốt nhất cho mọi bài. Senior trả lời: nêu tiêu chí, cách đo, rồi chọn.

### Đọc GC log / quan sát
~~~text
-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20m
~~~

Chỉ số cần nhìn:
- **Pause duration**: có vượt SLO p99 không?
- **Frequency**: young GC quá dày thường do allocation rate cao hoặc heap/young nhỏ.
- **Cause**: Allocation Failure, Humongous Allocation, Metadata GC Threshold...
- **Heap before/after**: sau GC vẫn cao -> retention/leak hoặc heap nhỏ.
- **Promotion/Old occupancy**: old tăng dần cần soi object sống lâu.

Bổ sung JFR và metrics (Micrometer/Prometheus) để xem timeline cùng latency.

### Heap sizing và pause target
- **{{-Xms}} = {{-Xmx}}** trên server: tránh resize, giảm nhiễu.
- Heap quá nhỏ: GC dày, throughput giảm, nguy cơ OOME.
- Heap quá lớn: có thể che leak; với collector pause dài, pause có thể tăng.
- **G1 pause target**: {{-XX:MaxGCPauseMillis=200}} là mục tiêu, không phải cam kết cứng. Đặt quá thấp có thể phản tác dụng.

### Ví dụ đời thực
Giả định: dịch vụ báo cáo Java 17, heap 6 GB, Parallel GC, spike tạo nhiều object tạm (export CSV/JSON). p99 thường 150 ms nhưng khi major pause xảy ra request giật 1.2–2.8 giây, 3–5 lần/giờ. GC log: allocation rate cao, pause dài. SLO p99 < 400 ms. Bước 1: tối ưu code (streaming CSV, bỏ chuỗi trung gian) -> allocation rate giảm 35%, pause còn 700–1200 ms. Bước 2: chuyển G1 với {{-Xms6g -Xmx6g}}, {{MaxGCPauseMillis=200}} (mục tiêu thực tế), đo traffic replay: pause đa số 40–140 ms, p99 ~220 ms. Không chọn ZGC vì SLO đã đạt và thay đổi tối thiểu.

### Khi nào đổi collector
Đổi khi: có baseline (pause, throughput, CPU, allocation); collector hiện tại không đạt SLO dù đã xử lý allocation/leak/sizing; đã benchmark trên workload thật.

Không đổi khi: chưa đọc GC log/JFR; nguyên nhân gốc là allocation cao, leak, sizing sai; hoặc chỉ vì "blog nói nhanh hơn".

### Lỗi hay gặp
- **Copy-paste flag**: mỗi workload khác nhau.
- **Chỉ nhìn pause, bỏ throughput/CPU**: low-pause GC có thể tốn CPU.
- **Nhầm allocation rate cao với leak**: allocation cao -> GC dày; leak -> heap sau GC tăng dần.

### Trả lời mẫu khi phỏng vấn
"GC tuning của tôi bắt đầu từ SLO và đặc tính workload. Tôi chọn collector theo đánh đổi: Parallel cho throughput/batch, G1 cho cân bằng trên server, ZGC generational khi cần pause rất thấp với heap lớn. Tôi bật GC log và dùng JFR để đọc pause duration, frequency, allocation rate, promotion và nguyên nhân GC. Về heap sizing, tôi thường đặt Xms bằng Xmx trên server và đảm bảo heap đủ để GC không chạy quá dày; với G1 dùng MaxGCPauseMillis như mục tiêu thực tế. Tôi chỉ đổi collector khi có baseline và xác nhận vấn đề không đến từ allocation cao, leak hay sizing sai. GC tuning là đo, đổi một thứ, rồi đo lại."

> Senior tip: thứ tự hiệu quả: (1) allocation rate có quá cao không, (2) có leak/retention không, (3) heap sizing phù hợp không, (4) mới chọn/đổi collector và tinh chỉnh flag. Đảo thứ tự này thường tốn thời gian và rủi ro.`,
  follow: ['Làm sao phân biệt allocation rate cao với memory leak qua GC log?', 'MaxGCPauseMillis của G1 có phải cam kết cứng không?'],
  tags: ['GC tuning', 'collector', 'heap', 'pause', 'GC log']
}
);