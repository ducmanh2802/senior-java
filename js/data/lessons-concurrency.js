/* Bài học track "concurrency". Schema & markup: AGENTS.md mục 12 (bài mẫu: lessons-collections.js). */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-concurrency-001',
  track: 'concurrency',
  order: 1,
  title: 'Java Memory Model: visibility, volatile và happens-before',
  level: 'mid',
  minutes: 30,
  goals: [
    'Giải thích được vì sao một thread có thể **không bao giờ** thấy giá trị mà thread khác đã ghi',
    'Liệt kê các quy tắc happens-before quan trọng và dùng chúng để chứng minh một đoạn code đúng hay sai',
    'Biết {{volatile}} đảm bảo gì (visibility, thứ tự) và không đảm bảo gì (tính nguyên tử của {{count++}})',
    'Viết đúng cờ dừng thread và double-checked locking',
  ],
  body: `### Vấn đề: ghi rồi mà thread khác không thấy
Đoạn code sau trông vô hại nhưng có thể chạy **mãi mãi**:

~~~java
class Poller {
    private boolean running = true;          // biến thường, KHÔNG volatile
    void loop() { while (running) { /* poll */ } }   // thread A
    void stop() { running = false; }         // thread B gọi
}
~~~

Có ba tầng có thể "giấu" lệnh ghi của thread B khỏi thread A:

1. **JIT compiler**: thấy thân vòng lặp không ghi {{running}}, C2 được phép đọc biến **một lần** rồi biến vòng lặp thành {{if (running) while (true)}} (hoisting). Từ đó thread A không bao giờ đọc lại bộ nhớ.
2. **CPU**: mỗi core có store buffer và cache riêng; lệnh ghi có thể nằm trong store buffer một lúc, và các lệnh đọc/ghi có thể được sắp xếp lại.
3. **Compiler/CPU reordering**: hai lệnh ghi vào hai biến khác nhau có thể được thread khác thấy theo thứ tự ngược lại.

Java không bắt bạn hiểu từng loại CPU. Thay vào đó, **Java Memory Model** (JLS chương 17) đưa ra một hợp đồng: nếu hai thao tác có quan hệ **happens-before** thì kết quả của thao tác trước chắc chắn được thấy bởi thao tác sau. Không có quan hệ đó thì mọi kết quả đều hợp lệ, kể cả "không bao giờ thấy". Đó gọi là **data race**.

### Các quy tắc happens-before cần thuộc
| Quy tắc | Ý nghĩa thực tế |
|---|---|
| Program order | Trong **một** thread, lệnh trước happens-before lệnh sau |
| Monitor lock | {{unlock}} một monitor happens-before mọi {{lock}} **sau đó** trên **cùng** monitor |
| Volatile | Ghi biến volatile happens-before mọi lần đọc **sau đó** của **cùng** biến đó |
| Thread start | {{t.start()}} happens-before mọi lệnh trong thread {{t}} |
| Thread join | Mọi lệnh trong {{t}} happens-before {{t.join()}} trả về (hoặc {{isAlive()}} trả về false) |
| Interrupt | {{t.interrupt()}} happens-before lúc {{t}} phát hiện bị interrupt |
| Final field | Ghi field {{final}} trong constructor được thấy đúng bởi thread nào nhận reference sau khi constructor xong (nếu không để lộ {{this}}) |
| Transitivity | A hb B và B hb C thì A hb C |

Quy tắc **bắc cầu** là thứ làm mọi công cụ đồng bộ hoạt động. Ví dụ "piggyback" trên volatile:

~~~java
int data;                    // biến thường
volatile boolean ready;      // biến "cổng"

// Thread A
data = 42;                   // (1) program order: (1) hb (2)
ready = true;                // (2) ghi volatile

// Thread B
if (ready) {                 // (3) đọc volatile thấy true: (2) hb (3)
    System.out.println(data);   // (4) bắc cầu (1) hb (4): chắc chắn in 42
}
~~~

Lưu ý điều kiện: B phải **đọc chính biến volatile đó** và **thấy giá trị A đã ghi**. Đọc một biến volatile khác thì không có quan hệ nào cả.

### volatile làm gì bên dưới
- **Visibility**: mỗi lần đọc volatile phải lấy giá trị mới nhất theo thứ tự đồng bộ; JIT không được cache nó trong thanh ghi hay hoist ra khỏi vòng lặp.
- **Ordering**: lệnh ghi thường **trước** một lệnh ghi volatile không được dời xuống sau nó; lệnh đọc thường **sau** một lệnh đọc volatile không được dời lên trước nó. Trên x86, HotSpot chèn một barrier (thường là lệnh có tiền tố {{lock}}) sau lệnh ghi volatile; lệnh đọc volatile gần như miễn phí.
- **Atomic cho long/double**: JLS cho phép ghi {{long}}/{{double}} thường bị tách làm hai nửa 32 bit; khai báo volatile thì không.

Nhưng volatile **không** biến thao tác ghép thành nguyên tử. {{count++}} là ba bước đọc, cộng, ghi; hai thread cùng đọc 5 rồi cùng ghi 6 vẫn mất một lần tăng, dù {{count}} là volatile.

| Nhu cầu | Công cụ đúng |
|---|---|
| Một thread ghi cờ, thread khác đọc (stop flag, config reload) | {{volatile boolean}} |
| Đếm/cộng dồn từ nhiều thread | {{AtomicLong}}, {{LongAdder}} |
| Check-then-act, cập nhật nhiều biến cùng lúc | {{synchronized}} / {{Lock}} |
| Publish object một lần sau khi tạo xong | field {{final}}, hoặc volatile, hoặc qua {{ConcurrentHashMap}}/{{BlockingQueue}} |

### Double-checked locking và vì sao cần volatile
~~~java
private volatile Config cfg;               // thiếu volatile là bug
Config get() {
    Config c = cfg;                        // đọc volatile 1 lần (nhanh)
    if (c == null) {
        synchronized (this) {
            c = cfg;                       // kiểm tra lại trong khoá
            if (c == null) cfg = c = new Config();
        }
    }
    return c;
}
~~~
{{new Config()}} gồm: cấp phát, chạy constructor, gán reference. Không có volatile, phép gán reference có thể được thread khác thấy **trước** khi các field trong constructor được thấy, nên thread đi đường nhanh (không vào synchronized) nhận một object "nửa vời". Volatile tạo cạnh happens-before giữa lệnh ghi {{cfg}} và lệnh đọc {{cfg}}, nên mọi field đã ghi trong constructor đều được thấy. Nếu chỉ cần singleton tĩnh, **holder idiom** ({{static class Holder}} với field static final) đơn giản hơn vì JVM đã đảm bảo class init chỉ chạy một lần và an toàn.

### Lỗi production hay gặp
- **Cờ dừng không volatile** trong một bean Spring hoặc consumer Kafka tự viết: gọi {{shutdown()}} mà thread không dừng, pod bị kill sau grace period và mất message đang xử lý. Lỗi này thường chỉ lộ ra sau khi JIT đã tối ưu xong (chạy lâu), nên test ngắn trên máy dev vẫn pass.
- Dùng {{volatile int counter}} rồi {{counter++}}: số liệu metric thấp hơn thực tế khi tải cao.
- **Để lộ {{this}} trong constructor** (đăng ký listener, start thread trong constructor): thread khác thấy object khi field {{final}} chưa chắc đã được ghi.
- Tin rằng "x86 có memory model mạnh nên không sao": JIT reordering và hoisting vẫn xảy ra trên x86, và code còn chạy trên ARM (Graviton, Apple Silicon) với memory model yếu hơn.
- Sửa data race bằng {{Thread.sleep}}: sleep không tạo ra quan hệ happens-before nào.

> Muốn kiểm chứng một đoạn code có data race hay không, đừng dựa vào "chạy thử thấy đúng". Hãy chỉ ra **chuỗi happens-before** từ lệnh ghi tới lệnh đọc. Không chỉ ra được thì code sai, dù test có pass.

### Liên hệ phỏng vấn
Câu hỏi kinh điển: "volatile khác synchronized thế nào?", "volatile count++ có thread-safe không?", "vì sao DCL cần volatile?" và "thread này có thể không dừng không?". Câu trả lời senior luôn nêu đúng tên quy tắc happens-before đang dùng (volatile write/read, unlock/lock, start/join) thay vì nói chung chung "volatile đọc thẳng từ RAM", vì cách nói đó sai về mặt kỹ thuật: cache coherence của CPU vẫn hoạt động, vấn đề nằm ở JIT, store buffer và reordering.`,
  exercises: [
    {
      title: 'Sửa cờ dừng thread và publish kết quả an toàn',
      prompt: `{{StopFlagWorker}} chạy trên một thread riêng, lặp gọi {{unitOfWork.run()}} cho tới khi thread khác gọi {{requestStop()}}. Khi dừng, nó công bố số vòng đã chạy cho thread khác đọc.

Yêu cầu:
- {{run()}}: lặp **trong khi chưa có yêu cầu dừng**: mỗi vòng gọi {{unitOfWork.run()}} và đếm. Kiểm tra cờ **trước** mỗi vòng (yêu cầu dừng trước khi chạy thì không chạy vòng nào). Khi thoát vòng lặp: ghi số vòng vào {{iterations}} rồi đánh dấu {{finished}}.
- {{requestStop()}}: yêu cầu dừng; gọi từ thread khác.
- {{isFinished()}}: true sau khi {{run()}} đã ghi xong kết quả.
- {{iterations()}}: số vòng đã chạy; thread khác đọc ngay sau khi thấy {{isFinished()}} là true (không join) và phải thấy **đúng** giá trị.

Ràng buộc kiểm tra bằng reflection: **mọi field kiểu {{boolean}} phải là {{volatile}}** (hoặc dùng {{AtomicBoolean}}). Test không dựa vào việc JIT có hoist vòng lặp hay không: thread không dừng trong 2 giây là FAIL.`,
      starter: `class StopFlagWorker implements Runnable {
    private final Runnable unitOfWork;
    private boolean stopRequested;   // BUG: thread worker có thể không bao giờ thấy giá trị mới
    private long iterations;
    private boolean finished;

    StopFlagWorker(Runnable unitOfWork) {
        this.unitOfWork = unitOfWork;
    }

    @Override public void run() {
        throw new UnsupportedOperationException("TODO");
    }

    void requestStop() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isFinished() {
        throw new UnsupportedOperationException("TODO");
    }

    long iterations() {
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
    // thread daemon: nếu worker không dừng, JVM vẫn thoát được để in RESULT
    static Thread startDaemon(Runnable r, String name) {
        Thread t = new Thread(r, name);
        t.setDaemon(true);
        t.start();
        return t;
    }
    static void awaitTrue(BooleanSupplier cond, long ms, String what) {
        long end = System.nanoTime() + ms * 1_000_000L;
        while (!cond.getAsBoolean()) {
            if (System.nanoTime() > end) throw new AssertionError("timeout " + ms + "ms: " + what);
            Thread.onSpinWait();
        }
    }
    static void awaitLatch(CountDownLatch l, String what) {
        try { if (!l.await(2, TimeUnit.SECONDS)) throw new AssertionError("timeout: " + what); }
        catch (InterruptedException e) { throw new AssertionError(e); }
    }
    static void joinOrFail(Thread t, String what) {
        try { t.join(2000); } catch (InterruptedException e) { throw new AssertionError(e); }
        if (t.isAlive()) throw new AssertionError(what + ": thread vẫn chạy sau 2s (cờ dừng không được thấy?)");
    }
    public static void main(String[] args) {
        check("boolean fields are volatile (or AtomicBoolean)", () -> {
            int flags = 0;
            for (java.lang.reflect.Field f : StopFlagWorker.class.getDeclaredFields()) {
                boolean vol = java.lang.reflect.Modifier.isVolatile(f.getModifiers());
                if (f.getType() == boolean.class && !vol) throw new AssertionError("field '" + f.getName() + "' là boolean thường, cần volatile");
                if ((f.getType() == boolean.class && vol) || f.getType() == AtomicBoolean.class) flags++;
            }
            if (flags == 0) throw new AssertionError("không thấy cờ volatile boolean / AtomicBoolean nào");
        });
        check("not finished before run", () -> {
            StopFlagWorker w = new StopFlagWorker(() -> { });
            eq(false, w.isFinished());
        });
        check("stops within 2s after requestStop", () -> {
            AtomicLong calls = new AtomicLong();
            CountDownLatch started = new CountDownLatch(1);
            StopFlagWorker w = new StopFlagWorker(() -> { calls.incrementAndGet(); started.countDown(); });
            Thread t = startDaemon(w, "worker-1");
            awaitLatch(started, "worker chưa chạy vòng nào");
            w.requestStop();
            joinOrFail(t, "worker-1");
            eq(true, w.isFinished());
        });
        check("result is published via the finished flag (no join)", () -> {
            AtomicLong calls = new AtomicLong();
            CountDownLatch started = new CountDownLatch(1);
            StopFlagWorker w = new StopFlagWorker(() -> { calls.incrementAndGet(); started.countDown(); });
            startDaemon(w, "worker-2");
            awaitLatch(started, "worker chưa chạy vòng nào");
            w.requestStop();
            awaitTrue(w::isFinished, 2000, "isFinished() không thành true");
            eq(calls.get(), w.iterations());
            if (w.iterations() < 1) throw new AssertionError("iterations phải >= 1");
        });
        check("stop before start: zero iterations, returns at once", () -> {
            AtomicLong calls = new AtomicLong();
            StopFlagWorker w = new StopFlagWorker(calls::incrementAndGet);
            w.requestStop();
            Thread t = startDaemon(w, "worker-3");
            joinOrFail(t, "worker-3");
            eq(true, w.isFinished()); eq(0L, w.iterations()); eq(0L, calls.get());
        });
        check("each worker has its own flag", () -> {
            StopFlagWorker[] ws = new StopFlagWorker[4];
            Thread[] ts = new Thread[4];
            CountDownLatch started = new CountDownLatch(4);
            for (int i = 0; i < 4; i++) {
                AtomicBoolean first = new AtomicBoolean(true);
                ws[i] = new StopFlagWorker(() -> { if (first.getAndSet(false)) started.countDown(); });
                ts[i] = startDaemon(ws[i], "w" + i);
            }
            awaitLatch(started, "chưa đủ 4 worker chạy");
            ws[0].requestStop(); ws[1].requestStop();
            joinOrFail(ts[0], "w0"); joinOrFail(ts[1], "w1");
            if (!ts[2].isAlive() || !ts[3].isAlive()) throw new AssertionError("dừng w0, w1 mà w2/w3 cũng dừng: cờ không được dùng chung (static?)");
            eq(false, ws[2].isFinished());
            ws[2].requestStop(); ws[3].requestStop();
            joinOrFail(ts[2], "w2"); joinOrFail(ts[3], "w3");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class StopFlagWorker implements Runnable {
    private final Runnable unitOfWork;
    private volatile boolean stopRequested;   // ghi ở thread gọi stop, đọc ở thread worker
    private long iterations;                  // biến thường: được publish nhờ ghi volatile 'finished' sau nó
    private volatile boolean finished;

    StopFlagWorker(Runnable unitOfWork) {
        this.unitOfWork = unitOfWork;
    }

    @Override public void run() {
        long n = 0;
        while (!stopRequested) {   // đọc volatile mỗi vòng: JIT không được hoist ra ngoài
            unitOfWork.run();
            n++;
        }
        iterations = n;            // (1) ghi thường
        finished = true;           // (2) ghi volatile: (1) hb (2)
    }

    void requestStop() {
        stopRequested = true;
    }

    boolean isFinished() {
        return finished;           // đọc volatile thấy true: (2) hb lần đọc này
    }

    long iterations() {
        return iterations;         // gọi sau khi thấy finished = true nên thấy đúng (1) nhờ bắc cầu
    }
}`,
      hints: [
        'Cờ {{stopRequested}} được ghi ở thread này và đọc ở thread khác: khai báo {{volatile}}.',
        'Đếm bằng biến local trong {{run()}}, thoát vòng lặp mới ghi vào field {{iterations}}.',
        'Thứ tự quan trọng: ghi {{iterations}} **trước**, rồi mới ghi {{finished = true}} (volatile). Thread đọc thấy {{finished}} là true thì nhờ bắc cầu cũng thấy {{iterations}}.',
      ],
      explain: `Hai cạnh happens-before làm lời giải đúng:
- {{requestStop()}} ghi volatile {{stopRequested}}, vòng lặp đọc volatile mỗi lần, nên lần đọc **sau** lệnh ghi chắc chắn thấy true. JIT không được biến vòng lặp thành {{while (true)}}.
- {{iterations = n}} đứng trước {{finished = true}} trong program order; thread kiểm tra thấy {{isFinished()}} là true thì có cạnh volatile write/read, bắc cầu sang lệnh ghi {{iterations}}. Đây là kỹ thuật "piggyback": chỉ một biến volatile làm cổng cho nhiều biến thường.

Lỗi hay gặp:
- Đảo thứ tự: ghi {{finished = true}} trước rồi mới ghi {{iterations}}: thread đọc có thể thấy finished nhưng iterations vẫn là 0.
- Dùng cờ {{static}}: dừng một worker thì mọi worker cùng dừng.
- Không sửa cờ mà thêm {{Thread.sleep}} hay {{System.out.println}} trong vòng lặp "cho chắc": trên HotSpot, println có synchronized bên trong nên thường **tình cờ** chạy đúng, nhưng JMM không đảm bảo gì; bỏ dòng log là bug quay lại.
- Thay vì volatile, dùng {{Thread.interrupt()}} cũng là một cách dừng hợp lệ, và còn đánh thức được thread đang {{sleep}}/{{wait}}; cờ volatile không làm được điều đó.`,
    },
    {
      title: 'Lazy initialization bằng double-checked locking',
      prompt: `Viết {{Lazy<T>}}: giữ một {{Supplier<T>}} và chỉ gọi nó khi {{get()}} được gọi lần đầu. Nhiều thread có thể gọi {{get()}} đồng thời.

Yêu cầu:
- Supplier được gọi **đúng một lần** dù 16 thread cùng gọi {{get()}}; mọi thread nhận **cùng một** instance.
- Nếu supplier ném exception: {{get()}} ném lại exception đó và **chưa** lưu gì, lần gọi sau thử lại supplier.
- Sau khi đã khởi tạo, {{get()}} không vào khối synchronized nữa (double-checked locking).
- Giả sử supplier không trả về null.

Ràng buộc kiểm tra bằng reflection: **mọi field không final phải là {{volatile}}**.`,
      starter: `class Lazy<T> {
    private final Supplier<T> supplier;
    private T value;   // TODO: thiếu gì để DCL đúng?

    Lazy(Supplier<T> supplier) {
        this.supplier = supplier;
    }

    T get() {
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
    static final ThreadFactory DAEMON = r -> { Thread t = new Thread(r); t.setDaemon(true); return t; };
    static void runConcurrently(int threads, IntConsumer task) {
        ExecutorService pool = Executors.newFixedThreadPool(threads, DAEMON);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> fs = new ArrayList<>();
        try {
            for (int t = 0; t < threads; t++) {
                final int id = t;
                fs.add(pool.submit(() -> { start.await(); task.accept(id); return null; }));
            }
            start.countDown();
            pool.shutdown();
            if (!pool.awaitTermination(10, TimeUnit.SECONDS)) throw new AssertionError("timeout: có thể bị deadlock");
            for (Future<?> f : fs) f.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new AssertionError("task lỗi: " + (e.getCause() != null ? e.getCause() : e));
        } finally {
            pool.shutdownNow();
        }
    }
    static void pause(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    public static void main(String[] args) {
        check("non-final fields are volatile", () -> {
            int mutable = 0;
            for (java.lang.reflect.Field f : Lazy.class.getDeclaredFields()) {
                int m = f.getModifiers();
                if (java.lang.reflect.Modifier.isStatic(m) || java.lang.reflect.Modifier.isFinal(m)) continue;
                mutable++;
                if (!java.lang.reflect.Modifier.isVolatile(m)) throw new AssertionError("field '" + f.getName() + "' không final mà cũng không volatile");
            }
            if (mutable == 0) throw new AssertionError("cần một field (volatile) để lưu giá trị");
        });
        check("single thread: supplier called once, same instance", () -> {
            AtomicInteger calls = new AtomicInteger();
            Lazy<StringBuilder> lazy = new Lazy<>(() -> { calls.incrementAndGet(); return new StringBuilder("cfg"); });
            eq(0, calls.get());
            StringBuilder a = lazy.get(), b = lazy.get();
            if (a != b) throw new AssertionError("hai lần get() trả về hai object khác nhau");
            eq(1, calls.get()); eq("cfg", a.toString());
        });
        check("16 threads race x 20 rounds: supplier called exactly once", () -> {
            for (int round = 0; round < 20; round++) {
                AtomicInteger calls = new AtomicInteger();
                Lazy<Object> lazy = new Lazy<>(() -> { calls.incrementAndGet(); pause(10); return new Object(); });
                Object[] seen = new Object[16];
                runConcurrently(16, id -> seen[id] = lazy.get());
                eq(1, calls.get());
                for (Object o : seen) if (o != seen[0]) throw new AssertionError("các thread nhận instance khác nhau");
            }
        });
        check("supplier failure is not cached, next call retries", () -> {
            AtomicInteger calls = new AtomicInteger();
            Lazy<String> lazy = new Lazy<>(() -> {
                if (calls.incrementAndGet() == 1) throw new IllegalStateException("db down");
                return "ok";
            });
            try { lazy.get(); throw new AssertionError("lần đầu phải ném IllegalStateException"); }
            catch (IllegalStateException expected) { }
            eq("ok", lazy.get()); eq("ok", lazy.get()); eq(2, calls.get());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Lazy<T> {
    private final Supplier<T> supplier;
    private volatile T value;   // volatile: thread đi đường nhanh thấy object đã khởi tạo đầy đủ

    Lazy(Supplier<T> supplier) {
        this.supplier = supplier;
    }

    T get() {
        T v = value;                  // đọc volatile một lần vào biến local
        if (v == null) {              // lần kiểm tra 1: không khoá
            synchronized (this) {
                v = value;            // lần kiểm tra 2: trong khoá, có thể thread khác vừa khởi tạo
                if (v == null) {
                    v = supplier.get();   // ném exception thì value vẫn null, lần sau thử lại
                    value = v;            // ghi volatile: publish an toàn
                }
            }
        }
        return v;
    }
}`,
      hints: [
        'Khai báo {{private volatile T value}}.',
        'Kiểm tra null hai lần: một lần ngoài khoá (đường nhanh), một lần trong {{synchronized (this)}} vì thread khác có thể đã khởi tạo khi bạn đang chờ khoá.',
        'Đọc field volatile vào biến local {{v}} rồi dùng {{v}}: vừa giảm số lần đọc volatile, vừa tránh đọc hai lần ra hai giá trị.',
      ],
      explain: `Lần kiểm tra thứ hai là thứ đảm bảo supplier chỉ chạy một lần: 16 thread cùng thấy null ở lần 1, xếp hàng vào khoá, thread đầu khởi tạo, 15 thread sau vào khoá thấy giá trị đã có. Bỏ lần kiểm tra 2 thì test 16 thread sẽ thấy supplier chạy nhiều lần.

Volatile cần cho **đường nhanh**: thread không vào synchronized nên không có cạnh unlock/lock nào với thread đã khởi tạo. Không volatile, JMM cho phép thread đó thấy reference khác null nhưng các field bên trong object chưa được ghi. Lỗi này hiếm gặp trên x86 nên test thường không bắt được, vì vậy bài tập kiểm tra bằng reflection.

Lỗi hay gặp: gán {{value = supplier.get()}} rồi mới đọc lại {{value}} để trả về (thêm một lần đọc volatile, không sai nhưng thừa); cache cả exception làm hệ thống "chết" vĩnh viễn sau một lần DB chập chờn. Trong code thật, singleton tĩnh nên dùng holder idiom; với Java 17+ có thể cân nhắc thư viện có sẵn (ví dụ {{Suppliers.memoize}} của Guava) thay vì tự viết.`,
    },
  ],
  check: [
    {
      q: 'Thread A: {{data = 42; ready = true;}} ({{ready}} là volatile, {{data}} là biến thường). Thread B: {{if (ready) print(data);}}. B in ra gì nếu vào được nhánh if?',
      options: ['Luôn là 42', 'Có thể là 0 vì data không volatile', 'Có thể là 0 hoặc 42 tuỳ CPU', 'Không xác định vì không có synchronized'],
      answer: 0,
      explain: `Ghi {{data}} đứng trước ghi volatile {{ready}} (program order); B đọc {{ready}} thấy true nên có cạnh volatile write/read; bắc cầu cho {{data = 42}} happens-before {{print(data)}}. "data không volatile" là sai vì data được piggyback qua ready. Kết quả không phụ thuộc CPU: JMM đảm bảo cho mọi nền tảng. Synchronized không bắt buộc: volatile cũng tạo happens-before.`,
    },
    {
      q: '{{volatile int count}} được 4 thread cùng chạy {{count++}} mỗi thread 1.000 lần. Kết quả cuối?',
      options: ['Luôn là 4000 vì volatile đảm bảo visibility', 'Có thể nhỏ hơn 4000', 'Có thể lớn hơn 4000', 'Ném ConcurrentModificationException'],
      answer: 1,
      explain: `{{count++}} là đọc, cộng, ghi: hai thread cùng đọc 10 rồi cùng ghi 11 thì mất một lần tăng. Volatile chỉ đảm bảo mỗi lần đọc thấy giá trị mới nhất **tại lúc đọc**, không khoá cả chuỗi ba bước. Không thể lớn hơn 4000 vì mỗi lần tăng chỉ cộng 1 vào một giá trị đã từng tồn tại. CME chỉ liên quan tới collection. Dùng {{AtomicInteger.incrementAndGet()}} hoặc {{LongAdder}}.`,
    },
    {
      q: 'Quy tắc happens-before nào đảm bảo main thread thấy mọi lệnh ghi của thread {{t}} sau khi gọi {{t.join()}}?',
      options: ['Program order', 'Quy tắc volatile', 'Quy tắc thread termination: mọi lệnh trong t happens-before join() trả về', 'Không có, cần thêm volatile'],
      answer: 2,
      explain: `JLS định nghĩa: mọi lệnh trong một thread happens-before việc thread khác phát hiện nó đã kết thúc (join trả về hoặc isAlive trả về false). Program order chỉ áp dụng trong **một** thread. Quy tắc volatile cần một biến volatile được ghi và đọc, ở đây không có. Không cần thêm volatile: join đã đủ.`,
    },
  ],
  related: ['concurrency-001', 'concurrency-010', 'concurrency-018'],
  tags: ['JMM', 'volatile', 'happens-before', 'visibility', 'DCL'],
},
{
  id: 'lesson-concurrency-002',
  track: 'concurrency',
  order: 2,
  title: 'synchronized, ReentrantLock và Atomic: chọn đúng công cụ, tránh deadlock',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được {{synchronized}} và {{ReentrantLock}} hoạt động bên trong ra sao và khi nào cần tính năng riêng của ReentrantLock',
    'Biết khi nào CAS/{{AtomicLong}}/{{LongAdder}} đủ dùng và khi nào không',
    'Nhận ra 4 điều kiện của deadlock và phá điều kiện "chờ vòng tròn" bằng khoá theo thứ tự',
    'Viết được hàm chuyển tiền đồng thời không mất tiền, không âm số dư, không deadlock',
  ],
  body: `### Bài toán: chuyển tiền giữa hai tài khoản
Chuyển tiền là **hai lệnh ghi phải đi cùng nhau**: trừ tài khoản nguồn và cộng tài khoản đích, kèm điều kiện "đủ số dư". Nếu thread khác chen vào giữa, bạn có thể thấy tiền "biến mất" (đã trừ, chưa cộng), hoặc hai thread cùng thấy đủ tiền và cùng trừ, làm số dư âm. Volatile (bài trước) không giúp được, vì vấn đề là **tính nguyên tử của cả nhóm thao tác**, không chỉ visibility. Ta cần **mutual exclusion**.

### synchronized: khoá gắn sẵn trong mọi object
Mỗi object Java đều có thể làm monitor. {{synchronized (obj)}} được biên dịch thành cặp bytecode {{monitorenter}}/{{monitorexit}} (method synchronized dùng cờ {{ACC_SYNCHRONIZED}}), và compiler tự sinh nhánh {{monitorexit}} cho cả đường ném exception, nên **không bao giờ quên nhả khoá**.

Bên dưới, HotSpot lưu trạng thái khoá trong **mark word** của header object:
1. **Không tranh chấp**: thread lấy khoá bằng một lệnh CAS lên header (lightweight/thin lock), không gọi hệ điều hành.
2. **Có tranh chấp** hoặc gọi {{wait()}}: khoá được "inflate" thành một {{ObjectMonitor}} có hàng đợi; thread không lấy được khoá spin một chút rồi bị park.
3. Biased locking (tối ưu cho trường hợp chỉ một thread dùng khoá) đã bị **tắt mặc định từ JDK 15** (JEP 374) rồi bị gỡ bỏ ở các bản sau, nên đừng dựa vào nó khi giải thích hiệu năng.

synchronized là **reentrant**: thread đang giữ khoá vào lại khối synchronized trên cùng object thì không tự chặn mình (monitor đếm số lần vào). Về bộ nhớ: unlock happens-before lock tiếp theo trên cùng monitor, nên mọi ghi trong khối được thread vào sau thấy hết.

### ReentrantLock: cùng ngữ nghĩa, thêm tính năng
{{ReentrantLock}} được xây trên {{AbstractQueuedSynchronizer}} (AQS): một biến {{volatile int state}} (0 = tự do, n = số lần thread chủ đã vào) thay đổi bằng CAS, cộng một hàng đợi FIFO các thread chờ, bị park/unpark bằng {{LockSupport}}. Ngữ nghĩa bộ nhớ giống hệt synchronized. Thứ bạn trả thêm là phải tự {{unlock()}} trong {{finally}}; thứ bạn nhận được:

| Tính năng | synchronized | ReentrantLock |
|---|---|---|
| Chờ khoá có timeout | Không | {{tryLock(100, MILLISECONDS)}} |
| Huỷ khi đang chờ khoá (interrupt) | Không | {{lockInterruptibly()}} |
| Fair (ai chờ trước được trước) | Không | {{new ReentrantLock(true)}}, throughput thấp hơn |
| Nhiều điều kiện chờ | Một wait-set mỗi object | Nhiều {{Condition}} ({{notFull}}, {{notEmpty}}) |
| Nhả khoá khi exception | Tự động | Phải viết {{finally}} |
| Thấy trong thread dump / JFR | Có | Có ({{jstack -l}} liệt kê "Locked ownable synchronizers") |

> Mặc định **dùng synchronized** cho khối ngắn: gọn, không quên nhả khoá, JIT tối ưu tốt (lock elision, lock coarsening). Chỉ chọn ReentrantLock khi cần một trong các tính năng ở bảng, hoặc khi chạy trên virtual thread của JDK 21–23 (blocking trong synchronized làm "pin" carrier thread, xem bài 5).

### Atomic và CAS: không khoá, nhưng chỉ cho một biến
{{AtomicLong.incrementAndGet()}} dùng lệnh **compare-and-swap** của CPU (trên x86 là {{lock cmpxchg}}): đọc giá trị cũ, tính giá trị mới, ghi chỉ khi giá trị trong bộ nhớ vẫn là giá trị cũ; thua thì thử lại. Không thread nào bị park, nên không có deadlock. Giới hạn: CAS chỉ bảo vệ **một ô nhớ**. Chuyển tiền cần hai ô cùng đổi, nên không làm được bằng hai AtomicLong riêng (giữa hai CAS vẫn có khoảng hở). Khi rất nhiều thread cùng tăng một bộ đếm, CAS thua liên tục; {{LongAdder}} chia bộ đếm ra nhiều ô (cell) theo thread và chỉ cộng lại khi {{sum()}}, nên phù hợp cho metric.

### Deadlock và khoá theo thứ tự
Deadlock cần đủ **4 điều kiện** (Coffman): mutual exclusion, giữ khoá trong lúc chờ khoá khác (hold and wait), không cướp được khoá (no preemption), và **chờ vòng tròn**. Chuyển tiền ngây thơ tạo ra vòng tròn ngay:

~~~java
// SAI: T1 chuyển A→B khoá A rồi chờ B; T2 chuyển B→A khoá B rồi chờ A → treo vĩnh viễn
synchronized (from) { synchronized (to) { /* ... */ } }

// ĐÚNG: mọi thread luôn khoá tài khoản id nhỏ trước → không thể có vòng tròn
Account first = from.id < to.id ? from : to;
Account second = first == from ? to : from;
first.lock.lock();
try {
    second.lock.lock();
    try {
        if (from.balance < amount) return false;   // kiểm tra và trừ trong CÙNG khoá
        from.balance -= amount;
        to.balance += amount;
        return true;
    } finally { second.lock.unlock(); }
} finally { first.lock.unlock(); }
~~~

Vì sao khoá theo thứ tự chặn được deadlock? Nếu mọi thread lấy khoá theo cùng một thứ tự toàn phần, thread giữ khoá có id lớn nhất trong vòng chờ sẽ không bao giờ phải chờ khoá có id nhỏ hơn, nên vòng tròn không thể khép lại. Cách khác: {{tryLock}} có timeout, thất bại thì nhả hết, chờ ngẫu nhiên rồi thử lại (phá "hold and wait"); cách này cần backoff ngẫu nhiên để tránh livelock.

### Lỗi production hay gặp
- **Gọi IO khi đang giữ khoá** (HTTP, DB, Kafka send): một request chậm làm mọi thread xếp hàng sau nó, thread pool cạn, cả service treo trông như deadlock.
- {{synchronized}} trên {{String}} literal hay {{Integer}} boxed: hai đoạn code không liên quan dùng chung một object được intern/cache, nên khoá lẫn nhau.
- {{lock()}} nằm **bên trong** {{try}}: nếu {{lock()}} ném exception thì {{finally}} gọi {{unlock()}} trên khoá chưa giữ và ném {{IllegalMonitorStateException}}, che mất lỗi gốc. Luôn {{lock()}} ngay trước {{try}}.
- Khoá theo thứ tự nhưng khoá **trong DB**: hai transaction {{UPDATE}} hai dòng theo thứ tự ngược nhau cũng deadlock; PostgreSQL/MySQL phát hiện và huỷ một transaction. Cùng nguyên tắc: cập nhật theo thứ tự khoá chính.
- Chẩn đoán: {{jstack}} in "Found one Java-level deadlock" kèm vòng chờ; trong code dùng {{ThreadMXBean.findDeadlockedThreads()}} cho health check.

### Liên hệ phỏng vấn
Interviewer thường đưa đoạn chuyển tiền và hỏi "có vấn đề gì?". Câu trả lời senior: (1) chỉ ra race nếu không khoá, (2) chỉ ra deadlock khi khoá lồng theo thứ tự tham số, (3) sửa bằng thứ tự theo id, (4) nói thêm giới hạn: trong hệ phân tán, khoá JVM không đủ, phải dùng transaction DB với {{SELECT ... FOR UPDATE}} theo thứ tự id hoặc optimistic locking bằng cột version.`,
  exercises: [
    {
      title: 'Ngân hàng chuyển tiền đồng thời: không mất tiền, không deadlock',
      prompt: `Viết {{Bank}} quản lý các tài khoản đánh số {{0..n-1}} với số dư ban đầu {{initial[i]}}. Nhiều thread gọi đồng thời:

- {{transfer(from, to, amount)}}: nếu tài khoản nguồn đủ tiền thì trừ nguồn, cộng đích, trả về {{true}}; không đủ thì không đổi gì, trả về {{false}}. Ném {{IllegalArgumentException}} khi {{amount <= 0}}, {{from == to}} hoặc id nằm ngoài khoảng.
- {{balance(id)}}: số dư hiện tại.
- {{totalBalance()}}: tổng số dư, phải là **ảnh chụp nhất quán**: gọi giữa lúc các thread khác đang chuyển tiền vẫn phải ra đúng tổng ban đầu.

Test chạy 8 thread chuyển tiền ngược chiều nhau (0→1 và 1→0) hàng trăm nghìn lần: nếu không xong trong 5 giây là FAIL (deadlock). Số dư không bao giờ được âm. Dùng khoá **theo từng tài khoản** (không dùng một khoá chung cho cả ngân hàng) và khoá theo thứ tự id.`,
      starter: `import java.util.concurrent.locks.*;

class Bank {
    private final long[] balances;   // TODO: cần khoá cho từng tài khoản

    Bank(long[] initial) {
        this.balances = initial.clone();
    }

    boolean transfer(int from, int to, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    long balance(int id) {
        throw new UnsupportedOperationException("TODO");
    }

    long totalBalance() {
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
    static void iae(Runnable r, String what) {
        try { r.run(); } catch (IllegalArgumentException e) { return; }
        throw new AssertionError(what + " phải ném IllegalArgumentException");
    }
    // thread daemon: nếu code bị deadlock, JVM vẫn thoát và in RESULT
    static final ThreadFactory DAEMON = r -> { Thread t = new Thread(r); t.setDaemon(true); return t; };
    static void runConcurrently(int threads, IntConsumer task) {
        ExecutorService pool = Executors.newFixedThreadPool(threads, DAEMON);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> fs = new ArrayList<>();
        try {
            for (int t = 0; t < threads; t++) {
                final int id = t;
                fs.add(pool.submit(() -> { start.await(); task.accept(id); return null; }));
            }
            start.countDown();
            pool.shutdown();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) throw new AssertionError("timeout 5s: deadlock?");
            for (Future<?> f : fs) f.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new AssertionError("task lỗi: " + (e.getCause() != null ? e.getCause() : e));
        } finally {
            pool.shutdownNow();
        }
    }
    public static void main(String[] args) {
        check("simple transfer", () -> {
            Bank b = new Bank(new long[] { 100, 50, 0 });
            eq(true, b.transfer(0, 2, 30));
            eq(70L, b.balance(0)); eq(50L, b.balance(1)); eq(30L, b.balance(2)); eq(150L, b.totalBalance());
            eq(true, b.transfer(1, 0, 50)); eq(0L, b.balance(1)); eq(120L, b.balance(0));
        });
        check("insufficient funds: false and nothing changes", () -> {
            Bank b = new Bank(new long[] { 10, 5 });
            eq(false, b.transfer(1, 0, 6));
            eq(10L, b.balance(0)); eq(5L, b.balance(1));
            eq(true, b.transfer(1, 0, 5)); eq(0L, b.balance(1));
        });
        check("invalid arguments throw IllegalArgumentException", () -> {
            Bank b = new Bank(new long[] { 10, 10 });
            iae(() -> b.transfer(0, 1, 0), "amount = 0");
            iae(() -> b.transfer(0, 1, -5), "amount âm");
            iae(() -> b.transfer(1, 1, 5), "from == to");
            iae(() -> b.transfer(0, 2, 5), "id ngoài khoảng");
            eq(20L, b.totalBalance());
        });
        check("opposite transfers 0<->1 on 8 threads: no deadlock, money conserved", () -> {
            Bank b = new Bank(new long[] { 1_000_000, 1_000_000 });
            runConcurrently(8, id -> {
                for (int i = 0; i < 100_000; i++) {
                    if (id % 2 == 0) b.transfer(0, 1, 1); else b.transfer(1, 0, 1);
                }
            });
            eq(1_000_000L, b.balance(0)); eq(1_000_000L, b.balance(1));
        });
        check("random transfers among 10 accounts: total conserved, never negative", () -> {
            int n = 10;
            long[] init = new long[n];
            Arrays.fill(init, 1_000);
            Bank b = new Bank(init);
            runConcurrently(8, id -> {
                Random rnd = new Random(42 + id);
                for (int i = 0; i < 50_000; i++) {
                    int from = rnd.nextInt(n), to = rnd.nextInt(n - 1);
                    if (to >= from) to++;
                    b.transfer(from, to, 1 + rnd.nextInt(100));
                }
            });
            long sum = 0;
            for (int i = 0; i < n; i++) {
                if (b.balance(i) < 0) throw new AssertionError("tài khoản " + i + " âm: " + b.balance(i));
                sum += b.balance(i);
            }
            eq(10_000L, sum); eq(10_000L, b.totalBalance());
        });
        check("8 threads race to drain one account: no overdraft", () -> {
            for (int round = 0; round < 5; round++) {
                Bank b = new Bank(new long[] { 1_000, 0, 0, 0 });
                AtomicInteger ok = new AtomicInteger();
                runConcurrently(8, id -> {
                    for (int i = 0; i < 1_000; i++) if (b.transfer(0, 1 + id % 3, 1)) ok.incrementAndGet();
                });
                eq(1_000, ok.get()); eq(0L, b.balance(0)); eq(1_000L, b.totalBalance());
            }
        });
        check("totalBalance is a consistent snapshot during transfers (4 rounds)", () -> {
          for (int round = 0; round < 4; round++) {
            int n = 6;
            long[] init = new long[n];
            Arrays.fill(init, 500);
            Bank b = new Bank(init);
            AtomicInteger bad = new AtomicInteger(), writersDone = new AtomicInteger();
            runConcurrently(8, id -> {
                if (id < 6) {
                    for (int i = 0; i < 50_000; i++) b.transfer(id, (id + 1 + i % 5) % n, 1 + i % 7);
                    writersDone.incrementAndGet();
                } else {
                    // đọc liên tục cho tới khi mọi thread chuyển tiền xong
                    while (writersDone.get() < 6) if (b.totalBalance() != 3_000L) bad.incrementAndGet();
                }
            });
            eq(0, bad.get()); eq(3_000L, b.totalBalance());
          }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.concurrent.locks.*;

class Bank {
    private final long[] balances;
    private final ReentrantLock[] locks;   // một khoá cho mỗi tài khoản

    Bank(long[] initial) {
        this.balances = initial.clone();
        this.locks = new ReentrantLock[initial.length];
        for (int i = 0; i < locks.length; i++) locks[i] = new ReentrantLock();
    }

    private void checkId(int id) {
        if (id < 0 || id >= balances.length) throw new IllegalArgumentException("bad account " + id);
    }

    boolean transfer(int from, int to, long amount) {
        checkId(from); checkId(to);
        if (amount <= 0) throw new IllegalArgumentException("amount must be > 0");
        if (from == to) throw new IllegalArgumentException("from == to");
        // luôn khoá id nhỏ trước: mọi thread cùng thứ tự nên không thể chờ vòng tròn
        ReentrantLock first = locks[Math.min(from, to)], second = locks[Math.max(from, to)];
        first.lock();
        try {
            second.lock();
            try {
                if (balances[from] < amount) return false;   // check và act trong cùng khoá
                balances[from] -= amount;
                balances[to] += amount;
                return true;
            } finally {
                second.unlock();
            }
        } finally {
            first.unlock();
        }
    }

    long balance(int id) {
        checkId(id);
        locks[id].lock();   // khoá cũng cho visibility: unlock của transfer hb lock này
        try { return balances[id]; } finally { locks[id].unlock(); }
    }

    long totalBalance() {
        // khoá TẤT CẢ theo thứ tự id tăng dần (cùng thứ tự với transfer) để có ảnh chụp nhất quán
        for (ReentrantLock l : locks) l.lock();
        try {
            long sum = 0;
            for (long v : balances) sum += v;
            return sum;
        } finally {
            for (int i = locks.length - 1; i >= 0; i--) locks[i].unlock();
        }
    }
}`,
      hints: [
        'Tạo mảng {{ReentrantLock[]}} (hoặc mảng {{Object}} làm monitor), mỗi tài khoản một khoá.',
        'Trong {{transfer}}: khoá {{min(from, to)}} trước, {{max(from, to)}} sau; kiểm tra số dư **bên trong** cả hai khoá.',
        'Mỗi {{lock()}} đặt ngay trước một {{try}} có {{finally}} gọi {{unlock()}}.',
        '{{totalBalance()}}: khoá tất cả tài khoản theo thứ tự id tăng dần rồi mới cộng; nếu cộng không khoá, bạn có thể đọc lúc tiền đã trừ ở A mà chưa cộng ở B.',
      ],
      explain: `Ba quyết định làm lời giải đúng:
1. **Check-then-act trong khoá**: {{if (balances[from] < amount)}} và lệnh trừ nằm trong cùng vùng khoá của tài khoản nguồn, nên hai thread không thể cùng thấy "đủ tiền". Test "drain one account" đếm đúng 1000 lần thành công.
2. **Thứ tự khoá toàn cục theo id**: transfer(0,1) và transfer(1,0) đều khoá 0 rồi 1, nên không có vòng chờ. Code {{synchronized (from) synchronized (to)}} theo thứ tự tham số gần như chắc chắn treo ở test 0↔1.
3. **totalBalance khoá cùng thứ tự**: lấy hết các khoá theo id tăng dần không thể deadlock với transfer (cũng tăng dần), và trong lúc giữ hết khoá thì không giao dịch nào "đang dở".

Lỗi hay gặp:
- Dùng một {{synchronized}} chung cho cả Bank: đúng nhưng mọi giao dịch chạy tuần tự; câu hỏi phỏng vấn thường hỏi tiếp "làm sao để hai giao dịch không liên quan chạy song song?".
- Dùng {{AtomicLong}} cho từng tài khoản: mỗi tài khoản an toàn nhưng cặp trừ/cộng không nguyên tử, {{totalBalance}} có thể thấy tiền "bay" giữa hai lệnh.
- Đọc {{balance(id)}} không khoá trên mảng {{long[]}}: là data race; ở đây lời giải khoá để có visibility (cũng có thể dùng {{AtomicLongArray}} cho đọc, nhưng ghi vẫn phải trong khoá).

Thay vì khoá theo thứ tự, có thể dùng {{tryLock(timeout)}}: không lấy được khoá thứ hai thì nhả khoá thứ nhất, ngủ một khoảng ngẫu nhiên rồi thử lại. Cách đó phức tạp hơn và có thể livelock nếu không có backoff ngẫu nhiên.`,
    },
  ],
  check: [
    {
      q: 'Khi nào bạn **cần** {{ReentrantLock}} thay vì {{synchronized}}?',
      options: ['Khi cần hiệu năng cao hơn trong mọi trường hợp', 'Khi cần chờ khoá có timeout, huỷ được bằng interrupt, fair lock hoặc nhiều Condition', 'Khi cần reentrant', 'Khi cần đảm bảo visibility giữa các thread'],
      answer: 1,
      explain: `Đó là các tính năng synchronized không có. "Nhanh hơn trong mọi trường hợp" là sai: từ Java 6 synchronized được tối ưu mạnh và thường ngang ReentrantLock. synchronized **cũng** reentrant. Cả hai đều tạo happens-before giữa unlock và lock tiếp theo, nên visibility như nhau.`,
    },
    {
      q: 'Thread T1 gọi {{transfer(A, B)}}, T2 gọi {{transfer(B, A)}}, cả hai dùng {{synchronized (from) synchronized (to)}}. Cách sửa nào loại bỏ deadlock tận gốc?',
      options: ['Đánh dấu hai field balance là volatile', 'Dùng fair lock', 'Luôn khoá tài khoản có id nhỏ hơn trước', 'Gọi Thread.yield() giữa hai lần khoá'],
      answer: 2,
      explain: `Thứ tự khoá toàn cục phá điều kiện chờ vòng tròn, nên deadlock không thể xảy ra. Volatile không liên quan tới khoá. Fair lock chỉ đổi thứ tự **được cấp** khoá cho các thread đang chờ, không phá vòng tròn. {{Thread.yield()}} chỉ làm deadlock hiếm hơn, không loại bỏ.`,
    },
    {
      q: 'Vì sao không làm chuyển tiền bằng hai {{AtomicLong}} (mỗi tài khoản một cái) với {{addAndGet}}?',
      options: ['Vì AtomicLong chậm hơn synchronized', 'Vì CAS chỉ nguyên tử trên một biến; cặp trừ/cộng và điều kiện đủ số dư không còn nguyên tử', 'Vì AtomicLong không đảm bảo visibility', 'Vì AtomicLong có thể gây deadlock'],
      answer: 1,
      explain: `Mỗi lệnh {{addAndGet}} nguyên tử riêng, nhưng giữa hai lệnh có khoảng hở: thread khác thấy tổng tiền sai, và kiểm tra số dư rồi trừ là check-then-act. AtomicLong thường **nhanh hơn** khoá khi tranh chấp vừa phải. Nó có ngữ nghĩa volatile nên visibility được đảm bảo. CAS không park thread nên không gây deadlock.`,
    },
  ],
  related: ['concurrency-002', 'concurrency-006', 'concurrency-009'],
  tags: ['synchronized', 'ReentrantLock', 'AQS', 'CAS', 'deadlock', 'lock ordering'],
},
{
  id: 'lesson-concurrency-003',
  track: 'concurrency',
  order: 3,
  title: 'ExecutorService và ThreadPoolExecutor: thứ tự core → queue → max → reject, sizing và shutdown',
  level: 'senior',
  minutes: 35,
  goals: [
    'Mô tả chính xác {{ThreadPoolExecutor.execute}} quyết định tạo thread, xếp hàng hay từ chối theo thứ tự nào',
    'Giải thích vì sao các factory {{Executors.newFixedThreadPool}}/{{newCachedThreadPool}} nguy hiểm trên production',
    'Ước lượng kích thước pool cho việc CPU-bound và IO-bound, chọn rejection policy phù hợp',
    'Dùng {{invokeAll}}, xử lý exception của task và shutdown pool đúng cách',
  ],
  body: `### Vì sao cần thread pool
Tạo một platform thread tốn kém: mỗi thread là một thread của hệ điều hành, có stack riêng (mặc định khoảng 1 MB vùng nhớ ảo trên Linux x64), tạo và huỷ đều cần system call. Tạo một thread cho mỗi request thì khi tải tăng đột biến, số thread tăng không giới hạn cho tới khi hết bộ nhớ hoặc CPU chỉ còn lo context switch. Thread pool giải quyết hai việc: **tái sử dụng** thread và **giới hạn** số việc chạy đồng thời.

### Sáu tham số của ThreadPoolExecutor
~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    4,                                      // corePoolSize: số thread "thường trực"
    8,                                      // maximumPoolSize: trần số thread
    30, TimeUnit.SECONDS,                   // keepAlive: thread vượt core rảnh quá 30s thì bị huỷ
    new ArrayBlockingQueue<>(100),          // workQueue: hàng đợi CÓ GIỚI HẠN
    namedFactory("order-worker"),           // ThreadFactory: đặt tên để đọc thread dump
    new ThreadPoolExecutor.CallerRunsPolicy() // khi đầy hết: thread gọi tự chạy task
);
~~~

### Thứ tự khi submit một task (hay bị hỏi nhất)
{{execute(task)}} đi qua đúng ba bước:
1. Số thread **< corePoolSize**: tạo thread mới với task này làm task đầu tiên, **kể cả khi các thread core khác đang rảnh**.
2. Ngược lại: thử {{workQueue.offer(task)}}. Còn chỗ thì task vào hàng đợi.
3. Hàng đợi đầy: nếu số thread **< maximumPoolSize** thì tạo thread mới chạy **ngay task này**; nếu đã đủ max thì gọi **RejectedExecutionHandler**.

Hệ quả quan trọng:
- Thread vượt core **chỉ được tạo khi hàng đợi đã đầy**. Với hàng đợi không giới hạn, {{maximumPoolSize}} vô nghĩa: pool không bao giờ vượt core, task chỉ chất đống trong RAM.
- Task kích hoạt thread mới ở bước 3 được chạy **trước** các task đang nằm trong hàng đợi, nên thứ tự thực thi không phải FIFO tuyệt đối.
- Với {{SynchronousQueue}} (không chứa phần tử nào), {{offer}} chỉ thành công khi có thread đang chờ nhận, nên gần như mọi task đều tạo thread mới tới max.

| Factory | Cấu hình thật bên trong | Rủi ro production |
|---|---|---|
| {{newFixedThreadPool(n)}} | core = max = n, {{LinkedBlockingQueue}} không giới hạn | Hàng đợi phình tới OOM khi downstream chậm; độ trễ tăng mà không ai báo lỗi |
| {{newCachedThreadPool()}} | core 0, max {{Integer.MAX_VALUE}}, {{SynchronousQueue}}, keepAlive 60s | Tải đột biến tạo hàng nghìn thread, hết bộ nhớ native |
| {{newSingleThreadExecutor()}} | 1 thread, hàng đợi không giới hạn | Giống fixed: hàng đợi phình |
| {{newScheduledThreadPool(n)}} | hàng đợi delay không giới hạn; max không có tác dụng | Task ném exception thì lịch chạy định kỳ của nó **dừng im lặng** |

### Rejection policy
| Policy | Hành vi | Khi nào dùng |
|---|---|---|
| {{AbortPolicy}} (mặc định) | Ném {{RejectedExecutionException}} | API trả 503/429 ngay, để client retry |
| {{CallerRunsPolicy}} | Thread gọi {{execute}} tự chạy task | Backpressure tự nhiên cho producer nội bộ (consumer đọc queue chậm lại) |
| {{DiscardPolicy}} | Bỏ task, không báo gì | Hầu như không nên; chỉ cho dữ liệu "mất cũng được" như metric mẫu |
| {{DiscardOldestPolicy}} | Bỏ task cũ nhất trong hàng đợi rồi thử lại | Dữ liệu chỉ cần bản mới nhất (vị trí GPS, giá) |

Cẩn thận: CallerRunsPolicy trên thread nhận request của Tomcat nghĩa là thread HTTP đó bị chiếm để chạy task, nên làm chậm cả việc nhận request mới; đó chính là backpressure, nhưng phải hiểu rõ trước khi chọn.

### Sizing: bao nhiêu thread là đủ
- **CPU-bound** (tính toán, nén, mã hoá): khoảng số core ({{Runtime.getRuntime().availableProcessors()}}), thêm nhiều hơn chỉ tăng context switch.
- **IO-bound**: công thức của Brian Goetz: {{threads = cores × (1 + thời gian chờ / thời gian tính)}}. Ví dụ 8 core, mỗi request chờ DB 90 ms và tính 10 ms: 8 × (1 + 9) = 80 thread.
- Kiểm tra bằng **định luật Little**: số việc đồng thời = throughput × latency. Cần 400 request/s, mỗi request 100 ms thì cần khoảng 40 việc chạy song song. Và nhớ giới hạn phía sau: pool 80 thread mà connection pool DB chỉ có 10 connection thì 70 thread sẽ đứng chờ connection.

### Exception, invokeAll và shutdown
- {{execute(r)}}: exception làm chết worker thread (pool tạo thread thay thế) và được in ra bởi uncaught exception handler.
- {{submit(c)}}: exception bị **bọc trong Future**; nếu không ai gọi {{get()}} thì lỗi biến mất hoàn toàn, không có log.
- {{invokeAll(tasks)}}: chặn tới khi **mọi** task xong, trả về danh sách Future **cùng thứ tự** với danh sách task; {{get()}} trên Future của task lỗi ném {{ExecutionException}} có cause là exception gốc.
- {{shutdown()}}: không nhận task mới, chạy nốt task đã nhận. {{shutdownNow()}}: interrupt các thread và trả về các task chưa chạy. {{awaitTermination(timeout)}}: chờ có giới hạn. Pool không shutdown giữ thread sống (non-daemon) và có thể chặn JVM thoát. Từ **Java 19**, {{ExecutorService}} là {{AutoCloseable}}: {{close()}} gọi shutdown rồi chờ mọi task xong, nên dùng được với try-with-resources.

### Lỗi production hay gặp
- Spring Boot auto-config task executor mặc định core 8, **queue không giới hạn**, max {{Integer.MAX_VALUE}}: max không bao giờ được dùng, {{@Async}} chất hàng triệu task trong RAM khi downstream chậm. Luôn đặt {{spring.task.execution.pool.queue-capacity}}.
- Tạo pool mới **trong mỗi request** rồi quên shutdown: số thread tăng dần tới khi {{OutOfMemoryError: unable to create native thread}}.
- Task trong pool chờ kết quả của task khác **cùng pool** (pool 4 thread, 4 task cha cùng chờ 4 task con đang nằm trong queue): thread starvation deadlock.
- Không đặt tên thread: thread dump toàn {{pool-7-thread-3}}, không biết pool nào của module nào.

### Liên hệ phỏng vấn
Câu hỏi kinh điển: "core 4, max 8, queue 100: task thứ 5 chạy ở đâu? task thứ 105?" (thứ 5 vào queue; thứ 105 tạo thread thứ 5 vì queue đầy). Câu trả lời senior thêm: luôn dùng hàng đợi có giới hạn, chọn rejection policy theo nghiệp vụ, đặt tên thread, theo dõi {{getActiveCount}}/{{getQueue().size()}} qua Micrometer ({{ExecutorServiceMetrics}}), và shutdown có timeout khi ứng dụng tắt.`,
  exercises: [
    {
      title: 'Dựng pool có giới hạn và kiểm chứng thứ tự core → queue → max → reject',
      prompt: `Viết {{Pools.bounded(core, max, queueCapacity, namePrefix)}} trả về một {{ThreadPoolExecutor}}:

- {{corePoolSize = core}}, {{maximumPoolSize = max}}, keepAlive 30 giây.
- Hàng đợi **có giới hạn** đúng {{queueCapacity}} phần tử ({{ArrayBlockingQueue}}).
- Thread được đặt tên {{namePrefix-1}}, {{namePrefix-2}}, ... theo thứ tự tạo.
- Khi đầy hết thì ném {{RejectedExecutionException}} ({{AbortPolicy}}).
- Tham số sai ({{core > max}}, {{queueCapacity < 1}}...) thì ném {{IllegalArgumentException}}.

Test giữ mọi task bị chặn bằng latch, rồi đếm số thread và kích thước hàng đợi sau từng lần submit để kiểm chứng đúng thứ tự core → queue → max → reject, và kiểm tra task nào được chạy trước.`,
      starter: `class Pools {
    static ThreadPoolExecutor bounded(int core, int max, int queueCapacity, String namePrefix) {
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
    static void await(CountDownLatch l, String what) {
        try { if (!l.await(3, TimeUnit.SECONDS)) throw new AssertionError("timeout: " + what); }
        catch (InterruptedException e) { throw new AssertionError(e); }
    }
    static void close(ThreadPoolExecutor p, CountDownLatch release) {
        release.countDown();
        p.shutdown();
        try { if (!p.awaitTermination(5, TimeUnit.SECONDS)) throw new AssertionError("pool không dừng trong 5s"); }
        catch (InterruptedException e) { throw new AssertionError(e); }
        finally { p.shutdownNow(); }
    }
    public static void main(String[] args) {
        check("core 2, max 4, queue 3: core -> queue -> max -> reject", () -> {
            ThreadPoolExecutor p = Pools.bounded(2, 4, 3, "order");
            CountDownLatch release = new CountDownLatch(1);
            Set<Integer> running = ConcurrentHashMap.newKeySet();
            CountDownLatch fourRunning = new CountDownLatch(4);
            try {
                for (int i = 1; i <= 7; i++) {
                    final int id = i;
                    p.execute(() -> { running.add(id); fourRunning.countDown(); await(release, "release"); });
                    if (i <= 2) { eq(i, p.getPoolSize()); eq(0, p.getQueue().size()); }
                    else if (i <= 5) { eq(2, p.getPoolSize()); eq(i - 2, p.getQueue().size()); }
                    else { eq(i - 3, p.getPoolSize()); eq(3, p.getQueue().size()); }
                }
                try { p.execute(() -> { }); throw new AssertionError("task thứ 8 phải bị từ chối"); }
                catch (RejectedExecutionException expected) { }
                await(fourRunning, "4 task đầu tiên chưa chạy");
                // task 6 và 7 tạo thread mới nên chạy TRƯỚC task 3, 4, 5 đang nằm trong queue
                eq(Set.of(1, 2, 6, 7), new HashSet<>(running));
            } finally { close(p, release); }
            eq(7L, p.getCompletedTaskCount());
        });
        check("threads are named prefix-1, prefix-2, ...", () -> {
            ThreadPoolExecutor p = Pools.bounded(3, 3, 10, "billing");
            CountDownLatch release = new CountDownLatch(1), started = new CountDownLatch(3);
            Set<String> names = ConcurrentHashMap.newKeySet();
            try {
                for (int i = 0; i < 3; i++) p.execute(() -> { names.add(Thread.currentThread().getName()); started.countDown(); await(release, "release"); });
                await(started, "3 task chưa chạy");
                eq(Set.of("billing-1", "billing-2", "billing-3"), new HashSet<>(names));
            } finally { close(p, release); }
        });
        check("core 1, max 1, queue 1: third task rejected", () -> {
            ThreadPoolExecutor p = Pools.bounded(1, 1, 1, "tiny");
            CountDownLatch release = new CountDownLatch(1);
            try {
                p.execute(() -> await(release, "release"));
                p.execute(() -> { });
                eq(1, p.getPoolSize()); eq(1, p.getQueue().size());
                try { p.execute(() -> { }); throw new AssertionError("task thứ 3 phải bị từ chối"); }
                catch (RejectedExecutionException expected) { }
            } finally { close(p, release); }
            eq(2L, p.getCompletedTaskCount());
        });
        check("invalid arguments throw IllegalArgumentException", () -> {
            int[][] bad = { { 4, 2, 10 }, { 2, 4, 0 }, { -1, 4, 10 }, { 0, 0, 10 } };
            for (int[] b : bad) {
                try { Pools.bounded(b[0], b[1], b[2], "x").shutdownNow(); }
                catch (IllegalArgumentException expected) { continue; }
                throw new AssertionError("bounded(" + b[0] + ", " + b[1] + ", " + b[2] + ") phải ném IllegalArgumentException");
            }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Pools {
    static ThreadPoolExecutor bounded(int core, int max, int queueCapacity, String namePrefix) {
        AtomicInteger seq = new AtomicInteger();
        ThreadFactory factory = r -> {
            Thread t = new Thread(r, namePrefix + "-" + seq.incrementAndGet());   // tên đọc được trong thread dump
            t.setDaemon(false);
            return t;
        };
        // ArrayBlockingQueue tự ném IllegalArgumentException khi capacity < 1;
        // constructor ThreadPoolExecutor ném IllegalArgumentException khi core < 0, max <= 0 hoặc max < core
        return new ThreadPoolExecutor(core, max, 30, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(queueCapacity), factory, new ThreadPoolExecutor.AbortPolicy());
    }
}`,
      hints: [
        'Dùng constructor 7 tham số: {{new ThreadPoolExecutor(core, max, 30, TimeUnit.SECONDS, queue, factory, handler)}}.',
        'ThreadFactory là một lambda {{r -> new Thread(r, namePrefix + "-" + seq.incrementAndGet())}} với {{seq}} là một {{AtomicInteger}} (factory có thể được gọi từ nhiều thread).',
        'Không cần tự kiểm tra tham số: {{ArrayBlockingQueue}} và constructor của ThreadPoolExecutor đã ném {{IllegalArgumentException}} cho các trường hợp sai.',
      ],
      explain: `Test đầu tiên là toàn bộ thuật toán {{execute}} viết thành số: task 1–2 tạo thread core; task 3–5 vào queue (pool vẫn 2 thread dù max là 4); task 6–7 thấy queue đầy nên tạo thread thứ 3, thứ 4 và chạy **ngay**, vượt mặt task 3–5; task 8 bị từ chối. Đây là lý do "max" chỉ có ý nghĩa với hàng đợi có giới hạn.

Lỗi hay gặp:
- Dùng {{new LinkedBlockingQueue<>()}} (không truyền capacity): queue không bao giờ đầy, pool không bao giờ vượt 2 thread, không bao giờ reject.
- Dùng {{SynchronousQueue}}: không có chỗ xếp hàng, task 3 đã tạo thread mới.
- Đếm tên thread bằng {{int}} thường thay vì {{AtomicInteger}}: pool có thể gọi factory từ nhiều thread submit khác nhau.

Muốn pool tạo thread tới max **trước** rồi mới xếp hàng (kiểu Tomcat), phải viết queue tuỳ biến có {{offer}} trả về false khi còn có thể tạo thread; ThreadPoolExecutor chuẩn không hỗ trợ.`,
    },
    {
      title: 'Chạy 1.000 job bằng invokeAll và shutdown đúng cách',
      prompt: `Viết {{JobRunner.runAll(jobs, threads, factory)}}:

- Tạo pool cố định đúng {{threads}} thread, **dùng {{factory}} được truyền vào** để tạo thread.
- Chạy mọi job bằng {{invokeAll}} và trả về kết quả **cùng thứ tự** với {{jobs}}.
- Job ném exception thì kết quả ở vị trí đó là {{-1}}; các job khác không bị ảnh hưởng.
- Trước khi trả về, pool phải được **shutdown** và các thread phải kết thúc (test kiểm tra mọi thread do factory tạo đã chết). Bị interrupt khi đang chờ thì khôi phục cờ interrupt và ném {{IllegalStateException}}.
- Danh sách rỗng trả về danh sách rỗng.`,
      starter: `class JobRunner {
    static List<Integer> runAll(List<Callable<Integer>> jobs, int threads, ThreadFactory factory) {
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
    // factory ghi lại mọi thread đã tạo; daemon để code quên shutdown không chặn JVM thoát
    static class RecordingFactory implements ThreadFactory {
        final List<Thread> created = new CopyOnWriteArrayList<>();
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "job-" + created.size());
            t.setDaemon(true);
            created.add(t);
            return t;
        }
    }
    // gọi runAll trên thread riêng, tối đa 10 giây
    static List<Integer> run(List<Callable<Integer>> jobs, int threads, ThreadFactory f) {
        ExecutorService caller = Executors.newSingleThreadExecutor(r -> { Thread t = new Thread(r); t.setDaemon(true); return t; });
        try {
            return caller.submit(() -> JobRunner.runAll(jobs, threads, f)).get(10, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            throw new AssertionError("runAll không xong trong 10s");
        } catch (InterruptedException | ExecutionException e) {
            throw new AssertionError("runAll lỗi: " + (e.getCause() != null ? e.getCause() : e));
        } finally {
            caller.shutdownNow();
        }
    }
    static void pause(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    public static void main(String[] args) {
        check("1000 jobs, results in input order", () -> {
            List<Callable<Integer>> jobs = new ArrayList<>();
            for (int i = 0; i < 1000; i++) { final int n = i; jobs.add(() -> n * 2); }
            List<Integer> out = run(jobs, 8, new RecordingFactory());
            eq(1000, out.size());
            for (int i = 0; i < 1000; i++) eq(i * 2, out.get(i));
        });
        check("failing job gives -1, others unaffected", () -> {
            List<Callable<Integer>> jobs = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                final int n = i;
                jobs.add(() -> { if (n % 10 == 3) throw new IllegalStateException("job " + n); return n; });
            }
            List<Integer> out = run(jobs, 4, new RecordingFactory());
            for (int i = 0; i < 100; i++) eq(i % 10 == 3 ? -1 : i, out.get(i));
        });
        check("uses the given factory and at most 'threads' threads run at once", () -> {
            RecordingFactory f = new RecordingFactory();
            AtomicInteger active = new AtomicInteger(), maxActive = new AtomicInteger();
            List<Callable<Integer>> jobs = new ArrayList<>();
            for (int i = 0; i < 200; i++) {
                final int n = i;
                jobs.add(() -> {
                    maxActive.accumulateAndGet(active.incrementAndGet(), Math::max);
                    pause(2);
                    active.decrementAndGet();
                    return n;
                });
            }
            run(jobs, 4, f);
            if (f.created.isEmpty()) throw new AssertionError("không dùng factory được truyền vào");
            if (f.created.size() > 4) throw new AssertionError("tạo " + f.created.size() + " thread, tối đa 4");
            if (maxActive.get() > 4) throw new AssertionError("có " + maxActive.get() + " job chạy cùng lúc, tối đa 4");
            if (maxActive.get() < 2) throw new AssertionError("job không chạy song song");
        });
        check("pool is shut down: every worker thread terminates", () -> {
            RecordingFactory f = new RecordingFactory();
            List<Callable<Integer>> jobs = new ArrayList<>();
            for (int i = 0; i < 50; i++) { final int n = i; jobs.add(() -> n); }
            run(jobs, 4, f);
            for (Thread t : f.created) {
                try { t.join(2000); } catch (InterruptedException e) { throw new AssertionError(e); }
                if (t.isAlive()) throw new AssertionError("thread " + t.getName() + " vẫn sống: quên shutdown pool?");
            }
        });
        check("empty job list", () -> eq(List.of(), run(new ArrayList<>(), 2, new RecordingFactory())));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class JobRunner {
    static List<Integer> runAll(List<Callable<Integer>> jobs, int threads, ThreadFactory factory) {
        ExecutorService pool = Executors.newFixedThreadPool(threads, factory);
        try {
            // invokeAll chặn tới khi mọi job xong; Future trả về cùng thứ tự với jobs
            List<Future<Integer>> futures = pool.invokeAll(jobs);
            List<Integer> results = new ArrayList<>(futures.size());
            for (Future<Integer> f : futures) {
                try {
                    results.add(f.get());           // đã xong nên get() không chặn
                } catch (ExecutionException e) {
                    results.add(-1);                // e.getCause() là exception gốc của job
                }
            }
            return results;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();     // khôi phục cờ, đừng nuốt interrupt
            throw new IllegalStateException("interrupted while waiting for jobs", e);
        } finally {
            pool.shutdown();                        // luôn shutdown, kể cả khi lỗi
            try {
                if (!pool.awaitTermination(5, TimeUnit.SECONDS)) pool.shutdownNow();
            } catch (InterruptedException e) {
                pool.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}`,
      hints: [
        '{{Executors.newFixedThreadPool(threads, factory)}} nhận ThreadFactory ở tham số thứ hai.',
        '{{invokeAll}} trả về {{List<Future<Integer>>}} cùng thứ tự; lặp qua và {{get()}} từng cái, bắt {{ExecutionException}} để ghi {{-1}}.',
        'Đặt {{shutdown()}} và {{awaitTermination}} trong {{finally}}. Bắt {{InterruptedException}} thì gọi {{Thread.currentThread().interrupt()}} trước khi ném tiếp.',
      ],
      explain: `{{invokeAll}} tiện cho mô hình "fan-out rồi gom": nó submit mọi task, chờ tất cả xong, rồi trả Future theo đúng thứ tự đầu vào. Exception của từng job được giữ trong Future của job đó, nên một job lỗi không làm hỏng các job khác; bạn quyết định chuyển nó thành giá trị mặc định, gom lại để báo cáo, hay ném ra.

Shutdown trong {{finally}} là điểm hay bị quên nhất. Pool không shutdown giữ thread sống mãi; trong ứng dụng thật (thread non-daemon) còn chặn JVM thoát hoặc rò thread mỗi lần gọi hàm. Trên Java 19+ có thể viết gọn {{try (ExecutorService pool = Executors.newFixedThreadPool(n, f))}} vì {{close()}} tự shutdown và chờ.

Lỗi hay gặp:
- Tự {{submit}} trong vòng lặp rồi {{get()}} ngay trong cùng vòng lặp: các job chạy **tuần tự**.
- Bắt {{InterruptedException}} rồi bỏ qua: code phía trên (ví dụ lệnh shutdown của ứng dụng) không bao giờ biết thread đã bị yêu cầu dừng.
- Dùng {{invokeAll}} không timeout cho job gọi mạng: một job treo làm cả lô treo. Có overload {{invokeAll(tasks, timeout, unit)}}: hết giờ thì task chưa xong bị cancel và {{get()}} ném {{CancellationException}}.`,
    },
  ],
  check: [
    {
      q: 'Pool: core 4, max 8, {{ArrayBlockingQueue(100)}}. Mọi task chạy rất lâu. Task thứ 50 được xử lý thế nào?',
      options: ['Tạo thread thứ 5 vì còn dưới max', 'Vào hàng đợi', 'Bị từ chối', 'Chờ tới khi một thread core rảnh rồi mới nhận'],
      answer: 1,
      explain: `4 task đầu tạo 4 thread core; từ task thứ 5 tới thứ 104 vào queue (100 chỗ). Thread vượt core chỉ được tạo khi queue đầy, tức từ task thứ 105; task thứ 109 trở đi mới bị từ chối. "Chờ thread rảnh mới nhận" sai vì {{execute}} không bao giờ chặn người gọi: nó xếp hàng hoặc từ chối.`,
    },
    {
      q: 'Vì sao {{Executors.newFixedThreadPool(20)}} nguy hiểm khi downstream (DB, API ngoài) chậm đi?',
      options: ['Vì nó tạo thread không giới hạn', 'Vì hàng đợi {{LinkedBlockingQueue}} không giới hạn: task chất đống trong RAM, độ trễ tăng, có thể OOM', 'Vì nó dùng ForkJoinPool.commonPool', 'Vì thread của nó là daemon nên mất task khi tắt'],
      answer: 1,
      explain: `Fixed pool có đúng 20 thread nhưng hàng đợi không giới hạn, nên không bao giờ từ chối: task tích tụ trong RAM và không có backpressure. Thread không giới hạn là vấn đề của {{newCachedThreadPool}}. Fixed pool dùng ThreadPoolExecutor riêng, không dùng commonPool. Thread mặc định của nó là non-daemon.`,
    },
    {
      q: 'Bạn {{submit()}} một task ném {{NullPointerException}} và không bao giờ gọi {{get()}}. Điều gì xảy ra?',
      options: ['Stack trace được in ra stderr', 'Worker thread chết và pool tạo thread mới', 'Exception nằm im trong Future, không có log nào', 'Pool tự shutdown'],
      answer: 2,
      explain: `{{submit}} bọc task trong {{FutureTask}}, exception được lưu vào Future và chỉ lộ ra khi gọi {{get()}}. In stack trace và worker chết là hành vi của {{execute()}} (exception thoát khỏi {{run}} tới uncaught exception handler). Pool không bao giờ tự shutdown vì task lỗi.`,
    },
  ],
  related: ['concurrency-003', 'concurrency-004', 'concurrency-020', 'concurrency-015'],
  tags: ['ThreadPoolExecutor', 'ExecutorService', 'invokeAll', 'rejection policy', 'shutdown'],
},
{
  id: 'lesson-concurrency-004',
  track: 'concurrency',
  order: 4,
  title: 'CompletableFuture: thenCompose, thenCombine, allOf, xử lý lỗi và timeout',
  level: 'senior',
  minutes: 35,
  goals: [
    'Phân biệt {{thenApply}}, {{thenCompose}}, {{thenCombine}} và biết callback chạy trên thread nào',
    'Gom nhiều lời gọi song song bằng {{allOf}} mà không chặn thread',
    'Xử lý lỗi bằng {{exceptionally}}/{{handle}}, hiểu {{CompletionException}} và {{ExecutionException}}',
    'Đặt timeout bằng {{orTimeout}}/{{completeOnTimeout}} và biết vì sao luôn truyền executor riêng',
  ],
  body: `### Từ Future sang CompletableFuture
{{Future}} của ExecutorService chỉ có một cách lấy kết quả: {{get()}}, tức là **chặn** thread gọi. Muốn "khi A xong thì làm B" bạn phải giữ một thread đứng chờ. {{CompletableFuture}} (Java 8) là một Future có thể được **hoàn thành từ bên ngoài** ({{complete}}, {{completeExceptionally}}) và cho phép **đăng ký callback**: khi kết quả có, các stage phụ thuộc được kích hoạt tự động. Bên trong, mỗi CompletableFuture giữ kết quả (hoặc exception) và một **stack các stage phụ thuộc**; khi được hoàn thành, nó lần lượt kích hoạt các stage đó.

### Callback chạy trên thread nào?
~~~java
CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> userApi.get(id), ioPool); // chạy trên ioPool
user.thenApply(User::name);          // KHÔNG Async: chạy trên thread hoàn thành 'user',
                                     // hoặc ngay trên thread gọi nếu 'user' đã xong
user.thenApplyAsync(User::name, cpuPool);   // luôn chuyển sang cpuPool
~~~
- {{supplyAsync(supplier)}} **không truyền executor** dùng {{ForkJoinPool.commonPool()}} (parallelism mặc định = số core − 1; nếu parallelism nhỏ hơn 2 thì mỗi task chạy trên một thread mới). commonPool dùng chung cho cả JVM, kể cả parallel stream. Đặt IO chặn vào đó thì vài lời gọi chậm là làm nghẽn mọi thứ khác. **Luôn truyền executor riêng cho IO.**
- Các method không có hậu tố {{Async}} chạy trên thread đã hoàn thành stage trước. Nếu đó là thread IO của một HTTP client, việc tính toán nặng trong {{thenApply}} sẽ chiếm thread IO.

### Ba cách nối: map, flatMap, zip
| Method | Tương tự | Dùng khi |
|---|---|---|
| {{thenApply(f)}} | map | Biến đổi kết quả đồng bộ: {{f}} trả về giá trị |
| {{thenCompose(f)}} | flatMap | Bước sau **cũng bất đồng bộ**: {{f}} trả về CompletableFuture; tránh {{CompletableFuture<CompletableFuture<T>>}} |
| {{thenCombine(other, f)}} | zip | Hai việc **độc lập** chạy song song, gộp kết quả khi cả hai xong |
| {{allOf(cfs...)}} | | Chờ N việc; trả về {{CompletableFuture<Void>}}, phải tự {{join()}} từng cái để lấy kết quả |
| {{anyOf(cfs...)}} | | Việc nào xong trước (kể cả xong vì lỗi) |

~~~java
CompletableFuture<Order> order = findUser(id)                     // CF<User>
    .thenCompose(u -> findCart(u.cartId()))                         // CF<Cart>, không lồng nhau
    .thenCombine(findPromo(id), (cart, promo) -> price(cart, promo)) // findPromo chạy song song
    .orTimeout(800, TimeUnit.MILLISECONDS);                         // Java 9+
~~~

### Xử lý lỗi: exception đi theo chuỗi
Nếu một stage ném exception, mọi stage phụ thuộc **bỏ qua hàm của chúng** và hoàn thành với cùng lỗi, được bọc trong {{CompletionException}}, cho tới khi gặp một handler:
- {{exceptionally(ex -> fallback)}}: chỉ chạy khi lỗi, trả về giá trị thay thế.
- {{handle((value, ex) -> ...)}}: luôn chạy, nhận cả hai, trả về giá trị mới.
- {{whenComplete((value, ex) -> ...)}}: luôn chạy, dùng để log/metric, **không đổi** kết quả.

Lấy kết quả: {{join()}} ném {{CompletionException}} (unchecked), {{get()}} ném {{ExecutionException}} (checked); cả hai có {{getCause()}} là exception gốc. Trong handler, {{ex}} thường đã bị bọc trong CompletionException, nên kiểm tra {{ex.getCause()}} trước khi so kiểu.

### Timeout
Java 9 thêm {{orTimeout(t, unit)}} (hết giờ thì hoàn thành với {{TimeoutException}}) và {{completeOnTimeout(value, t, unit)}} (hết giờ thì hoàn thành với giá trị mặc định). Cả hai dùng một thread lập lịch nội bộ, không chặn ai. Nhưng chúng chỉ hoàn thành **future**, không dừng công việc bên dưới: lời gọi HTTP vẫn chạy tiếp và chiếm thread. {{cancel(true)}} cũng vậy: với CompletableFuture, tham số {{mayInterruptIfRunning}} không có tác dụng. Vì thế vẫn phải đặt timeout ở tầng client (connect/read timeout của HTTP client, query timeout của JDBC).

| Tình huống | Cách viết |
|---|---|
| Gọi 3 nguồn, cần đủ cả 3 | {{allOf}} + {{orTimeout}}, lỗi thì fail cả request |
| Gọi 3 nguồn, nguồn nào lỗi thì bỏ qua | Mỗi nguồn {{exceptionally(ex -> null)}} trước khi {{allOf}}, rồi lọc null |
| Chỉ cần nguồn nhanh nhất | {{anyOf}} (cẩn thận: nguồn lỗi nhanh nhất cũng "thắng") |
| Nguồn chậm thì dùng giá trị mặc định | {{completeOnTimeout(defaultValue, t, unit)}} |

### Lỗi production hay gặp
- Gọi {{join()}} **bên trong** một callback chạy trên cùng pool: các thread chờ nhau, pool cạn, treo kiểu starvation deadlock.
- Không có handler lỗi và không ai {{join}}: exception biến mất, chỉ thấy request "không trả về gì".
- Mất MDC/traceId, SecurityContext, transaction: chúng nằm trong ThreadLocal của thread gốc, còn callback chạy trên thread khác. Cần một executor có bọc context (Micrometer Context Propagation, {{TaskDecorator}} của Spring).
- {{anyOf}} trả về {{CompletableFuture<Object>}} và hoàn thành ngay khi nguồn đầu tiên **lỗi**, nên không dùng được trực tiếp cho "lấy nguồn thành công đầu tiên".

### Liên hệ phỏng vấn
Câu hay gặp: "thenApply khác thenCompose?", "executor mặc định của supplyAsync là gì và vì sao nguy hiểm?", "gọi 3 service song song, một cái chậm thì xử lý thế nào?". Câu trả lời senior: executor riêng cho IO, timeout ở cả tầng future và tầng client, fallback theo từng nguồn, và biết rằng Java 21 có hướng khác là virtual thread viết code chặn tuần tự dễ đọc hơn (bài 5).`,
  exercises: [
    {
      title: 'Lấy giá tốt nhất từ nhiều nguồn song song, có fallback và timeout',
      prompt: `Viết {{PriceAggregator}} nhận một {{Executor}} trong constructor. Method {{bestPrice(sources, timeoutMs)}}:

- Gọi **mọi** nguồn giá ({{Supplier<Integer>}}) **song song** trên executor được truyền vào.
- Trả về **ngay** một {{CompletableFuture<Integer>}} (không được chặn thread gọi để chờ kết quả).
- Kết quả là giá **nhỏ nhất** trong các nguồn thành công.
- Nguồn ném exception, trả về null hoặc chưa xong sau {{timeoutMs}} mili giây thì bị bỏ qua.
- Không nguồn nào thành công (kể cả danh sách rỗng): future hoàn thành **với lỗi** {{NoSuchElementException}} (khi gọi {{get()}} thì cause của {{ExecutionException}} là NoSuchElementException).

Gợi ý: Java 9+ có {{completeOnTimeout}} và {{orTimeout}}.`,
      starter: `class PriceAggregator {
    private final Executor executor;

    PriceAggregator(Executor executor) {
        this.executor = executor;
    }

    CompletableFuture<Integer> bestPrice(List<Supplier<Integer>> sources, long timeoutMs) {
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
    static ExecutorService newPool() {
        AtomicInteger n = new AtomicInteger();
        return Executors.newFixedThreadPool(4, r -> { Thread t = new Thread(r, "price-" + n.incrementAndGet()); t.setDaemon(true); return t; });
    }
    static Integer await(CompletableFuture<Integer> f) {
        try { return f.get(2, TimeUnit.SECONDS); }
        catch (TimeoutException e) { throw new AssertionError("future chưa xong sau 2s"); }
        catch (InterruptedException e) { throw new AssertionError(e); }
        catch (ExecutionException e) { throw new AssertionError("future lỗi: " + e.getCause()); }
    }
    static void expectNoSuchElement(CompletableFuture<Integer> f) {
        try { Integer v = f.get(2, TimeUnit.SECONDS); throw new AssertionError("phải lỗi, nhưng trả về " + v); }
        catch (ExecutionException e) {
            if (!(e.getCause() instanceof NoSuchElementException)) throw new AssertionError("cause phải là NoSuchElementException, là " + e.getCause());
        }
        catch (TimeoutException e) { throw new AssertionError("future chưa xong sau 2s"); }
        catch (InterruptedException e) { throw new AssertionError(e); }
    }
    static Supplier<Integer> fail(String msg) { return () -> { throw new IllegalStateException(msg); }; }
    static Supplier<Integer> slow(int price, long ms) {
        return () -> { try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return price; };
    }
    public static void main(String[] args) {
        check("all sources succeed: minimum price", () -> {
            ExecutorService pool = newPool();
            try { eq(95, await(new PriceAggregator(pool).bestPrice(List.of(() -> 120, () -> 95, () -> 110), 1000))); }
            finally { pool.shutdownNow(); }
        });
        check("failing and null sources are ignored", () -> {
            ExecutorService pool = newPool();
            try { eq(110, await(new PriceAggregator(pool).bestPrice(List.of(() -> 120, fail("vendor B 500"), () -> null, () -> 110), 1000))); }
            finally { pool.shutdownNow(); }
        });
        check("slow source is dropped after timeout", () -> {
            ExecutorService pool = newPool();
            try {
                long t0 = System.nanoTime();
                Integer best = await(new PriceAggregator(pool).bestPrice(List.of(() -> 130, slow(1, 5_000), () -> 125), 200));
                eq(125, best);   // nguồn chậm rẻ hơn nhưng quá hạn nên bị bỏ
                long ms = (System.nanoTime() - t0) / 1_000_000;
                if (ms > 1_500) throw new AssertionError("mất " + ms + "ms, timeout là 200ms");
            } finally { pool.shutdownNow(); }
        });
        check("all sources fail: NoSuchElementException", () -> {
            ExecutorService pool = newPool();
            try { expectNoSuchElement(new PriceAggregator(pool).bestPrice(List.of(fail("a"), fail("b"), slow(1, 5_000)), 200)); }
            finally { pool.shutdownNow(); }
        });
        check("empty source list: NoSuchElementException", () -> {
            ExecutorService pool = newPool();
            try { expectNoSuchElement(new PriceAggregator(pool).bestPrice(List.of(), 200)); }
            finally { pool.shutdownNow(); }
        });
        check("sources run in parallel on the given executor", () -> {
            ExecutorService pool = newPool();
            CyclicBarrier barrier = new CyclicBarrier(3);   // chỉ qua được khi 3 nguồn chạy CÙNG LÚC
            Set<String> threads = ConcurrentHashMap.newKeySet();
            Supplier<Integer> s1 = () -> { threads.add(Thread.currentThread().getName()); try { barrier.await(2, TimeUnit.SECONDS); } catch (Exception e) { throw new IllegalStateException(e); } return 300; };
            try {
                eq(300, await(new PriceAggregator(pool).bestPrice(List.of(s1, s1, s1), 3000)));
                for (String t : threads) if (!t.startsWith("price-")) throw new AssertionError("nguồn chạy trên thread " + t + ", không phải executor được truyền vào");
            } finally { pool.shutdownNow(); }
        });
        check("bestPrice returns without blocking", () -> {
            ExecutorService pool = newPool();
            CountDownLatch gate = new CountDownLatch(1);
            Supplier<Integer> gated = () -> { try { gate.await(2, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return 77; };
            try {
                CompletableFuture<Integer> f = new PriceAggregator(pool).bestPrice(List.of(gated, gated), 3000);
                if (f.isDone()) throw new AssertionError("future đã xong trước khi nguồn trả về: bestPrice đang chặn?");
                gate.countDown();
                eq(77, await(f));
            } finally { pool.shutdownNow(); }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class PriceAggregator {
    private final Executor executor;

    PriceAggregator(Executor executor) {
        this.executor = executor;
    }

    CompletableFuture<Integer> bestPrice(List<Supplier<Integer>> sources, long timeoutMs) {
        List<CompletableFuture<Integer>> calls = new ArrayList<>();
        for (Supplier<Integer> s : sources) {
            calls.add(CompletableFuture.supplyAsync(s, executor)        // executor riêng, không dùng commonPool
                    .completeOnTimeout(null, timeoutMs, TimeUnit.MILLISECONDS)   // quá hạn: coi như không có giá
                    .exceptionally(ex -> null));                         // lỗi: coi như không có giá
        }
        // allOf không chặn; thenApply chạy khi MỌI nguồn đã xong (thành công, lỗi hoặc hết giờ)
        return CompletableFuture.allOf(calls.toArray(new CompletableFuture[0]))
                .thenApply(v -> calls.stream()
                        .map(CompletableFuture::join)                     // đã xong hết nên join không chặn
                        .filter(Objects::nonNull)
                        .min(Integer::compare)
                        .orElseThrow(() -> new NoSuchElementException("no price available")));
    }
}`,
      hints: [
        'Với mỗi nguồn: {{CompletableFuture.supplyAsync(source, executor)}}. Đừng quên tham số executor.',
        'Biến "lỗi" và "quá hạn" thành null: {{.completeOnTimeout(null, timeoutMs, TimeUnit.MILLISECONDS).exceptionally(ex -> null)}}.',
        'Gom bằng {{CompletableFuture.allOf(...)}} rồi {{thenApply}}: trong đó {{join()}} từng future, lọc null, lấy min; không có thì ném {{NoSuchElementException}} để future kết quả hoàn thành với lỗi.',
      ],
      explain: `Lời giải không chặn ở đâu cả: {{bestPrice}} chỉ lắp chuỗi callback rồi trả về. Mỗi nguồn được "chuẩn hoá" thành một future **không bao giờ lỗi**: có giá, hoặc null nếu lỗi/quá hạn. Nhờ vậy {{allOf}} luôn hoàn thành bình thường, và lựa chọn cuối cùng nằm trong một chỗ duy nhất. Ném {{NoSuchElementException}} trong {{thenApply}} làm future kết quả hoàn thành với lỗi (bên trong là CompletionException bọc NoSuchElementException; {{get()}} gỡ lớp đó và ném ExecutionException có cause là NoSuchElementException).

Lưu ý thứ tự: {{completeOnTimeout}} đứng **trước** {{exceptionally}} và được gọi trên chính future của {{supplyAsync}}; nó hoàn thành future đó bằng null khi hết giờ. Nguồn chậm vẫn tiếp tục chạy trên executor cho tới khi tự xong: timeout của CompletableFuture không dừng được công việc bên dưới.

Lỗi hay gặp:
- {{supplyAsync(s)}} không truyền executor: chạy trên commonPool; test kiểm tra tên thread sẽ báo lỗi.
- Gọi {{join()}}/{{get()}} trên từng nguồn ngay trong vòng lặp: chạy tuần tự và chặn thread gọi.
- Dùng {{anyOf}}: trả về nguồn xong **đầu tiên**, không phải giá rẻ nhất, và nguồn lỗi nhanh cũng "thắng".
- Dùng {{orTimeout}} mà không có {{exceptionally}} phía sau: một nguồn chậm làm hỏng cả kết quả.`,
    },
  ],
  check: [
    {
      q: '{{CompletableFuture.supplyAsync(() -> callApi())}} không truyền executor. Task chạy ở đâu (Java 17, máy 8 core)?',
      options: ['Trên một thread mới tạo riêng cho task', 'Trên {{ForkJoinPool.commonPool()}}', 'Trên thread gọi supplyAsync', 'Trên pool của Tomcat'],
      answer: 1,
      explain: `Mặc định là commonPool (parallelism 7 trên máy 8 core). Chỉ khi parallelism của commonPool nhỏ hơn 2 (máy 1–2 core) thì mới tạo thread mới cho mỗi task. Thread gọi không chạy task (đó là hành vi của {{thenApply}} khi stage trước đã xong). CompletableFuture không biết gì về Tomcat.`,
    },
    {
      q: '{{findUser(id)}} trả về {{CompletableFuture<User>}}, {{findOrders(user)}} trả về {{CompletableFuture<List<Order>>}}. Nối hai bước thế nào để có {{CompletableFuture<List<Order>>}}?',
      options: ['{{findUser(id).thenApply(u -> findOrders(u))}}', '{{findUser(id).thenCompose(u -> findOrders(u))}}', '{{findUser(id).thenCombine(findOrders(u), ...)}}', '{{CompletableFuture.allOf(findUser(id), findOrders(u))}}'],
      answer: 1,
      explain: `{{thenCompose}} là flatMap: hàm trả về một CompletableFuture và kết quả được "làm phẳng". {{thenApply}} sẽ cho {{CompletableFuture<CompletableFuture<List<Order>>>}}. {{thenCombine}} dành cho hai việc **độc lập**, còn ở đây bước hai cần user từ bước một (và {{u}} chưa tồn tại). {{allOf}} trả về {{CompletableFuture<Void>}} và cũng cần user trước.`,
    },
    {
      q: 'Future {{f}} có {{f.orTimeout(1, SECONDS)}}; lời gọi HTTP bên trong mất 10 giây. Sau 1 giây điều gì xảy ra?',
      options: ['Lời gọi HTTP bị interrupt và dừng', 'Future hoàn thành với TimeoutException, còn lời gọi HTTP vẫn chạy tiếp tới khi xong', 'Thread chạy HTTP bị huỷ và pool tạo thread mới', 'Không có gì cho tới khi gọi get()'],
      answer: 1,
      explain: `{{orTimeout}} chỉ hoàn thành future bằng TimeoutException; CompletableFuture không biết thread nào đang làm việc nên không interrupt được, và pool không huỷ thread. Timeout được lập lịch ngay khi gọi {{orTimeout}}, không cần ai gọi {{get()}}. Vì thế vẫn cần read timeout ở HTTP client.`,
    },
  ],
  related: ['concurrency-005', 'concurrency-014', 'concurrency-013'],
  tags: ['CompletableFuture', 'thenCompose', 'allOf', 'timeout', 'commonPool'],
},
{
  id: 'lesson-concurrency-005',
  track: 'concurrency',
  order: 5,
  title: 'Virtual threads (Java 21): mount/unmount, pinning và khi nào thật sự có lợi',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích virtual thread được mount/unmount lên carrier thread như thế nào và vì sao nó rẻ',
    'Nhận ra pinning (synchronized, native) trên JDK 21–23, biết JEP 491 ở JDK 24 thay đổi gì và cách chẩn đoán',
    'Biết khi nào virtual thread giúp tăng throughput và khi nào không (CPU-bound, tài nguyên giới hạn)',
    'Giới hạn đồng thời bằng {{Semaphore}} thay vì bằng kích thước pool',
  ],
  body: `### Vấn đề mà virtual thread giải quyết
Mô hình thread-per-request (mỗi request một thread, code chặn tuần tự) dễ viết, dễ debug, stack trace rõ ràng. Nhưng platform thread là thread của hệ điều hành: tốn bộ nhớ stack, tạo và chuyển ngữ cảnh tốn kém, nên một service thường chỉ chạy được vài trăm tới vài nghìn thread. Nếu mỗi request chờ DB 100 ms, 200 thread Tomcat chỉ phục vụ được khoảng 2.000 request/s (định luật Little), dù CPU gần như rảnh. Cách cũ để vượt giới hạn này là lập trình bất đồng bộ (CompletableFuture, reactive), đổi lại code khó đọc và stack trace vô dụng.

**Virtual thread** (JEP 444, chính thức từ **Java 21**) giữ nguyên mô hình code chặn nhưng làm cho thread **rẻ**: tạo hàng triệu cái cũng được.

### Mount và unmount
~~~java
// Java 21: mỗi task một virtual thread, không cần pool
try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        ex.submit(() -> httpClient.send(request(id), ofString()));  // code chặn bình thường
    }
}   // close() chờ mọi task xong
Thread.ofVirtual().name("vt-", 0).start(task);   // tạo trực tiếp
~~~

Bên trong:
1. Virtual thread là một object Java trên heap, gắn với một **continuation** (trạng thái thực thi: stack frame, vị trí đang chạy).
2. JDK có một scheduler riêng là một {{ForkJoinPool}} ở chế độ FIFO; các thread của pool này gọi là **carrier thread**, mặc định số carrier bằng số core.
3. Khi virtual thread chạy, nó được **mount** lên một carrier: các frame của nó chạy trên stack của carrier.
4. Khi nó gặp thao tác chặn đã được JDK viết lại cho virtual thread (đọc socket, {{Thread.sleep}}, {{BlockingQueue.take}}, {{ReentrantLock.lock}}, {{LockSupport.park}}...), JDK **unmount** nó: copy các frame cần thiết sang heap, trả carrier cho virtual thread khác. Khi dữ liệu về (socket sẵn sàng), virtual thread được đưa lại vào hàng đợi của scheduler và mount lên một carrier bất kỳ.

Vì stack được cấp phát trên heap, co giãn theo nhu cầu, một virtual thread đang chờ chỉ tốn vài trăm byte tới vài KB thay vì một vùng stack cố định.

### Pinning: khi virtual thread không unmount được
Virtual thread bị **pin** vào carrier (chặn luôn carrier) khi nó chặn trong lúc:
- Đang ở trong khối hoặc method {{synchronized}} (JDK 21, 22, 23). Monitor của synchronized được ghi nhận theo carrier thread, nên JDK không thể đổi carrier giữa chừng.
- Có frame native hoặc foreign function trên stack.

Pin ngắn không sao. Pin lâu (gọi JDBC hoặc HTTP bên trong synchronized) làm mất carrier: với 8 carrier, 8 request bị pin là cả ứng dụng đứng, dù có hàng nghìn virtual thread đang sẵn sàng chạy. Cách xử lý trên JDK 21–23: thay {{synchronized}} bao quanh IO bằng {{ReentrantLock}}, nâng cấp thư viện (nhiều JDBC driver đã chuyển sang ReentrantLock), và chẩn đoán bằng JFR event {{jdk.VirtualThreadPinned}} hoặc cờ {{-Djdk.tracePinnedThreads=full}}.

**JEP 491 (JDK 24)** cho phép virtual thread unmount ngay cả khi đang giữ hoặc chờ monitor của synchronized, nên lý do pinning phổ biến nhất biến mất; cờ {{jdk.tracePinnedThreads}} cũng bị gỡ bỏ. Pinning vẫn còn khi đi qua native code. Lưu ý: JDK 24 không phải bản LTS; bản LTS kế tiếp có thay đổi này là JDK 25.

| Tiêu chí | Platform thread | Virtual thread |
|---|---|---|
| Ánh xạ | 1–1 với thread hệ điều hành | Nhiều virtual thread trên ít carrier |
| Chi phí tạo / bộ nhớ khi chờ | Cao (stack cố định, system call) | Rất thấp (object trên heap) |
| Có nên pool không | Có | **Không**: tạo mới cho mỗi task |
| Phù hợp | CPU-bound, số thread ít | IO-bound, rất nhiều việc đồng thời phần lớn thời gian là chờ |
| Giới hạn đồng thời | Bằng kích thước pool | Bằng {{Semaphore}}, rate limiter, kích thước connection pool |

### Khi nào có lợi, khi nào không
- Virtual thread tăng **throughput** cho việc chờ IO, **không** làm từng request nhanh hơn. Việc CPU-bound chạy trên virtual thread không nhanh hơn platform thread vì vẫn chỉ có số carrier bằng số core.
- Tài nguyên phía sau vẫn có giới hạn: 10.000 virtual thread cùng gọi một DB có pool 20 connection thì 9.980 cái đứng chờ connection (trong lúc chờ chúng unmount nên không tốn carrier, nhưng timeout lấy connection có thể nổ hàng loạt). Hàng xóm phía sau (API đối tác có rate limit) cũng vậy. Giới hạn bằng {{Semaphore}}, không phải bằng cách pool virtual thread.
- {{ThreadLocal}} vẫn hoạt động, nhưng một triệu thread mỗi cái giữ một object nặng trong ThreadLocal (cache formatter, buffer) là một triệu bản sao. {{ScopedValue}} (preview ở Java 21) là hướng thay thế cho việc truyền context.
- Virtual thread luôn là daemon và có priority cố định.

### Lỗi production hay gặp
- Bật {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+) trên JDK 21 khi code hoặc thư viện có {{synchronized}} bao quanh IO: tải cao thì treo vì mọi carrier bị pin.
- Thay pool 200 thread bằng virtual thread rồi bị DB "đánh sập" vì không còn giới hạn tự nhiên số request đồng thời xuống DB.
- Pool virtual thread ({{newFixedThreadPool}} với factory tạo virtual thread): mất lợi ích, mà vẫn giới hạn sai chỗ.
- Benchmark bằng việc CPU-bound rồi kết luận "virtual thread chẳng nhanh hơn".

> Cách đo đúng: so sánh throughput và p99 ở cùng mức tải với workload thật (IO chiếm phần lớn thời gian), theo dõi JFR {{jdk.VirtualThreadPinned}} và số carrier đang bận.

### Liên hệ phỏng vấn
Câu hay gặp: "virtual thread hoạt động thế nào?", "pinning là gì, sửa ra sao?", "có nên chuyển toàn bộ sang virtual thread không?". Câu trả lời senior: giải thích mount/unmount trên carrier, nêu pinning với synchronized ở JDK 21–23 và JEP 491 ở JDK 24, nhấn mạnh rằng nút thắt chỉ chuyển từ số thread sang tài nguyên phía sau (connection pool, rate limit), và rằng không pool virtual thread mà giới hạn bằng Semaphore.`,
  exercises: [
    {
      title: 'Chạy 10.000 tác vụ IO trên executor bất kỳ, giới hạn đồng thời bằng Semaphore',
      prompt: `Bài tập biên dịch với Java 17, nên ta viết code **không phụ thuộc loại executor**: trên Java 21, cùng hàm này nhận {{Executors.newVirtualThreadPerTaskExecutor()}}; trong test, nó nhận một pool thường.

Viết {{IoBatch.fetchAll(executor, ids, io, maxInFlight)}}:
- Mỗi id là **một task** submit vào {{executor}} (kiểu thread-per-task); trong task gọi {{io.apply(id)}} (giả lập lời gọi IO).
- Tại mọi thời điểm có **tối đa {{maxInFlight}}** lời gọi {{io}} đang chạy (dùng {{Semaphore}}: đây là cách giới hạn tài nguyên khi dùng virtual thread, vì không pool chúng).
- Trả về kết quả **cùng thứ tự** với {{ids}}. Lời gọi ném exception thì kết quả là {{"ERR-" + id}}.
- **Không** shutdown executor (người gọi sở hữu nó).
- {{maxInFlight < 1}} thì ném {{IllegalArgumentException}}. Danh sách rỗng trả về danh sách rỗng.`,
      starter: `class IoBatch {
    static List<String> fetchAll(ExecutorService executor, List<Integer> ids,
                                 Function<Integer, String> io, int maxInFlight) {
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
    static ExecutorService pool(int n) {
        AtomicInteger seq = new AtomicInteger();
        return Executors.newFixedThreadPool(n, r -> { Thread t = new Thread(r, "io-" + seq.incrementAndGet()); t.setDaemon(true); return t; });
    }
    // gọi fetchAll trên thread riêng, tối đa 10 giây
    static List<String> run(ExecutorService ex, List<Integer> ids, Function<Integer, String> io, int max) {
        ExecutorService caller = Executors.newSingleThreadExecutor(r -> { Thread t = new Thread(r, "caller"); t.setDaemon(true); return t; });
        try {
            return caller.submit(() -> IoBatch.fetchAll(ex, ids, io, max)).get(10, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            throw new AssertionError("fetchAll không xong trong 10s");
        } catch (InterruptedException e) {
            throw new AssertionError(e);
        } catch (ExecutionException e) {
            if (e.getCause() instanceof RuntimeException) throw (RuntimeException) e.getCause();
            throw new AssertionError("fetchAll lỗi: " + e.getCause());
        } finally {
            caller.shutdownNow();
        }
    }
    static List<Integer> range(int n) {
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < n; i++) ids.add(i);
        return ids;
    }
    static void pause(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    public static void main(String[] args) {
        check("10,000 simulated IO calls: results in order, executor left open", () -> {
            ExecutorService ex = pool(100);
            try {
                List<String> out = run(ex, range(10_000), id -> { pause(1); return "R" + id; }, 100);
                eq(10_000, out.size());
                for (int i = 0; i < 10_000; i++) eq("R" + i, out.get(i));
                if (ex.isShutdown()) throw new AssertionError("không được shutdown executor của người gọi");
            } finally { ex.shutdownNow(); }
        });
        check("never more than maxInFlight concurrent calls", () -> {
            ExecutorService ex = pool(32);
            AtomicInteger active = new AtomicInteger(), maxActive = new AtomicInteger();
            try {
                run(ex, range(400), id -> {
                    maxActive.accumulateAndGet(active.incrementAndGet(), Math::max);
                    pause(2);
                    active.decrementAndGet();
                    return "ok";
                }, 8);
                if (maxActive.get() > 8) throw new AssertionError(maxActive.get() + " lời gọi đồng thời, tối đa 8");
                if (maxActive.get() < 2) throw new AssertionError("các lời gọi không chạy song song");
            } finally { ex.shutdownNow(); }
        });
        check("calls run on the given executor", () -> {
            ExecutorService ex = pool(8);
            Set<String> names = ConcurrentHashMap.newKeySet();
            try {
                run(ex, range(50), id -> { names.add(Thread.currentThread().getName()); return "x"; }, 4);
                for (String n : names) if (!n.startsWith("io-")) throw new AssertionError("io chạy trên thread " + n + ", không phải executor");
            } finally { ex.shutdownNow(); }
        });
        check("failed call becomes ERR-id, others unaffected", () -> {
            ExecutorService ex = pool(8);
            try {
                List<String> out = run(ex, List.of(5, 13, 21, 13), id -> {
                    if (id == 13) throw new IllegalStateException("timeout calling partner");
                    return "R" + id;
                }, 2);
                eq(List.of("R5", "ERR-13", "R21", "ERR-13"), out);
            } finally { ex.shutdownNow(); }
        });
        check("single-thread executor and maxInFlight 1 still finish", () -> {
            ExecutorService ex = pool(1);
            try { eq(List.of("R1", "R2", "R3"), run(ex, List.of(1, 2, 3), id -> "R" + id, 1)); }
            finally { ex.shutdownNow(); }
        });
        check("edge cases: empty list, invalid maxInFlight", () -> {
            ExecutorService ex = pool(2);
            try {
                eq(List.of(), run(ex, List.of(), id -> "x", 3));
                try { run(ex, List.of(1), id -> "x", 0); throw new AssertionError("maxInFlight = 0 phải ném IllegalArgumentException"); }
                catch (IllegalArgumentException expected) { }
            } finally { ex.shutdownNow(); }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class IoBatch {
    static List<String> fetchAll(ExecutorService executor, List<Integer> ids,
                                 Function<Integer, String> io, int maxInFlight) {
        if (maxInFlight < 1) throw new IllegalArgumentException("maxInFlight must be >= 1");
        Semaphore permits = new Semaphore(maxInFlight);   // giới hạn tài nguyên, không phải giới hạn thread
        List<Future<String>> futures = new ArrayList<>(ids.size());
        for (Integer id : ids) {
            futures.add(executor.submit(() -> {
                permits.acquire();                 // virtual thread chờ ở đây sẽ unmount, không tốn carrier
                try {
                    return io.apply(id);
                } catch (RuntimeException e) {
                    return "ERR-" + id;
                } finally {
                    permits.release();             // luôn trả permit, kể cả khi lỗi
                }
            }));
        }
        List<String> results = new ArrayList<>(ids.size());
        try {
            for (Future<String> f : futures) results.add(f.get());   // giữ đúng thứ tự đầu vào
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            for (Future<String> f : futures) f.cancel(true);
            throw new IllegalStateException("interrupted", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException(e.getCause());
        }
        return results;                            // không shutdown: executor thuộc về người gọi
    }
}`,
      hints: [
        'Tạo {{new Semaphore(maxInFlight)}}; trong mỗi task: {{acquire()}}, gọi {{io.apply(id)}} trong {{try}}, {{release()}} trong {{finally}}.',
        'Submit hết các task trước, giữ {{List<Future<String>>}}, rồi mới {{get()}} lần lượt: vừa song song vừa đúng thứ tự.',
        'Bắt {{RuntimeException}} quanh {{io.apply}} để trả về {{"ERR-" + id}}. Đừng gọi {{executor.shutdown()}}.',
      ],
      explain: `Đây đúng là hình dạng code bạn viết với virtual thread trên Java 21:

~~~java
try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
    List<String> out = IoBatch.fetchAll(ex, ids, partnerApi::get, 50);
}
~~~

Mỗi id một task, không cần nghĩ tới kích thước pool; thứ cần giới hạn là **số lời gọi đồng thời tới đối tác** (50), và Semaphore làm việc đó. Với virtual thread, 9.950 task đang chờ permit sẽ unmount nên gần như không tốn gì. Với pool thường như trong test, thread chờ permit vẫn chiếm một platform thread, nên trên Java 17 người ta thường giới hạn bằng kích thước pool; trên Java 21 với virtual thread thì Semaphore là cách đúng.

Vì sao {{release()}} phải nằm trong {{finally}}? Nếu một lời gọi ném exception mà không trả permit, mỗi lỗi làm mất một permit vĩnh viễn; sau {{maxInFlight}} lỗi, mọi task còn lại chờ mãi.

Lỗi hay gặp:
- Gọi {{get()}} ngay sau mỗi {{submit}}: chạy tuần tự, mất hết lợi ích.
- Shutdown executor của người gọi: với virtual-thread executor dùng chung, các phần khác của ứng dụng sẽ bị {{RejectedExecutionException}}.
- Giới hạn bằng cách tạo {{newFixedThreadPool(50)}} với factory virtual thread: đó là "pool virtual thread", trái với khuyến nghị của JEP 444.
- {{acquire()}} bên trong khối {{synchronized}}: trên JDK 21–23 virtual thread bị pin trong lúc chờ permit.`,
    },
  ],
  check: [
    {
      q: 'Trên JDK 21, một virtual thread gọi JDBC (chặn chờ socket) **bên trong** một method {{synchronized}}. Điều gì xảy ra?',
      options: ['Virtual thread unmount bình thường, carrier được giải phóng', 'Virtual thread bị pin: carrier thread bị chặn theo trong suốt thời gian chờ', 'JVM ném IllegalStateException', 'synchronized tự động được chuyển thành ReentrantLock'],
      answer: 1,
      explain: `Ở JDK 21–23, chặn trong synchronized làm virtual thread bị pin, carrier không phục vụ được virtual thread khác. Chỉ từ JDK 24 (JEP 491) nó mới unmount được trong trường hợp này. JVM không ném exception nào; pin chỉ ảnh hưởng hiệu năng, phát hiện bằng JFR {{jdk.VirtualThreadPinned}}. JVM không tự đổi synchronized sang ReentrantLock: bạn phải tự sửa code hoặc nâng cấp driver.`,
    },
    {
      q: 'Service gọi một API đối tác giới hạn 50 request đồng thời. Chuyển sang virtual thread, bạn giới hạn thế nào?',
      options: ['{{Executors.newFixedThreadPool(50)}} với ThreadFactory tạo virtual thread', '{{Semaphore(50)}} quanh lời gọi API, mỗi task một virtual thread', 'Đặt số carrier thread bằng 50', 'Không cần giới hạn vì virtual thread rẻ'],
      answer: 1,
      explain: `Virtual thread không nên pool; giới hạn tài nguyên bằng Semaphore (hoặc bulkhead/rate limiter) đúng tại chỗ dùng tài nguyên. Pool 50 virtual thread là "pool thứ rẻ" và giới hạn cả những phần việc không đụng tới API. Số carrier quyết định số virtual thread **chạy CPU** cùng lúc, không liên quan số request đang chờ IO. Không giới hạn thì đối tác trả 429 hoặc sập.`,
    },
    {
      q: 'Workload nào được lợi **ít nhất** khi chuyển sang virtual thread?',
      options: ['API gateway gọi 3 service phía sau cho mỗi request', 'Batch nén và mã hoá file, CPU luôn 100%', 'Consumer xử lý message rồi ghi DB', 'Service đọc S3 và trả về cho client'],
      answer: 1,
      explain: `Việc CPU-bound không có thời gian chờ để nhường carrier, và số carrier bằng số core, nên throughput không tăng. Ba lựa chọn còn lại đều phần lớn thời gian là chờ IO (HTTP, DB, S3): đó chính là chỗ virtual thread giúp chạy nhiều việc đồng thời với code chặn đơn giản.`,
    },
  ],
  related: ['concurrency-007', 'concurrency-013', 'concurrency-008'],
  tags: ['virtual threads', 'Loom', 'pinning', 'JEP 444', 'JEP 491', 'Semaphore'],
},
{
  id: 'lesson-concurrency-006',
  track: 'concurrency',
  order: 6,
  title: 'CompletableFuture từ gốc: hộp kết quả, callback và cách nối việc',
  level: 'mid',
  minutes: 40,
  goals: [
    'Giải thích được {{CompletableFuture}} là "hộp chứa kết quả chưa có" và vì sao mô hình callback không chiếm thread khi chờ',
    'Viết đúng {{thenApply}} (biến đổi) và {{thenCompose}} (nối hai việc bất đồng bộ) mà không bị hộp lồng hộp',
    'Gom nhiều lời gọi song song bằng {{thenCombine}}/{{allOf}} và lấy kết quả của từng cái',
    'Xử lý lỗi bằng {{exceptionally}}/{{handle}}, phân biệt {{CompletionException}} và {{ExecutionException}}, và luôn truyền executor riêng cho việc IO',
  ],
  body: `### Điểm xuất phát: chờ cũng tốn thread
Bạn gọi một API mất 200 ms. Cách cổ điển với {{Future}} của {{ExecutorService}}:

~~~java
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<String> f = pool.submit(() -> httpGet("https://api.example/price"));
String text = f.get();                 // DỪNG tại dòng này tới khi có dữ liệu
int price = Integer.parseInt(text);    // chỉ chạy sau khi có text
~~~

{{get()}} là lời gọi **chặn (blocking)**: thread gọi đứng lại ngay đó, không làm gì trong 200 ms. Một request thì chẳng sao, nhưng server của bạn có lúc 1.000 request đồng thời, mỗi request chờ 2 backend 200 ms nghĩa là ~1.000 thread đang **chờ không**, mỗi thread là một **platform thread** (thread thật của hệ điều hành, stack mặc định khoảng 1 MB) và CPU mất thời gian cho **context switch** (lưu trạng thái thread này, nạp thread khác lên chạy).

**CompletableFuture** (có từ Java 8) đảo mô hình: thay vì đứng chờ, bạn giao việc rồi đăng ký "khi nào có kết quả thì làm tiếp những gì". Ba thuật ngữ hay dùng:
- **bất đồng bộ (asynchronous)**: phát việc đi rồi làm việc khác, không dừng tại chỗ chờ.
- **callback**: một hàm bạn đưa cho người khác; khi tới lượt, họ gọi lại hàm đó.
- **stage**: một bước trong chuỗi việc ("bước 1 lấy JSON, bước 2 parse, bước 3 tính thuế").

### CompletableFuture là một cái hộp
Hình dung một cái hộp có ba trạng thái: **chưa có gì**, **đã có giá trị**, **đã có lỗi**. Chỉ được chuyển từ "chưa có gì" sang một trong hai trạng thái sau, một lần duy nhất.

~~~java
CompletableFuture<Integer> box = new CompletableFuture<>();   // hộp rỗng
box.thenApply(v -> System.out.println("được " + v));          // đăng ký việc khi hộp đầy
box.complete(95);                                             // điền vào: in "được 95"
box.complete(99);                                             // hộp đã đầy: lệnh này bị bỏ qua, KHÔNG lỗi
~~~

{{complete(value)}} điền giá trị; {{completeExceptionally(error)}} điền lỗi; {{cancel(true)}} điền lỗi {{CancellationException}}. Ai điền thì **chính thread đó** kích hoạt các việc đã đăng ký. Đây là toàn bộ cơ chế: mỗi future giữ kết quả (hoặc lỗi) và danh sách các stage phụ thuộc; khi được điền đầy, nó chạy lần lượt các stage phụ thuộc đó.

Vì nó cũng là một {{Future}}, bạn vẫn có {{get()}} (ném checked {{ExecutionException}}) và {{join()}} (ném unchecked {{CompletionException}}) khi thật sự cần kết quả ngay.

### thenApply: biến kết quả thành kết quả khác (map)
Giống {{Stream.map}}: hàm của bạn nhận giá trị, trả giá trị **khác**, mọi thứ vẫn nằm trong một hộp.

~~~java
CompletableFuture<String> json = CompletableFuture.supplyAsync(() -> httpGet(url), ioPool);
CompletableFuture<Integer> price = json
        .thenApply(body -> parsePrice(body))     // String -> Integer
        .thenApply(p -> p + tax(p));             // Integer -> Integer
~~~

Đọc theo kiểu "được cái gì thì làm gì": được json thì parse, được price thì cộng thuế. Không dòng nào chặn.

**Callback chạy trên thread nào?** Đây là chỗ hay sai nhất:
- {{thenApply(f)}} (không có hậu tố {{Async}}): chạy trên **thread đã hoàn thành stage trước**. Ngoại lệ: nếu stage trước **đã xong rồi** tại thời điểm bạn gọi {{thenApply}}, f chạy **ngay trên thread gọi**, đồng bộ.
- {{thenApplyAsync(f, exec)}}: luôn chuyển {{f}} sang {{exec}}; không truyền executor thì dùng {{ForkJoinPool.commonPool()}}.

Vì vậy "không Async" chỉ nên dùng cho việc **nhanh** (đổi định dạng, lọc). Nếu bạn tính nặng hoặc gọi tiếp IO trong {{thenApply}} đang chạy trên thread của HTTP client, bạn chiếm thread đó và làm nghẽn cả client.

### thenCompose: khi bước tiếp theo cũng phải chờ (flatMap)
Bước sau **của chính nó cũng trả về một CompletableFuture**. Dùng {{thenApply}} thì bạn nhận một cái hộp đựng một cái hộp khác, không dùng được trực tiếp:

~~~java
CompletableFuture<User> user = findUser(id);           // CompletableFuture<User>
CompletableFuture<CompletableFuture<List<Order>>> bad = user.thenApply(u -> findOrders(u));   // hộp lồng hộp: sai
CompletableFuture<List<Order>> good = user.thenCompose(u -> findOrders(u));                   // đúng: đã làm phẳng
~~~

Quy tắc để không bao giờ chọn sai: nhìn **kiểu trả về của hàm trong ngoặc**. Hàm trả về giá trị thường thì dùng {{thenApply}}; hàm trả về {{CompletableFuture}} thì dùng {{thenCompose}}. Giống cặp {{map}}/{{flatMap}} trong Stream và {{map}}/{{flatMap}} trong Optional.

### thenCombine và allOf: khi có nhiều việc độc lập
- {{a.thenCombine(b, (va, vb) -> ...)}}: hai việc **độc lập** chạy song song; hàm gộp chạy khi cả hai đều xong.
- {{CompletableFuture.allOf(a, b, c)}}: chờ **tất cả**, trả về {{CompletableFuture<Void>}} — tức là "cái còi hiệu lệnh", không chứa kết quả. Muốn lấy kết quả phải {{join()}} từng future (lúc đó chúng đã xong nên {{join()}} không chặn).
- {{anyOf(a, b, c)}}: xong khi **cái đầu tiên** xong, kể cả xong vì lỗi.

~~~text
  findUser   ─┐
  findCart   ─┼─ allOf ──> thenApply(gộp 3 kết quả) ──> future cuối
  findPromo  ─┘
~~~

### Executor: đừng dùng cái mặc định
{{CompletableFuture.supplyAsync(supplier)}} **không truyền executor** sẽ chạy trên {{ForkJoinPool.commonPool()}} — pool dùng chung cho cả JVM (kể cả parallel stream), mặc định chỉ khoảng "số core - 1" thread. Bạn đặt 8 lời gọi HTTP chậm 2 giây vào đó thì commonPool hết thread, và **mọi** parallel stream, mọi thư viện dùng commonPool khác trong cùng JVM bị đứng theo. Quy tắc cứng:

| Loại việc | Chạy ở đâu |
|---|---|
| Chặn chờ (HTTP, JDBC, file, API đối tác) | executor **riêng**, cỡ đặt theo tài nguyên phía sau; hoặc virtual thread (Java 21) |
| Tính toán thuần CPU, ngắn | commonPool chấp nhận được |
| Việc nhanh (đổi format, lọc, gộp object) | dùng {{thenApply}} không Async, tận dụng thread vừa hoàn thành |

{{runAsync(runnable)}} giống {{supplyAsync}} nhưng runnable không trả giá trị, nên kiểu là {{CompletableFuture<Void>}}.

### Lỗi đi theo chuỗi, và hai lớp bọc
Nếu một stage ném exception, các stage phụ thuộc **bỏ qua hàm của chúng** và future cuối cùng hoàn thành bằng lỗi; lỗi gốc bị bọc trong {{CompletionException}}. Bộ bắt lỗi:

~~~java
findUser(id)
    .thenCompose(u -> findOrders(u))
    .exceptionally(ex -> {                      // chỉ chạy khi có lỗi
        Throwable root = (ex instanceof CompletionException && ex.getCause() != null) ? ex.getCause() : ex;
        if (root instanceof TimeoutException) return List.of();     // fallback: trả danh sách rỗng
        throw new IllegalStateException(root);                       // lỗi khác: để cả request fail
    })
    .whenComplete((v, ex) -> metrics.record(ex == null));            // log/metric, không đổi kết quả
~~~

- {{exceptionally(fn)}}: chỉ chạy khi lỗi, trả giá trị thay thế.
- {{handle((value, error) -> ...)}}: luôn chạy, nhận cả giá trị lẫn lỗi, trả kết quả mới (dùng để "biến lỗi thành giá trị an toàn").
- {{whenComplete((value, error) -> ...)}}: luôn chạy, **trả lại nguyên** kết quả/lỗi — hợp để log.
- Muốn "một nhánh lỗi thì cả request fail": đừng gắn handler ở mỗi nhánh, để lỗi tự lan tới tương lai cuối rồi bắt ở đó.

{{join()}} ném {{CompletionException}} (unchecked, lan được qua lambda mà không khai báo); {{get()}} ném {{ExecutionException}} (checked, buộc try/catch). Cả hai có {{getCause()}} là lỗi gốc. Trong {{exceptionally}}/{{handle}}, tham số lỗi **đã bị bọc**, nên đừng so kiểu trực tiếp ở lớp ngoài cùng.

### Timeout: tương lai xong không có nghĩa là việc đã dừng
Java 9 thêm {{orTimeout(t, unit)}} (hết giờ thì hoàn thành bằng {{TimeoutException}}) và {{completeOnTimeout(value, t, unit)}} (hết giờ thì dùng giá trị dự phòng). Hai điều phải nhớ:
1. Chúng **không dừng** công việc bên dưới. Lời gọi HTTP vẫn chạy tới khi xong và vẫn chiếm thread của pool. Vẫn phải đặt read timeout ở tầng client (HTTP client, JDBC).
2. {{cancel(true)}} trên CompletableFuture bỏ qua tham số {{mayInterruptIfRunning}}: không có ai để interrupt.

### Bài tập mẫu: "nguồn nào lỗi thì bỏ qua"
Yêu cầu hay gặp: gọi 5 nguồn giá song song, bỏ qua nguồn lỗi, lấy giá nhỏ nhất, chỉ báo lỗi khi **không** nguồn nào dùng được. Khuôn giải quyết bài toán "một phần thất bại là bình thường":

~~~java
List<CompletableFuture<Integer>> calls = new ArrayList<>();
for (Supplier<Integer> s : sources) {
    calls.add(CompletableFuture.supplyAsync(s, executor)
            .handle((v, e) -> e == null ? v : null));   // chuẩn hoá: không nguồn nào "lỗi" nữa
}
CompletableFuture.allOf(calls.toArray(new CompletableFuture[0])).join();
// allOf luôn xong bình thường; join() từng cái không chặn vì đã xong hết
~~~

Sau đó lọc null và lấy min. Đây chính là bài tập bên dưới.

### Lỗi production hay gặp
- Gọi {{join()}} **bên trong** một task của cùng pool hữu hạn: task A chờ task B, pool hết thread, không ai chạy được B — treo kiểu starvation deadlock.
- Không gắn handler nào và cũng không ai {{join}}: exception biến mất không dấu vết, chỉ thấy request "treo rồi timeout".
- Mất MDC/traceId, SecurityContext: chúng là {{ThreadLocal}} của thread gốc, callback chạy trên thread khác nên rỗng. Cần executor bọc context ({{TaskDecorator}} của Spring, Micrometer Context Propagation).
- Quên {{return}} trong lambda một khối {{if}} có nhiều nhánh: hàm trả về null, future "thành công với null", và NPE ở chỗ không ngờ tới.
- Trộn lẫn {{get()}} và {{join()}} trong cùng chuỗi, bắt {{ExecutionException}} nhưng lỗi thật đến nơi lại là {{CompletionException}}.

### Liên hệ phỏng vấn
Người hỏi hay bắt đầu từ "Future khác CompletableFuture thế nào?" rồi đào: "callback chạy trên thread nào?", "thenApply khác thenCompose?", "5 service phía sau, 1 service chậm thì xử lý ra sao?". Cách trả lời ăn điểm: nói được **tên** executor mặc định và tai hại của nó, nói được rằng timeout của future không dừng được lời gọi bên dưới nên vẫn cần timeout ở client, và đưa ra được chiến lược lỗi rõ ràng (fail-fast toàn bộ, hay chuẩn hoá từng nguồn về giá trị trung tính rồi gom). Bài 4 trong track là phiên nâng cao của chính nội dung này: không chặn thread gọi, trả về {{CompletableFuture}} thẳng cho tầng web — đọc tiếp bài đó sau bài này.`,
  exercises: [
    {
      title: 'Giá tốt nhất từ nhiều nguồn: chạy song song, bỏ qua nguồn lỗi',
      prompt: `Viết {{PriceAggregator.best(sources, executor)}} — phiên bản **chặn** (dùng trong batch job), để lắp ghép từng mảnh của CompletableFuture cho chắc.

Chữ ký: {{static int best(List<Supplier<Integer>> sources, Executor executor)}}

- Phát **mọi** nguồn (mỗi nguồn là một {{Supplier<Integer>}}) chạy **song song** trên {{executor}} được truyền vào. Không nguồn nào được chờ một nguồn khác trước khi bắt đầu.
- Chờ tới khi mọi nguồn đã xong (thành công, lỗi, hoặc trả {{null}}), rồi trả về giá **nhỏ nhất** trong các kết quả hợp lệ.
- Nguồn ném {{RuntimeException}} hoặc trả về {{null}} coi như **không tồn tại**, nhưng vẫn phải được gọi.
- Không nguồn nào hợp lệ (bao gồm cả danh sách rỗng): ném {{NoSuchElementException}}.
- Không dùng {{ForkJoinPool.commonPool()}}. Không {{shutdown}} executor (người gọi sở hữu nó).
- Không bắt checked exception ({{Supplier}} không ném loại đó), không dùng {{Thread.sleep}}.

Bài kiểm tra dùng một pool cố định và {{CyclicBarrier}} để buộc các nguồn phải thực sự chạy **cùng lúc**: nếu bạn chạy tuần tự thì barrier hết giờ và bài tập fail. Nó cũng kiểm tra tên thread để chắc bạn dùng executor được truyền.`,
      starter: `class PriceAggregator {
    static int best(List<Supplier<Integer>> sources, Executor executor) {
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
    static ExecutorService pool(int n) {
        AtomicInteger seq = new AtomicInteger();
        return Executors.newFixedThreadPool(n, r -> { Thread t = new Thread(r, "src-" + seq.incrementAndGet()); t.setDaemon(true); return t; });
    }
    static Supplier<Integer> boom(String msg) { return () -> { throw new IllegalStateException(msg); }; }
    public static void main(String[] args) {
        check("every source succeeds: returns the minimum", () -> {
            ExecutorService ex = pool(4);
            try { eq(95, PriceAggregator.best(List.of(() -> 120, () -> 95, () -> 110), ex)); }
            finally { ex.shutdownNow(); }
        });
        check("a throwing source is skipped, the rest still counted", () -> {
            ExecutorService ex = pool(4);
            AtomicInteger good = new AtomicInteger();
            AtomicInteger bad = new AtomicInteger();
            Supplier<Integer> ok = () -> { good.incrementAndGet(); return 80; };
            Supplier<Integer> broken = () -> { bad.incrementAndGet(); throw new IllegalStateException("vendor B 500"); };
            try {
                eq(80, PriceAggregator.best(List.of(broken, ok, broken, ok), ex));
                eq(2, good.get());
                eq(2, bad.get());   // không được bỏ qua nguồn nào chỉ vì nguồn trước đó lỗi
            } finally { ex.shutdownNow(); }
        });
        check("null results are treated as missing", () -> {
            ExecutorService ex = pool(4);
            try { eq(140, PriceAggregator.best(List.of(() -> null, () -> 140, () -> null, () -> 190), ex)); }
            finally { ex.shutdownNow(); }
        });
        check("all sources fail: NoSuchElementException and every source called", () -> {
            ExecutorService ex = pool(4);
            AtomicInteger calls = new AtomicInteger();
            try {
                List<Supplier<Integer>> sources = List.of(boom("a"), boom("b"), () -> { calls.incrementAndGet(); return null; });
                try {
                    int v = PriceAggregator.best(sources, ex);
                    throw new AssertionError("phải ném NoSuchElementException, nhưng trả về " + v);
                } catch (NoSuchElementException expected) { }
                eq(1, calls.get());
            } finally { ex.shutdownNow(); }
        });
        check("empty list: NoSuchElementException, no task submitted", () -> {
            ExecutorService ex = pool(4);
            AtomicInteger submitted = new AtomicInteger();
            Executor counted = r -> { submitted.incrementAndGet(); ex.execute(r); };
            try {
                try {
                    int v = PriceAggregator.best(List.of(), counted);
                    throw new AssertionError("danh sách rỗng phải ném NoSuchElementException, nhưng trả về " + v);
                } catch (NoSuchElementException expected) { }
                eq(0, submitted.get());
            } finally { ex.shutdownNow(); }
        });
        check("sources really run at the same time, on the given executor", () -> {
            ExecutorService ex = pool(3);
            CyclicBarrier barrier = new CyclicBarrier(3);   // chỉ qua được khi 3 nguồn đang chạy ĐỒNG THỜI
            Set<String> threads = ConcurrentHashMap.newKeySet();
            Supplier<Integer> sync = () -> {
                threads.add(Thread.currentThread().getName());
                try { barrier.await(2, TimeUnit.SECONDS); }
                catch (Exception e) { throw new IllegalStateException("nguồn không chạy song song: " + e); }
                return 300;
            };
            try {
                eq(300, PriceAggregator.best(List.of(sync, sync, sync), ex));
                eq(3, threads.size());
                for (String t : threads) if (!t.startsWith("src-")) throw new AssertionError("nguồn chạy trên " + t + ", không phải executor được truyền");
            } finally { ex.shutdownNow(); }
        });
        check("works on a single-thread executor (caller must not block a pool thread)", () -> {
            ExecutorService ex = pool(1);
            try { eq(7, PriceAggregator.best(List.of(() -> 30, () -> 7, () -> 22), ex)); }
            finally { ex.shutdownNow(); }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class PriceAggregator {
    static int best(List<Supplier<Integer>> sources, Executor executor) {
        List<CompletableFuture<Integer>> calls = new ArrayList<>();
        for (Supplier<Integer> source : sources) {
            calls.add(CompletableFuture.supplyAsync(source, executor)        // dùng executor của người gọi, không dùng commonPool
                    .handle((value, error) -> error == null ? value : null)); // lỗi -> null để allOf luôn xong bình thường
        }
        CompletableFuture.allOf(calls.toArray(new CompletableFuture[0])).join();  // chờ tất cả; không nguồn nào còn lỗi
        return calls.stream()
                .map(CompletableFuture::join)        // đã xong nên join không chặn nữa
                .filter(Objects::nonNull)            // nguồn lỗi hoặc trả null bị loại
                .min(Integer::compare)
                .orElseThrow(() -> new NoSuchElementException("no price available"));
    }
}`,
      hints: [
        'Vòng lặp đầu tiên **chỉ phát việc**, chưa lấy kết quả: {{CompletableFuture.supplyAsync(source, executor)}} và nhét vào {{List}}. Nếu bạn gọi {{get()}} ngay trong vòng lặp thì mọi nguồn chạy tuần tự.',
        'Biến nguồn lỗi thành nguồn "trả null" để {{allOf}} luôn xong bình thường: {{.handle((v, e) -> e == null ? v : null)}}.',
        '{{CompletableFuture.allOf(list.toArray(new CompletableFuture[0])).join()}} chờ tất cả. Sau đó {{join()}} trên từng future không còn chặn nữa.',
        'Lọc {{null}} rồi {{min(Integer::compare)}}; {{Optional.orElseThrow(() -> new NoSuchElementException("no price available"))}} ném thẳng {{NoSuchElementException}} vì đoạn này chạy trên thread của người gọi.',
      ],
      explain: `Bốn mảnh ghép trong lời giải:
1. {{supplyAsync(source, executor)}} cho mỗi nguồn: toàn bộ nguồn được phát đi **trước khi** có bất kỳ lần chờ nào, nên chúng chồng lấn thời gian. Test dùng {{CyclicBarrier(3)}} để bắt lỗi chạy tuần tự: nếu chỉ một nguồn chạy tại một thời điểm thì barrier không bao giờ đủ người, hết 2 giây, nguồn đó ném exception và kết quả cuối không phải 300.
2. {{handle}} chuẩn hoá lỗi thành {{null}}. Nếu bỏ bước này, một nguồn lỗi làm {{allOf}} hoàn thành bằng lỗi và bạn mất luôn các nguồn tốt.
3. {{allOf(...).join()}}: chờ đủ. {{join()}} ở đây chấp nhận được vì đây là bài tập dạng chặn; trong ứng dụng web hãy trả về {{CompletableFuture}} và gắn {{thenApply}} thay vì chặn thread request.
4. {{join()}} trên từng future đã xong: chỉ đọc kết quả đã nằm trong hộp.

{{NoSuchElementException}} được ném **bên ngoài** chuỗi future (trong stream chạy trên thread gọi), nên người dùng {{best}} bắt được trực tiếp, không bị bọc trong {{CompletionException}}. Nếu bạn viết {{allOf(...).thenApply(v -> ...orElseThrow...)}} thì lỗi sẽ đi vào future và {{join()}}/{{get()}} mới là chỗ ném ra, có bọc một lớp.

Lỗi hay gặp:
- {{for (var s : sources) results.add(supplyAsync(s, ex).get())}}: đúng về kết quả nhưng chạy tuần tự, tổng thời gian bằng tổng từng nguồn.
- Dùng {{anyOf}} để "lấy nguồn nhanh nhất": đây là {{min}} về **giá**, không phải về tốc độ, và {{anyOf}} "thắng" cả khi nguồn lỗi.
- Quên tham số executor: chạy trên commonPool, test tên thread báo đỏ, và trên production bạn đang dùng chung pool với mọi thành phần khác trong JVM.
- {{join()}} mà không chuẩn hoá lỗi: bạn sẽ nhận {{CompletionException}} thay vì {{NoSuchElementException}} khi mọi nguồn lỗi.
- Gọi {{best}} từ **bên trong** một task của {{executor}} đó với pool hữu hạn: starve, treo. Muốn thế thì phải dùng pool khác hoặc viết lại thành chuỗi callback.`,
    },
  ],
  check: [
    {
      q: '{{CompletableFuture.supplyAsync(() -> doWork())}} và {{CompletableFuture.runAsync(() -> doWork())}} khác nhau ở đâu?',
      options: ['Không khác gì, chỉ là hai tên gọi', '{{supplyAsync}} trả {{CompletableFuture}} chứa giá trị do {{doWork}} trả về; {{runAsync}} trả {{CompletableFuture<Void>}} vì Runnable không có giá trị', '{{runAsync}} chạy trên thread gọi, {{supplyAsync}} chạy trên pool', '{{supplyAsync}} là blocking, {{runAsync}} là non-blocking'],
      answer: 1,
      explain: `{{Supplier<T>}} có giá trị trả về nên hộp chứa {{T}}; {{Runnable}} trả void nên hộp là {{CompletableFuture<Void>}}. Cả hai đều async và đều dùng {{ForkJoinPool.commonPool()}} khi không truyền executor. Không có cái nào "blocking".`,
    },
    {
      q: 'Future {{f}} **đã hoàn thành** từ lâu. Bạn gọi {{f.thenApply(x -> calc(x))}}. Khi nào {{calc}} chạy và trên thread nào?',
      options: ['Ngay lập tức, trên thread vừa gọi {{thenApply}}', 'Ngay lập tức, trên thread của {{ForkJoinPool.commonPool()}}', 'Chờ tới khi có ai gọi {{join()}}', 'Trên thread đã hoàn thành {{f}}, dù nó đã chết'],
      answer: 0,
      explain: `Stage trước đã đầy nên không có gì để chờ: các CompletableFuture được thiết kế chạy stage phụ **ngay trên thread thêm nó vào** (đường đi nhanh, tránh lập lịch thừa). Muốn chắc chắn đổi thread thì dùng {{thenApplyAsync(fn, executor)}}. Không có gì chặn tới {{join()}} và thread cũ đã chết thì không chạy được gì.`,
    },
    {
      q: '{{CompletableFuture.allOf(a, b, c)}} trả về gì, và lấy kết quả của {{a}} thế nào?',
      options: ['{{CompletableFuture<List<T>>}}, kết quả đã gom sẵn', '{{CompletableFuture<Void>}}; sau khi nó xong thì gọi {{a.join()}} để đọc kết quả của a', '{{CompletableFuture<Void>}}; phải gọi {{get()}} trên mỗi future và mỗi lần sẽ chặn vài giây', 'Trả về future của cái xong sớm nhất'],
      answer: 1,
      explain: `{{allOf}} chỉ là "còi hiệu lệnh": nó không chứa giá trị nên kiểu là {{Void}}, và không tự gom gì cả. Sau khi nó hoàn thành, các future thành phần **đã xong**, nên {{join()}} chỉ đọc kết quả đã có, không chặn. Đáp án đầu là cách bạn phải tự viết bằng {{thenApply}}. Mô tả "cái xong sớm nhất" là {{anyOf}}.`,
    },
    {
      q: 'Một stage giữa chuỗi ném {{IOException}} ({{HttpClient}} bọc nó thành {{RuntimeException}} khi chạy thật, nhưng coi như lỗi gốc là {{IOException}}). Chuỗi không có handler. Người gọi cuối cùng dùng {{join()}}. Nhận được gì?',
      options: ['{{IOException}}', '{{CompletionException}} mà {{getCause()}} là {{IOException}}', '{{ExecutionException}} có cause là {{IOException}}', 'Không nhận được gì, lỗi bị nuốt'],
      answer: 1,
      explain: `Lỗi lan qua các stage và được bọc một lớp {{CompletionException}}; {{join()}} ném loại unchecked đó, {{getCause()}} là lỗi gốc. {{ExecutionException}} là phiên bản checked của {{get()}}. Lỗi không bị nuốt vì future cuối đã hoàn thành bằng lỗi — ai {{join}}/{{get}} mới thấy; nếu không ai chờ thì đúng là... im lặng, đó là lý do luôn phải có handler hoặc điểm chờ.`,
    },
  ],
  related: ['concurrency-005', 'concurrency-037', 'concurrency-013'],
  tags: ['CompletableFuture', 'thenApply', 'thenCompose', 'allOf', 'executor', 'callback'],
},
{
  id: 'lesson-concurrency-007',
  track: 'concurrency',
  order: 7,
  title: 'Rate limiter và Semaphore: giới hạn tốc độ và giới hạn số việc đồng thời',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt **tốc độ** (bao nhiêu việc mỗi giây) và **độ đồng thời** (bao nhiêu việc đang chạy cùng lúc), và biết công cụ nào chặn cái nào',
    'Viết được token bucket và giải thích {{capacity}} (burst) khác {{refill rate}} ở đâu',
    'Viết sliding window counter và chỉ ra vì sao fixed window cho phép gấp đôi hạn mức ở biên',
    'Dùng {{Semaphore}} đúng: {{release()}} trong {{finally}}, {{tryAcquire}} có timeout, và cách làm test deterministic bằng đồng hồ giả',
  ],
  body: `### Hai thứ hay bị gọi chung là "giới hạn tải"
- **Độ đồng thời (concurrency)**: tại một thời điểm có bao nhiêu việc **đang chạy**. Ví dụ hồ bơi chỉ cho 3 người nhảy cùng lúc.
- **Tốc độ (rate)**: trong một khoảng thời gian có bao nhiêu việc **được bắt đầu**. Ví dụ quầy phát 100 vé mỗi phút, dù mỗi người chỉ ở trong 2 giây.

Chúng không suy ra nhau. Nếu mỗi request tới DB mất 10 ms thì 3 request đồng thời tương đương ~300 request/giây; nếu DB chậm lại 2 giây thì cùng 3 request đồng thời chỉ còn ~1,5 request/giây. Vì vậy "Semaphore(3)" không phải là "100 request/giây", và ngược lại.

| Nhu cầu | Công cụ |
|---|---|
| Bảo vệ tài nguyên đếm theo **số luồng đang dùng** (connection pool, số file đang mở, "tối đa 50 request đồng thời tới đối tác") | {{Semaphore}} |
| Bảo vệ hạn mức theo **thời gian** (100 req/s, 1 triệu token LLM mỗi phút, chống spam) | rate limiter: token bucket / sliding window |
| Cả hai (thường gặp trong thật) | bulkhead (Semaphore) + rate limiter đặt cạnh nhau |

Vì sao phải **tự** giới hạn trước khi người khác giới hạn bạn: đối tác trả {{HTTP 429 Too Many Requests}} (kèm header {{Retry-After}} nói chờ bao lâu), DB bị quá tải, hóa đơn tăng theo số request, và tệ nhất là "retry storm": client bị từ chối rồi retry ngay lập tức, làm tải tăng gấp nhiều lần và hệ thống không bao giờ hồi phục.

### Semaphore từng bước
{{Semaphore}} là cái bình chứa {{n}} **permit** (vé). Lấy vé thì giảm số vé trong bình; trả vé thì tăng lại.

~~~java
Semaphore permits = new Semaphore(3);            // 3 vé
void handle(Request r) throws InterruptedException {
    permits.acquire();                            // hết vé thì DỪNG tại đây chờ
    try {
        partnerClient.call(r);                    // tối đa 3 lời gọi đang chạy đồng thời
    } finally {
        permits.release();                        // BẮT BUỘC nằm trong finally
    }
}
~~~

| API | Hành vi |
|---|---|
| {{acquire()}} | lấy 1 vé, chờ vô hạn nếu hết; bị interrupt thì ném {{InterruptedException}} |
| {{acquireUninterruptibly()}} | chờ tới khi lấy được, không bị interrupt đánh thức |
| {{tryAcquire()}} | lấy nếu còn vé, **không chờ**, trả {{true/false}} |
| {{tryAcquire(200, TimeUnit.MILLISECONDS)}} | chờ tối đa 200 ms, hết giờ trả {{false}} — cách biến "chờ" thành "từ chối nhanh" |
| {{release()}} | thêm 1 vé vào bình (**không cần** đã {{acquire}} trước đó), số vé có thể vượt {{n}} |
| {{drainAcquire(n)}} | giật {{n}} vé đang có, trả về số giật được, không chờ |
| {{new Semaphore(3, true)}} | công bằng: ai chờ trước được cấp trước; đắt hơn vì phải xếp hàng |

Hai chi tiết hay bị hỏi:
1. **Mặc định không công bằng (non-fair)**: thread vừa được đánh thức có thể giành vé trước người chờ lâu hơn, đổi lại throughput cao hơn. Chọn {{fair = true}} khi bạn thấy starvation trong metric, không chọn theo cảm giác.
2. {{release()}} không "thuộc về" ai: gọi release mà không acquire là **tăng** số vé. Vì thế phần code cho phép release thừa (release trong {{catch}}, hoặc release mà không vào {{try}}) làm giới hạn biến mất một cách im lặng.

Bẫy số một của Semaphore: vé bị **rò**. Nếu {{release()}} không nằm trong {{finally}} mà {{partnerClient.call}} ném exception, mỗi lần lỗi mất một vé vĩnh viễn; sau 3 lần lỗi thì {{acquire()}} chờ mãi và cả service đứng, dù CPU rảnh.

### Token bucket: tốc độ trung bình, cho phép burst
Hình dung một cái bucket (xô) chứa tối đa {{capacity}} viên bi (token). Một vòi nhỏ rót {{refillPerSecond}} viên mỗi giây. Mỗi request lấy 1 viên; không còn viên thì bị từ chối ngay.

~~~text
          +-----------+
 refilling|  TOKENS   |  <--- moi giay them 100, tran 200 la dung
   +100/s |           |
          +-----------+
                 |
            tryAcquire(): con token -> lay 1, het -> tu choi
~~~

- {{refillPerSecond}} = **tốc độ trung bình** được phép về lâu dài.
- {{capacity}} = **cỡ burst**: vì bucket đã đầy sau một thời gian yên tĩnh, bạn có thể dồn 200 request trong 1 giây nếu bucket đang đầy, rồi bị giới hạn lại còn 100/giây. Đây là tính năng (chấp nhận traffic gợn sóng), không phải bug — nhưng nó cũng có nghĩa là ngay sau một khoảng lặng, hệ thống đang chịu đỉnh gấp đôi hạn mức trung bình.

Cách cài đặt đúng không cần thread rót bi định kỳ. Chỉ cần nhớ **lần rót cuối cùng** và số token hiện có, tính lúc dùng ("refill lười"):

~~~java
// elapsed là số nano kể từ lần kiểm tra trước
double gained = elapsed / 1_000_000_000.0 * refillPerSecond;
tokens = Math.min(capacity, tokens + gained);      // cắt trần ở capacity: không bao giờ dự trữ burst
if (tokens >= 1.0) { tokens -= 1.0; return true; }
return false;
~~~

Nếu mỗi giây lại "cộng 100 vào biến" bằng một thread định kỳ thì sai lệch tích lũy khi máy treo, và bạn thêm một thread phải quản lý. Refill lười chỉ là số học trên timestamps.

So sánh nhanh: **leaky bucket** (xô rò đáy) không cho burst — mọi request ra đều đặn một dòng, hợp với việc phải ghi xuống hàng đợi; token bucket cho burst, hợp với API quota. **Guava {{RateLimiter}}** và **Resilience4j {{RateLimiter}}** là hai thư viện phổ biến cung cấp sẵn bản warm-up/queued; trong phỏng vấn vẫn bị yêu cầu tự viết để kiểm tra bạn hiểu burst.

### Sliding window: đếm đúng trong "1 giây gần nhất"
Kiểm tra "trong {{windowNanos}} **vừa rồi** đã cho phép bao nhiêu request chưa". Cách chính xác nhất: nhớ danh sách thời điểm các request **được chấp nhận**.

~~~java
Deque<Long> hits = new ArrayDeque<>();          // chỉ lưu request ĐƯỢC chấp nhận
synchronized boolean allow() {
    long now = clock.getAsLong();
    while (!hits.isEmpty() && now - hits.peekFirst() >= window) hits.pollFirst();   // cái nào hết hạn nằm ở đầu
    if (hits.size() >= max) return false;
    hits.addLast(now);
    return true;
}
~~~

So với **fixed window counter** (một bộ đếm cho mỗi ô giây, reset đúng giờ), sliding window tránh được cú sốc biên:

~~~text
fixed window, max 3 request moi giay:
  giay 0: 3 request luc 0,90s -> du 3; bo dem reset luc 1,00s
  giay 1: 3 request luc 1,05s -> lai du 3
  => trong khoang 0,90s -> 1,05s (0,15s) co 6 request = 40 req/s, trong khi limit la 3 req/s

sliding window, cung max 3:
  3 request luc 0,90s -> den 1,05s van dem trong cua so 1 giay => tu choi ca 3
~~~

Nhược điểm: bộ nhớ tỉ lệ với số request trong cửa sổ (10.000 req/giây trong cửa sổ 1 phút là 600.000 timestamp). Người ta khắc phục bằng **sliding window counter** (chia cửa sổ thành vài ô nhỏ, mỗi ô chỉ giữ một số đếm, chấp nhận sai số) hoặc dùng **token bucket** khi chỉ cần xấp xỉ.

### Một JVM hay nhiều JVM
Limiter trong tiến trình của bạn chỉ đếm request **của chính tiến trình đó**. Service chạy 4 instance, mỗi instance đặt 100 req/s thì đối tác nhận 400 req/s. Hai hướng xử lý:
- **Chia hạn mức tĩnh**: mỗi instance {{limit / số instance}}; đơn giản nhưng sai khi autoscale hoặc một instance nhận nhiều traffic hơn (cần load balancer chia đều), và mỗi lần scale phải sửa cấu hình.
- **Bộ đếm chung**: để state ở nơi mọi instance cùng thấy — Redis (kho dữ liệu trong RAM, nhiều server cùng đọc/ghi; lệnh {{INCR}} + {{EXPIRE}} hoặc Lua script chạy **nguyên tử** trên server Redis), hoặc một gateway tập trung. Đổi lại thêm một round-trip mạng cho mỗi quyết định, và Redis sập thì limiter "cho qua hết" hoặc "chặn hết" — phải chọn fallback rõ ràng.

### Test sao cho không flaky
Hai kỹ thuật mà bài tập dùng:
1. **Tiêm đồng hồ**: nhận {{LongSupplier clockNanos}} thay vì gọi {{System.nanoTime()}}. Test tự quay đồng hồ 500 ms, 1 giây, 60 giây — nhanh, tái lập tuyệt đối, và kiểm tra được cả trường hợp đồng hồ đứng yên.
2. **Test đa luồng không đoán thời gian**: {{CountDownLatch(1)}} làm cổng xuất phát để 16 thread cùng lao vào, mỗi thread gọi {{tryAcquire()}} **cho tới khi bị từ chối** trên một bucket {{capacity = 100000}} và đồng hồ đóng băng. Không refill nghĩa là tổng số lần cấp **phải đúng bằng** capacity — một con số chính xác, không phải "khoảng bao đó". Code thiếu {{synchronized}} sẽ cộng/trừ {{tokens}} (hay {{size}} của danh sách hit) mất cập nhật, nên cấp NHIỀU hơn capacity; {{join(timeout)}} để không bao giờ treo. Đây chính là cách race "lộ ra ổn định": đừng chờ hai thread tình cờ chồng lấn vài nano giây, mà bắt chúng đánh nhau cả trăm nghìn lần.

### Lỗi production hay gặp
- Quên {{release()}} khi lỗi: vé rò, tới khi hết vé thì mọi request chờ tới timeout hàng loạt.
- Đặt limit theo **số instance bạn nghĩ là có**, không theo tài nguyên thật phía sau: sau một đợt autoscale, DB ăn gấp đôi số connection cho phép.
- Fixed window counter: khách hàng kêu "các bạn cho tôi gấp đôi quota trong 2 giây", hoặc ngược lại traffic đều đặn vẫn bị chặn ở đầu mỗi ô.
- Token bucket với {{capacity}} quá lớn so với khả năng thật của đối tác: burst đánh sập backend dù "trung bình thì đúng limit".
- Chặn trong lúc xin permit mà không có timeout: {{acquire()}} vô hạn biến một dependency chậm thành toàn bộ hàng đợi request treo (nên dùng {{tryAcquire(timeout)}} rồi fail-fast, và đặt timeout **nhỏ hơn** timeout của client).
- Retry mà không backoff và không tính tới {{Retry-After}}: tự gây ra retry storm.
- Không có **circuit breaker**: limiter giữ tốc độ gửi đi, còn circuit breaker là "cắt cầu dao" khi phía sau liên tục lỗi, cho hệ thống thở (Resilience4j cung cấp cả hai).

### Liên hệ phỏng vấn
Câu hay gặp: "API của bạn gọi một đối tác chỉ nhận 100 req/s, service chạy 6 instance, thiết kế thế nào?", "Semaphore khác RateLimiter ở đâu?", "burst thì tính sao?". Trả lời ăn điểm: tách rõ concurrency và rate, nêu token bucket cùng ý nghĩa {{capacity}}/burst, chỉ ra vấn đề nhiều instance và hai chiến lược (chia tĩnh so với bộ đếm chung qua Redis/gateway), nói được fallback khi bộ đếm chung chết, và biết cách test deterministic bằng đồng hồ tiêm vào. Nếu đề bài là "bảo vệ DB", hãy nói thêm về bulkhead và connection pool — đó mới là chỗ thắt thật sự.`,
  exercises: [
    {
      title: 'Token bucket thread-safe với đồng hồ tiêm vào',
      prompt: `Viết {{TokenBucket}} — bộ giới hạn tốc độ kiểu "xô token" (token bucket: một cái xô chứa viên bi, mỗi request lấy một viên).

Chữ ký constructor: {{TokenBucket(int capacity, int refillPerSecond, LongSupplier clockNanos)}}
- {{capacity}}: số token tối đa bucket chứa, cũng là cỡ burst lớn nhất.
- {{refillPerSecond}}: số token được thêm mỗi giây (tốc độ trung bình).
- {{clockNanos}}: nguồn thời gian tính bằng nano giây. Khi chạy thật là {{System.nanoTime()}}, khi test là một đồng hồ giả do test quay tay. **Không** được gọi {{System.nanoTime()}} nội bộ.

Method duy nhất: {{boolean tryAcquire()}} — xin 1 token, **không bao giờ chặn** và không bao giờ ném exception.
- Bucket **khởi tạo ở trạng thái đầy** ({{capacity}} token).
- Trước mỗi lần xin, nạp token theo thời gian đã trôi kể từ lần kiểm tra trước: thêm {{(nano trôi / 1 tỷ) * refillPerSecond}} token, nhưng không bao giờ vượt {{capacity}}.
- Nếu còn ít nhất 1 nguyên token thì trừ 1 và trả {{true}}; nếu không còn thì trả {{false}}. Không được "ghi nợ" (token không bao giờ âm), không được cho phép vượt hạn mức chỉ vì thread khác đang chờ.
- Phải **thread-safe**: nhiều thread cùng gọi thì tổng số lần trả {{true}} không được vượt số token thật sự tồn tại.
- Không dùng {{Thread.sleep}}, không tạo thread nền để "rót" token (tính lười bằng công thức), không giữ một hàng đợi token thật.

Gợi ý về thời gian: vì test sẽ đứng yên đồng hồ và cả quay đồng hồ 60 giây, mọi hành vi phải suy ra từ {{clockNanos}} mà thôi.`,
      starter: `class TokenBucket {
    TokenBucket(int capacity, int refillPerSecond, LongSupplier clockNanos) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean tryAcquire() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static final long SECOND = 1_000_000_000L;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static int acquire(TokenBucket b, int times) {
        int ok = 0;
        for (int i = 0; i < times; i++) if (b.tryAcquire()) ok++;
        return ok;
    }
    static void joinOrFail(Thread t, String what) {
        try { t.join(5000); } catch (InterruptedException e) { throw new AssertionError(e); }
        if (t.isAlive()) throw new AssertionError(what + " vẫn chạy sau 5s (tryAcquire bị chặn?)");
    }
    public static void main(String[] args) {
        check("fresh bucket is full: burst up to capacity, then reject (clock frozen)", () -> {
            AtomicLong clock = new AtomicLong(0);
            TokenBucket b = new TokenBucket(3, 1, clock::get);
            eq(3, acquire(b, 3));
            eq(0, acquire(b, 5));
        });
        check("1.1s of refill at 2 tokens/s grants exactly 2, not 1 and not 3", () -> {
            AtomicLong clock = new AtomicLong(0);
            TokenBucket b = new TokenBucket(3, 2, clock::get);
            eq(3, acquire(b, 10));
            clock.addAndGet(SECOND + SECOND / 10);
            eq(2, acquire(b, 10));
        });
        check("fractional refill accumulates: 600ms at 3 tokens/s grants exactly 1", () -> {
            AtomicLong clock = new AtomicLong(0);
            TokenBucket b = new TokenBucket(5, 3, clock::get);
            eq(5, acquire(b, 20));
            clock.addAndGet(600 * (SECOND / 1000));
            eq(1, acquire(b, 6));
        });
        check("long idle period does not exceed capacity", () -> {
            AtomicLong clock = new AtomicLong(0);
            TokenBucket b = new TokenBucket(4, 10, clock::get);
            eq(4, acquire(b, 30));
            clock.addAndGet(60 * SECOND);
            eq(4, acquire(b, 30));
        });
        check("rejected requests create no debt: 1000 tokens/s is still capped at 2", () -> {
            AtomicLong clock = new AtomicLong(0);
            TokenBucket b = new TokenBucket(2, 1000, clock::get);
            eq(2, acquire(b, 2));
            eq(0, acquire(b, 50));
            clock.addAndGet(SECOND / 2);              // dù lãi 500 token vẫn bị cắt trần ở capacity
            eq(2, acquire(b, 20));
            eq(0, acquire(b, 20));
        });
        check("the absolute origin of the clock does not matter", () -> {
            AtomicLong clock = new AtomicLong(5_000 * SECOND);
            TokenBucket b = new TokenBucket(6, 1, clock::get);
            eq(6, acquire(b, 40));
            eq(0, acquire(b, 3));
        });
        check("16 threads drain a 100000-token bucket on a frozen clock: grants exactly capacity", () -> {
            AtomicLong now = new AtomicLong(0);
            TokenBucket b = new TokenBucket(100_000, 1, now::get);   // đồng hồ đứng yên -> không refill -> tổng lần cấp PHẢI đúng bằng capacity
            AtomicInteger granted = new AtomicInteger();
            int threads = 16;
            CountDownLatch gate = new CountDownLatch(1);         // cổng xuất phát: 16 thread cùng lao vào tryAcquire
            List<Thread> ts = new ArrayList<>();
            for (int t = 0; t < threads; t++) {
                Thread th = new Thread(() -> {
                    try { gate.await(); } catch (InterruptedException e) { return; }
                    while (b.tryAcquire()) granted.incrementAndGet();
                });
                th.setDaemon(true);
                ts.add(th);
                th.start();
            }
            gate.countDown();
            for (Thread th : ts) joinOrFail(th, "bucket-thread");
            // thiếu synchronized -> mất cập nhật khi cộng/trừ tokens -> số lần cấp LỚN HƠN capacity
            eq(100_000, granted.get());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class TokenBucket {
    private final int capacity;
    private final double tokensPerNano;      // refillPerSecond quy đổi ra "token mỗi nano giây"
    private final LongSupplier clock;
    private double tokens;                   // giữ phần lẻ: 0,7 token thì chưa đủ cho 1 request
    private long lastRefillNanos;

    TokenBucket(int capacity, int refillPerSecond, LongSupplier clockNanos) {
        this.capacity = capacity;
        this.tokensPerNano = refillPerSecond / 1_000_000_000.0;
        this.clock = clockNanos;
        this.lastRefillNanos = clockNanos.getAsLong();
        this.tokens = capacity;              // bucket khởi tạo ở trạng thái đầy
    }

    synchronized boolean tryAcquire() {
        long now = clock.getAsLong();
        long elapsed = now - lastRefillNanos;
        if (elapsed > 0) {                   // refill lười: chỉ tính khi có người hỏi
            tokens = Math.min(capacity, tokens + elapsed * tokensPerNano);
            lastRefillNanos = now;
        }
        if (tokens < 1.0) return false;      // không mượn token, không cho âm
        tokens -= 1.0;
        return true;
    }
}`,
      hints: [
        'Ba field trạng thái: {{tokens}} (kiểu {{double}} để giữ phần lẻ), {{lastRefillNanos}}, và {{clock}}. Không cần danh sách token.',
        'Công thức nạp: {{tokens = Math.min(capacity, tokens + (now - lastRefillNanos) / 1_000_000_000.0 * refillPerSecond)}}; sau đó gán {{lastRefillNanos = now}}.',
        'Bọc toàn bộ {{tryAcquire()}} trong {{synchronized}}: đọc-then-sửa {{tokens}} là một thao tác ghép (read-modify-write), hai thread cùng thấy {{tokens = 1.0}} thì cả hai cùng trừ và cùng được cấp.',
        'Đồng hồ nano không có gốc cố định ({{System.nanoTime()}} trả về một số lớn bất kỳ), và test 6 quay clock tới mốc 5000 giây: hãy lấy mốc {{lastRefillNanos = clockNanos.getAsLong()}} ngay trong constructor và đặt {{tokens = capacity}}, đừng suy số token từ một mốc thời gian tuyệt đối.',
      ],
      explain: `Toàn bộ sự tinh vi nằm ở **refill lười**: không có thread nào rót token cả. Mỗi lần ai đó xin, ta tính "từ lần kiểm tra trước tới giờ trôi bao lâu, tương đương bao nhiêu token", cộng vào và cắt trần ở {{capacity}}. Kết quả giống hệt một bộ đếm chạy định kỳ nhưng không tích sai lệch khi JVM bị pause, và test điều khiển được 100 phần trăm thời gian bằng cách quay biến {{AtomicLong}}.

{{double}} cho phần lẻ là điểm hay bị bỏ: với {{refillPerSecond = 3}}, sau 0,5 giây chỉ có 1,5 token. Dùng {{int}} và làm tròn xuống ở mỗi bước thì 1,5 thành 1, lần sau lại tính từ 0, và bạn **mất** nửa token mỗi nửa giây — hạn mức thực tế tụt còn 2/giây. Nếu thích {{long}}, hãy lưu "nano còn dư" và chỉ cấp khi tích đủ {{1_000_000_000 / refillPerSecond}}.

{{synchronized}} là đủ, và là lựa chọn nên nói trong phỏng vấn: thao tác cần bảo vệ là chuỗi đọc-cộng-cắt trần-trừ, {{refillPerSecond}} vài trăm lần/giây thì lock không phải nút thắt. Muốn không lock thì CAS với một {{long}} đóng gói (số token và timestamp) — phức tạp hơn và dễ sai. Test cuối ép bạn chọn đúng: 16 thread cùng rút một bucket 100000 token tới khi cạn, đồng hồ đứng yên nên tổng số lần cấp **phải bằng đúng** {{capacity}}; code không nguyên tử cấp NHIỀU HƠN vì hai thread cùng thấy {{1.0}}, cùng trả {{true}} nhưng một lần trừ bị ghi đè.

Lỗi hay gặp:
- Quên cắt trần ở {{capacity}}: sau một đêm không traffic, sáng ra burst cực lớn, đúng lúc đối tác dễ sập nhất.
- Quên cập nhật {{lastRefillNanos}}: hoặc token tăng phi mã, hoặc không bao giờ tăng.
- Gọi {{System.nanoTime()}} ở một chỗ nào đó: test đồng hồ giả vẫn có thể qua, nhưng khi traffic thật đến, hành vi lệch và bạn không tài nào tái hiện bug.
- Trả {{true}} rồi mới trừ token: khi exception chen giữa, token bay mất; hoặc trừ khi chưa đủ dẫn tới token âm.
- Cho {{tryAcquire()}} "chờ 5 ms" bằng {{Thread.sleep}}: mất tính xác định của test và làm tốn thread, trong khi ý nghĩa của API này là **không bao giờ chặn**.`,
    },
    {
      title: 'Sliding window log: chặn đúng "max request trong cửa sổ trượt"',
      prompt: `Viết {{RateWindow}} — bộ giới hạn kiểu "trong {{windowNanos}} **vừa rồi** có tối đa {{maxRequests}} request được chấp nhận".

Chữ ký: {{RateWindow(int maxRequests, long windowNanos, LongSupplier clockNanos)}} và method {{boolean allow()}}.
- {{allow()}} không bao giờ chặn, không bao giờ ném exception; trả {{true}} nếu request được chấp nhận.
- Một request **chỉ được tính vào cửa sổ nếu nó được chấp nhận**. Request bị từ chối không để lại dấu vết (không được "đếm cả những cái bị chặn").
- Một request chấp nhận tại thời điểm {{t}} **không còn** được tính khi {{now - t >= windowNanos}} (đúng bằng {{windowNanos}} là đã hết hạn).
- Nếu {{maxRequests < 1}} hoặc {{windowNanos <= 0}} thì ném {{IllegalArgumentException}} từ constructor.
- Phải thread-safe; không {{Thread.sleep}}, không {{System.nanoTime()}} nội bộ, không thread nền.

Phát biểu lại để bạn chắc yêu cầu: tại mọi thời điểm, số request được chấp nhận có thời điểm nằm trong khoảng {{(now - windowNanos, now]}} phải luôn nhỏ hơn hoặc bằng {{maxRequests}}. Đây chính là điều mà fixed window counter (reset bộ đếm mỗi ô thời gian) **không** đảm bảo.`,
      starter: `class RateWindow {
    RateWindow(int maxRequests, long windowNanos, LongSupplier clockNanos) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean allow() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static final long SECOND = 1_000_000_000L;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static int allow(RateWindow w, int times) {
        int ok = 0;
        for (int i = 0; i < times; i++) if (w.allow()) ok++;
        return ok;
    }
    static void joinOrFail(Thread t, String what) {
        try { t.join(5000); } catch (InterruptedException e) { throw new AssertionError(e); }
        if (t.isAlive()) throw new AssertionError(what + " vẫn chạy sau 5s (allow() bị chặn?)");
    }
    public static void main(String[] args) {
        check("rejects everything above the limit inside one window", () -> {
            AtomicLong clock = new AtomicLong(0);
            RateWindow w = new RateWindow(3, SECOND, clock::get);
            eq(3, allow(w, 3));
            eq(0, allow(w, 10));
        });
        check("a hit expires exactly when the window elapses", () -> {
            AtomicLong clock = new AtomicLong(0);
            RateWindow w = new RateWindow(2, SECOND, clock::get);
            eq(2, allow(w, 5));
            clock.set(SECOND - 1);
            eq(0, allow(w, 4));                 // vẫn trong cửa sổ (t, t+1s]
            clock.set(SECOND);
            eq(2, allow(w, 5));                 // 2 hit lúc 0s vừa hết hạn
        });
        check("expired hits leave at their own time, not on a boundary", () -> {
            AtomicLong clock = new AtomicLong(0);
            RateWindow w = new RateWindow(2, SECOND, clock::get);
            eq(1, allow(w, 1));                 // t = 0
            clock.set(600 * (SECOND / 1000));   // t = 0,6s
            eq(1, allow(w, 4));                 // thêm 1 cái nữa -> đầy 2
            clock.set(SECOND + SECOND / 2);     // t = 1,5s: hit 0s hết hạn, hit 0,6s còn
            eq(1, allow(w, 4));                 // cửa sổ lại đầy: 0,6s và 1,5s
            clock.set(2 * SECOND);              // hit 0,6s hết hạn từ lúc 1,6s
            eq(1, allow(w, 4));                 // chỉ còn hit 1,5s
            clock.set(2 * SECOND + SECOND / 2); // hit 1,5s vừa hết hạn
            eq(1, allow(w, 4));
        });
        check("sliding window kills the fixed-window boundary burst", () -> {
            AtomicLong clock = new AtomicLong(0);
            RateWindow w = new RateWindow(3, SECOND, clock::get);
            clock.set(900 * (SECOND / 1000));           // 0,9s: cuối "ô" theo kiểu đếm cố định
            eq(3, allow(w, 10));
            clock.set(SECOND + 50 * (SECOND / 1000));   // 1,05s: sang "ô" mới, fixed counter sẽ cho thêm 3
            eq(0, allow(w, 10));
            clock.set(SECOND + 899 * (SECOND / 1000));  // 1,899s: 3 hit lúc 0,9s mới trôi qua 999ms
            eq(0, allow(w, 10));
            clock.set(SECOND + 900 * (SECOND / 1000));  // 1,900s: đủ 1 giây, 3 hit trọn vẹn khỏi cửa sổ
            eq(3, allow(w, 10));
        });
        check("invalid configuration is rejected", () -> {
            AtomicLong clock = new AtomicLong(0);
            try { new RateWindow(0, SECOND, clock::get); throw new AssertionError("maxRequests = 0 phải lỗi"); }
            catch (IllegalArgumentException expected) { }
            try { new RateWindow(5, 0, clock::get); throw new AssertionError("windowNanos = 0 phải lỗi"); }
            catch (IllegalArgumentException expected) { }
        });
        check("16 threads push 200000 requests through a frozen window: allows exactly maxRequests", () -> {
            AtomicLong now = new AtomicLong(0);
            RateWindow w = new RateWindow(200_000, SECOND, now::get);   // đồng hồ đứng yên -> không hit nào hết hạn -> cho qua đúng max
            AtomicInteger ok = new AtomicInteger();
            int threads = 16;
            CountDownLatch gate = new CountDownLatch(1);             // 16 thread cùng gọi allow() một lúc
            List<Thread> ts = new ArrayList<>();
            for (int t = 0; t < threads; t++) {
                Thread th = new Thread(() -> {
                    try { gate.await(); } catch (InterruptedException e) { return; }
                    while (w.allow()) ok.incrementAndGet();
                });
                th.setDaemon(true);
                ts.add(th);
                th.start();
            }
            gate.countDown();
            for (Thread th : ts) joinOrFail(th, "window-thread");
            // thiếu synchronized -> size() đọc thấy giá trị cũ nên vẫn cho qua -> số lần LỚN HƠN max (hoặc ArrayDeque hỏng)
            eq(200_000, ok.get());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class RateWindow {
    private final int max;
    private final long window;
    private final LongSupplier clock;
    private final ArrayDeque<Long> hits = new ArrayDeque<>();   // chỉ lưu request ĐƯỢC chấp nhận

    RateWindow(int maxRequests, long windowNanos, LongSupplier clockNanos) {
        if (maxRequests < 1) throw new IllegalArgumentException("maxRequests must be >= 1");
        if (windowNanos <= 0) throw new IllegalArgumentException("windowNanos must be > 0");
        this.max = maxRequests;
        this.window = windowNanos;
        this.clock = clockNanos;
    }

    synchronized boolean allow() {
        long now = clock.getAsLong();
        while (!hits.isEmpty() && now - hits.peekFirst() >= window) {
            hits.pollFirst();                    // hết hạn: bỏ ở đầu danh sách
        }
        if (hits.size() >= max) return false;     // cửa sổ đang đầy
        hits.addLast(now);
        return true;
    }
}`,
      hints: [
        'Giữ một {{ArrayDeque<Long>}} các timestamp theo thứ tự tăng dần. Vì {{now}} không giảm, cái hết hạn luôn nằm ở **đầu** danh sách: {{while (!q.isEmpty() && now - q.peekFirst() >= window) q.pollFirst();}}.',
        'Chỉ {{addLast(now}} khi quyết định trả {{true}}. Đếm cả request bị từ chối là lỗi phổ biến nhất của bài này.',
        'Cửa sổ là nửa mở {{(now - window, now]}}: điều kiện loại là {{now - t >= window}}, dùng {{>}} sẽ cho phép thừa một request ở đúng biên.',
        'Cả khối "loại hết hạn + kiểm tra {{size()}} + thêm mới" phải nằm trong cùng một vùng {{synchronized}}, nếu không hai thread cùng thấy {{size() = 4}} và cùng thêm.',
      ],
      explain: `Danh sách timestamp luôn được thêm vào với {{now}} **không nhỏ dần** (đồng hồ đơn điệu), nên nó tự sắp thứ tự và phần tử hết hạn luôn ở đầu. Một vòng {{while}} ở đầu mỗi lần gọi là đủ — mỗi request được thêm một lần và bị loại một lần, chi phí amortized O(1) dù nhìn qua tưởng phải quét cả danh sách.

Đây là **sliding window log**: chính xác tuyệt đối, đổi lại bộ nhớ bằng số request được chấp nhận trong một cửa sổ. Với limit 3 req/s thì vô nghĩa, nhưng với 10.000 req/s trong cửa sổ 60 giây là 600.000 con số {{Long}} (~20 MB với chi phí đóng gói) — lúc đó người ta chuyển sang **sliding window counter** (chia cửa sổ thành các ô nhỏ, mỗi ô chỉ giữ một số đếm, sai số vài phần trăm) hoặc dùng token bucket vì nó O(1) bộ nhớ.

Vì sao không dùng fixed window counter? Code chỉ ~5 dòng: một bộ đếm và một mốc "ô hiện tại", reset khi sang ô mới. Nhưng nó cho phép {{2 * max}} request trong hai thời điểm ngay trước và ngay sau biên, như test thứ tư minh hoạ. Trớ trêu là chính khách hàng gọi API của bạn sẽ thấy giới hạn "không nhất quán" theo kiểu đó, còn bạn thì không có dấu vết trong log để giải thích.

Lỗi hay gặp:
- Đếm cả request bị từ chối: một đợt traffic cao làm cửa sổ "đầy ảo", bạn chặn dài hạn sau đó.
- Sai điều kiện hết hạn (dùng {{now - t > window}} thay vì {{now - t >= window}}): tại đúng thời điểm {{t + window}} vẫn tính request cũ.
- Quên {{synchronized}}: test đa luồng với đồng hồ đứng yên sẽ cho số lần chấp nhận lớn hơn {{max}}.
- Lưu timestamp kiểu {{int}} hoặc để {{now - hits.peekFirst()}} trừ trên object: {{Long}} tự unbox, nhưng nếu danh sách rỗng mà gọi {{peekFirst()}} thì {{NullPointerException}} — luôn kiểm tra {{isEmpty()}} trước.
- Dùng cấu trúc này cho **nhiều** key (mỗi API key một cửa sổ): cần map các cửa sổ và chiến lược gỡ key không dùng tới, nếu không thành rò bộ nhớ; đây chính là lúc cân nhắc Redis.`,
    },
  ],
  check: [
    {
      q: 'Service của bạn dùng {{Semaphore(20)}} để gọi một DB. Mỗi request chờ DB trung bình 2 giây, trước đây chỉ 20 ms. Throughput thay đổi thế nào?',
      options: ['Không đổi vì số permit không đổi', 'Giảm từ ~1.000 req/s xuống ~10 req/s', 'Tăng vì thread chờ nhiều hơn', 'Không đổi, chỉ p99 tăng'],
      answer: 1,
      explain: `Định luật Little: throughput = số việc đồng thời / thời gian mỗi việc. Trước: 20 / 0,02 s = 1.000 req/s. Sau: 20 / 2 s = 10 req/s. Semaphore giữ nguyên **độ đồng thời**, còn **tốc độ** suy ra từ độ trễ của phía sau. Đây là lý do Semaphore không phải rate limiter, và cũng là lý do khi DB chậm lại, giới hạn 20 connection bảo vệ DB nhưng làm throughput của bạn rơi theo.`,
    },
    {
      q: 'Token bucket {{capacity = 200}}, {{refillPerSecond = 100}}. Bucket vừa qua một đêm không traffic. Trong 1 giây đầu tiên của đợt traffic mới, nhiều nhất bao nhiêu request được chấp nhận?',
      options: ['100, vì đó là hạn mức', '200, vì bucket đang đầy và capacity cho phép burst', '300, vì 200 có sẵn cộng thêm 100 trong giây đó', '1, vì mỗi giây chỉ rót 100 và 1 request cần 1 token'],
      answer: 1,
      explain: `Sau đêm yên tĩnh bucket bị cắt trần ở {{capacity}} = 200 token. Trong giây đầu, 200 request đầu lấy hết token, chỉ 1 request tới sau 200 cái đó mới chờ được rót thêm — về lý thuyết có thêm ~100 token được rót **trong** giây, nhưng vì 200 request đầu tiên đến tức thì nên số còn lại của giây hầu như không có request để cấp; con số có ý nghĩa là {{capacity}}, không phải {{refill}}. Điểm cần nói trong phỏng vấn: {{capacity}} chính là cỡ burst tối đa, và nếu đối tác chỉ chịu được 100 req/s **đỉnh** thì {{capacity}} phải để gần 100 chứ không phải 200.`,
    },
    {
      q: 'Bạn chạy 4 instance phía sau load balancer, đối tác giới hạn 100 req/s cho toàn bộ. Cách nào **không** đảm bảo giới hạn?',
      options: ['Mỗi instance đặt limit 25 req/s', 'Một limiter tập trung (Redis hoặc gateway) đếm chung cho cả 4 instance', 'Mỗi instance tự đặt limit 100 req/s', 'Gửi mọi request qua một hàng đợi chung rồi giải ngân theo tốc độ'],
      answer: 2,
      explain: `Limiter trong JVM chỉ đếm request của chính nó; 4 instance mỗi cái 100 req/s nghĩa là đối tác nhận tới 400 req/s. Chia tĩnh (25/instance) đơn giản nhưng vẫn sai khi autoscale hoặc khi load balancer chia không đều; limiter tập trung hoặc hàng đợi chung là cách đúng, với điều kiện xử lý tình huống nó không reachable (fallback: chặn hay cho qua).`,
    },
    {
      q: '{{tryAcquire()}} của một limiter trả {{false}}. Cách xử lý nào hợp lý nhất trong một web request?',
      options: ['Gọi lại {{tryAcquire()}} trong vòng lặp until nó trả true', '{{Thread.sleep(1000)}} rồi thử lại', 'Fail-fast: trả lời client ngay (429 hoặc hàng đợi có giới hạn), có tính {{Retry-After}} và backoff cho phía client', 'Ném {{OutOfMemoryError}} để container khởi động lại'],
      answer: 2,
      explain: `Vòng lặp/spin làm bạn tự gây DoS và giữ thread; sleep không xác định được bao lâu và cộng dồn thành p99 khủng khiếp. Cách đúng: từ chối sớm, trả tín hiệu rõ cho client (429 + Retry-After), client retry với exponential backoff và jitter. Trong batch thì dùng hàng đợi có giới hạn + worker lấy permit một cách kiểm soát.`,
    },
  ],
  related: ['concurrency-011', 'concurrency-012', 'concurrency-032', 'concurrency-033'],
  tags: ['rate limiter', 'token bucket', 'sliding window', 'Semaphore', 'bulkhead', 'backpressure'],
},
);
