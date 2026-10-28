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
  a: `**Tóm tắt:** G1 cân bằng throughput và pause với mục tiêu pause mềm; Generational ZGC hướng tới pause rất ngắn bằng cách làm nhiều việc concurrent. Quyết định dựa trên SLO, CPU/RSS headroom và benchmark với đúng runtime, không dựa vào một con số pause duy nhất.

### Trade-off
- G1 chia heap thành regions, có young/mixed collection và concurrent marking; một số pha vẫn stop-the-world. MaxGCPauseMillis là mục tiêu, không phải SLA.
- Generational ZGC tận dụng tuổi object; ZGC dùng load barrier để làm nhiều công việc khi ứng dụng chạy. JEP 439 đưa generational mode vào JDK 21.
- Concurrent work tiêu thụ CPU. Nếu CPU quota đã sát trần, giảm pause có thể đổi thành throughput thấp hơn.

### Quy trình chọn
1. Chạy cùng heap limit, JDK build, container quota, dataset và request mix.
2. Warm-up ổn định; đo nhiều lần cả peak lẫn burst và cold deploy.
3. So p99/p999, throughput, CPU, RSS, allocation rate, pause distribution và thời gian GC.
4. Canary một nhóm instance, giữ cấu hình rollback.

~~~bash
-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags
~~~

Đọc log cùng JFR; lưu ý metaspace, direct memory và thread stack cũng nằm trong RSS ngoài heap.

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
  a: `**Tóm tắt:** JIT có thể chứng minh object không escape khỏi phạm vi cần thiết rồi thay field bằng scalar, loại allocation và lock không cần. Đây là tối ưu runtime phụ thuộc profile, không phải cam kết của ngôn ngữ hay bytecode.

### Quá trình
- Interpreter/C1 thu thập profile; tiered compilation có thể chuyển method nóng cho C2.
- Escape analysis tìm reference bị return, lưu vào field/static hoặc truyền tới call không thể phân tích.
- Nếu object không escape, scalar replacement có thể giữ từng field trong registers; lock elimination cũng có thể bỏ monitor không quan sát được.
- Giả định profile đổi có thể khiến deoptimization và biên dịch lại.

### Đo đúng
- Dùng JFR hoặc async-profiler allocation mode để tìm hot allocation trên workload thật.
- JMH cần warm-up, fork và chống dead-code elimination; benchmark một vòng lạnh thường đo interpreter.
- Object escape hoặc code quá phức tạp có thể ngăn tối ưu. Không kết luận rằng record luôn được stack allocate.

> Senior tip: tối ưu allocation khi allocation flame graph chứng minh nó chiếm đáng kể CPU/GC. Thiết kế code rõ ràng trước, đừng phụ thuộc vào một tối ưu JIT khó tái lập giữa JDK.`,
  follow: ['Escape qua field static tác động phân tích ra sao?', 'Vì sao JMH cần warm-up và fork?'],
  tags: ['JIT', 'escape analysis', 'scalar replacement']
},
{
  id: 'jvm-025',
  topic: 'jvm',
  level: 'lead',
  q: 'Latency tăng vài phút sau deploy rồi giảm; compilation và deoptimization tăng. Bạn giải thích tiered compilation và điều tra thế nào?',
  a: `**Tóm tắt:** HotSpot khởi động bằng interpreter/C1, thu profile rồi biên dịch method nóng với C2; warm-up và deoptimization có thể làm latency thay đổi sau deploy. Cần đối chiếu JIT activity, code cache, class loading và GC trước khi đổi compiler flags.

### Tiered compilation
- Interpreter chạy bytecode và ghi nhận invocation/back-edge counters.
- C1 biên dịch nhanh ở các mức tối ưu và có thể gắn instrumentation.
- C2 dùng profile để inline và tối ưu mạnh. Khi giả định kiểu hoặc hierarchy không còn đúng, code có thể deoptimize về mức thấp hơn.
- Code cache lưu machine code; đầy code cache có thể làm compilation ngừng hoặc suy giảm.

### Điều tra
- Ghi JFR và compilation/deoptimization log ngắn hạn ở canary; xem CPU của compiler thread, code cache usage, class loading.
- Tách warm-up khỏi khởi tạo connection pool, cache, CDS và GC; các hiện tượng này thường cùng xảy ra sau deploy.
- Warm-up có kiểm soát trước khi nhận traffic, nhưng phải chạy code path thật.
- Không tắt tiered compilation chỉ dựa vào tương quan. Thay đổi có thể làm throughput ổn định thấp hơn.

### Pitfall
- Health check thường không làm nóng hot path.
- Benchmark cần đủ warm-up và cùng image/runtime với production.
- CDS/AOT có thể giảm startup/class loading nhưng không loại mọi JIT warm-up.

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
    { type: 'doc', title: 'async-profiler', url: 'https://github.com/async-profiler/async-profiler' }
  ]
}
);


