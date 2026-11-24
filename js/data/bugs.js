/* Bug hunt: realistic production bugs to reproduce, fix and explain (view #/bugs). Schema: AGENTS.md section 17.
 * Each bug: starter = buggy project code (compiles, tests FAIL), reference = fixed code (tests PASS),
 * tests = harness with public class Main printing PASS/FAIL/RESULT. Check: node scripts/test-bugs.js */
(window.BUGS = window.BUGS || []).push(
{
  id: 'bug-001',
  title: 'Ví điện tử: khách rút được tiền hai lần',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Ví điện tử 2 triệu người dùng. Service {{wallet-service}} (Spring Boot, 6 pod) xử lý rút tiền về tài khoản ngân hàng. Số dư được đọc và ghi qua {{BalanceStore}}.

**Sự cố:** Sáng thứ Hai, bộ phận đối soát báo **37 ví có số dư âm** sau cuối tuần, tổng thất thoát khoảng 46 triệu đồng. Tất cả đều là ví rút **toàn bộ số dư** bằng app, và log cho thấy **hai yêu cầu rút cách nhau vài mili giây** (người dùng bấm hai lần khi mạng chậm, hoặc tool tự động bấm liên tục).

**Nhiệm vụ của bạn:**
1. Đọc code {{WalletService.withdraw}} và log bên dưới, tìm vì sao hai lệnh rút cùng thành công.
2. Sửa code để **không bao giờ** rút quá số dư, kể cả khi nhiều request đến cùng lúc.
3. Bấm **Chạy test**: test sẽ cho hai luồng rút cùng lúc đúng như sự cố.`,
  artifacts: [
    { name: 'wallet-service.log', lang: 'text', content: `2026-11-02 21:14:07.311 INFO  [http-nio-8080-exec-17] WithdrawController : withdraw request acc=W-88213 amount=1500000 reqId=7f1c
2026-11-02 21:14:07.318 INFO  [http-nio-8080-exec-23] WithdrawController : withdraw request acc=W-88213 amount=1500000 reqId=7f1d
2026-11-02 21:14:07.342 DEBUG [http-nio-8080-exec-17] WalletService      : acc=W-88213 balance=1500000 -> ok
2026-11-02 21:14:07.344 DEBUG [http-nio-8080-exec-23] WalletService      : acc=W-88213 balance=1500000 -> ok
2026-11-02 21:14:07.351 INFO  [http-nio-8080-exec-17] WalletService      : withdraw OK acc=W-88213 newBalance=0
2026-11-02 21:14:07.353 INFO  [http-nio-8080-exec-23] WalletService      : withdraw OK acc=W-88213 newBalance=0
2026-11-02 21:14:08.902 INFO  [payout-worker-2]       BankPayout         : payout sent acc=W-88213 amount=1500000 ref=PO-551203
2026-11-02 21:14:08.917 INFO  [payout-worker-4]       BankPayout         : payout sent acc=W-88213 amount=1500000 ref=PO-551204` },
    { name: 'reconciliation-report.txt', lang: 'text', content: `RECONCILIATION 2026-11-03 06:00 ICT
Wallets checked           : 2,031,447
Negative ledger position  : 37
Total over-withdrawn (VND): 46,250,000
Pattern                   : 2 payouts within < 50 ms, same account, same amount (100% of cases)
Note: stored balance shows 0 (not negative) because the second write overwrote the first.` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
interface BalanceStore {
    long get(String accountId);                // đọc số dư hiện tại
    void set(String accountId, long balance);  // ghi số dư mới
}

// ===== Code cần sửa =====
class WalletService {
    private final BalanceStore store;

    WalletService(BalanceStore store) { this.store = store; }

    /** Rút tiền. Trả true nếu thành công, false nếu không đủ số dư. */
    boolean withdraw(String accountId, long amount) {
        long balance = store.get(accountId);
        if (balance < amount) return false;
        store.set(accountId, balance - amount);
        return true;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    /** Store giả lập DB: khi bật gate, lần đọc đầu tiên chờ (tối đa 300ms) cho tới khi có lần đọc thứ hai,
     *  tái hiện đúng tình huống hai request đọc cùng số dư trước khi ai kịp ghi. */
    static class RacyStore implements BalanceStore {
        final Map<String, Long> data = new ConcurrentHashMap<>();
        volatile CountDownLatch gate;
        public long get(String id) {
            long v = data.getOrDefault(id, 0L);
            CountDownLatch g = gate;
            if (g != null) {
                g.countDown();
                try { g.await(300, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
            return v;
        }
        public void set(String id, long b) {
            Thread.yield();
            data.put(id, b);
        }
    }

    public static void main(String[] args) throws Exception {
        // 1. Rút bình thường
        RacyStore s1 = new RacyStore();
        s1.data.put("A", 100L);
        WalletService w1 = new WalletService(s1);
        boolean ok1 = w1.withdraw("A", 30);
        check("rut_binh_thuong", ok1 && s1.data.get("A") == 70L, "kỳ vọng thành công và còn 70, thực tế ok=" + ok1 + " balance=" + s1.data.get("A"));

        // 2. Không đủ số dư
        boolean ok2 = w1.withdraw("A", 1000);
        check("khong_du_so_du", !ok2 && s1.data.get("A") == 70L, "kỳ vọng từ chối và giữ 70, thực tế ok=" + ok2 + " balance=" + s1.data.get("A"));

        // 3. Hai request rút toàn bộ số dư cùng lúc (đúng như sự cố)
        RacyStore s3 = new RacyStore();
        s3.data.put("B", 1_500_000L);
        s3.gate = new CountDownLatch(2);
        WalletService w3 = new WalletService(s3);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Boolean> f1 = pool.submit(() -> w3.withdraw("B", 1_500_000));
        Future<Boolean> f2 = pool.submit(() -> w3.withdraw("B", 1_500_000));
        int success = (f1.get(5, TimeUnit.SECONDS) ? 1 : 0) + (f2.get(5, TimeUnit.SECONDS) ? 1 : 0);
        s3.gate = null;
        check("hai_request_dong_thoi", success == 1, "chỉ được 1 lệnh rút thành công, thực tế " + success + " lệnh thành công -> chi tiền 2 lần");

        // 4. Nhiều luồng rút lặt vặt: tổng tiền rút không được vượt số dư
        RacyStore s4 = new RacyStore();
        s4.data.put("C", 500L);
        WalletService w4 = new WalletService(s4);
        AtomicInteger ok4 = new AtomicInteger();
        ExecutorService pool4 = Executors.newFixedThreadPool(8);
        List<Future<?>> fs = new ArrayList<>();
        for (int t = 0; t < 8; t++) fs.add(pool4.submit(() -> { for (int i = 0; i < 200; i++) if (w4.withdraw("C", 1)) ok4.incrementAndGet(); }));
        for (Future<?> f : fs) f.get(30, TimeUnit.SECONDS);
        check("nhieu_luong", ok4.get() == 500 && s4.data.get("C") == 0L, "kỳ vọng đúng 500 lần thành công và số dư 0, thực tế " + ok4.get() + " lần, số dư " + s4.data.get("C"));

        pool.shutdownNow(); pool4.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `interface BalanceStore {
    long get(String accountId);
    void set(String accountId, long balance);
}

class WalletService {
    private final BalanceStore store;
    // Một khoá cho mỗi tài khoản: hai lệnh rút của CÙNG tài khoản chạy tuần tự,
    // tài khoản khác nhau vẫn chạy song song.
    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    WalletService(BalanceStore store) { this.store = store; }

    boolean withdraw(String accountId, long amount) {
        Object lock = locks.computeIfAbsent(accountId, k -> new Object());
        synchronized (lock) {                       // đọc - kiểm tra - ghi thành MỘT bước nguyên tử
            long balance = store.get(accountId);
            if (balance < amount) return false;
            store.set(accountId, balance - amount);
            return true;
        }
    }
}`,
  hints: [
    'Đọc log: hai thread cùng in "balance=1500000 -> ok" trước khi bất kỳ thread nào ghi số dư mới. Vì sao cả hai đều thấy 1.500.000?',
    'Đây là lỗi "check-then-act": đọc số dư, kiểm tra, rồi mới ghi — ba bước này không nguyên tử. Hai request chen vào giữa nhau.',
    'Cần biến ba bước thành một bước không thể bị chen ngang cho CÙNG một tài khoản: ví dụ synchronized trên một khoá riêng của từng accountId (ConcurrentHashMap.computeIfAbsent).',
  ],
  rootCause: `**Race condition kiểu check-then-act (đọc → kiểm tra → ghi).** Hai request rút cùng một tài khoản chạy song song trên hai thread (hoặc hai pod). Cả hai **đọc** số dư 1.500.000 trước khi bên nào kịp **ghi**; cả hai đều thấy "đủ tiền", cả hai ghi 0 và cả hai gửi lệnh chi tiền sang ngân hàng. Lần ghi thứ hai **đè** lần ghi thứ nhất (lost update), nên số dư lưu trong DB vẫn là 0 chứ không âm — đó là lý do lỗi không bị phát hiện ngay mà phải đợi đối soát với ngân hàng.

Dẫn chứng trong log: {{exec-17}} và {{exec-23}} cùng in {{balance=1500000 -> ok}} lúc 21:14:07.342 và .344, trước khi có dòng {{withdraw OK}} nào; hai lệnh {{payout sent}} cùng số tiền cách nhau 15ms.`,
  fix: `### Cách sửa trong bài
Biến "đọc - kiểm tra - ghi" thành **một bước nguyên tử cho mỗi tài khoản**: khoá riêng theo {{accountId}} (giữ được song song giữa các tài khoản khác nhau). {{synchronized}} trên cả method cũng đúng nhưng làm mọi lệnh rút của mọi người xếp hàng.

### Trên production thật (nhiều pod) — khoá trong JVM là CHƯA ĐỦ
6 pod là 6 JVM: khoá {{synchronized}} chỉ chặn được hai request vào **cùng một pod**. Cách đúng là để **database** đảm bảo:
~~~sql
-- 1) UPDATE có điều kiện: nguyên tử ngay trong DB, cách tốt nhất
UPDATE wallet SET balance = balance - :amount
WHERE account_id = :id AND balance >= :amount;   -- 0 dòng bị ảnh hưởng = không đủ tiền
~~~
- **Pessimistic lock**: {{SELECT ... FOR UPDATE}} trong transaction rồi mới kiểm tra và ghi.
- **Optimistic lock**: cột {{version}} ({{@Version}}), UPDATE kèm {{WHERE version = :v}}, xung đột thì báo lỗi hoặc thử lại.
- Thêm **idempotency key** cho API rút tiền (client gửi cùng key khi bấm lại) để lần bấm thứ hai trả về kết quả của lần đầu.

### So sánh
| Cách | Đúng trên nhiều pod | Ghi chú |
|---|---|---|
| synchronized / khoá theo tài khoản | Không | Chỉ đúng trong một JVM; tốt cho bài tập, cache cục bộ |
| UPDATE có điều kiện | Có | Đơn giản, nhanh, nên là lựa chọn đầu tiên |
| SELECT FOR UPDATE | Có | Khi logic kiểm tra phức tạp hơn một điều kiện |
| @Version optimistic | Có | Khi xung đột hiếm; cần retry |

### Phòng ngừa
- Đối soát số dư với sổ cái (ledger kế toán kép) hằng giờ thay vì hằng ngày; cảnh báo ngay khi lệch.
- Test tải bắn nhiều request đồng thời cùng một tài khoản trong CI.
- Code review: mọi chỗ "đọc rồi ghi lại" trên số dư, tồn kho, hạn mức đều phải hỏi "hai request cùng lúc thì sao?".

### Liên hệ phỏng vấn
Đây là câu kinh điển "làm sao chống rút tiền hai lần". Trả lời tốt phải nêu: race check-then-act, vì sao {{synchronized}} không đủ khi có nhiều instance, UPDATE có điều kiện hoặc khoá DB, và idempotency key cho lần bấm lặp.`,
  related: ['scenario-119'],
  tags: ['race condition', 'concurrency', 'lost update', 'fintech', 'idempotency']
},
{
  id: 'bug-002',
  title: 'Cổng thanh toán gửi lại webhook: đơn được cộng tiền hai lần',
  domain: 'Thương mại điện tử / Thanh toán',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Sàn thương mại điện tử nhận thông báo thanh toán từ cổng thanh toán qua **webhook**. Mỗi sự kiện có {{eventId}} duy nhất. Quy định của cổng: nếu không nhận được phản hồi {{OK}} trong 5 giây, cổng **gửi lại** sự kiện đó (tối đa 5 lần).

**Sự cố:** Tối Black Friday, DB chậm khiến nhiều lần xử lý webhook mất hơn 5 giây. Sáng hôm sau, kế toán phát hiện **1.214 đơn được ghi nhận đã thanh toán 2–3 lần**, ví của người bán bị cộng thừa khoảng 380 triệu đồng và một phần đã được rút ra.

**Nhiệm vụ của bạn:** Sửa {{WebhookHandler.handle}} để một sự kiện chỉ được ghi sổ **đúng một lần**, kể cả khi cổng gửi lại, gửi đồng thời, hoặc lần xử lý đầu bị lỗi giữa chừng.`,
  artifacts: [
    { name: 'webhook-access.log', lang: 'text', content: `2026-11-28 20:41:03.120 POST /webhooks/payment eventId=evt_9Kq2 order=ORD-771045 amount=2490000 -> 200 OK in 6412 ms
2026-11-28 20:41:08.135 POST /webhooks/payment eventId=evt_9Kq2 order=ORD-771045 amount=2490000 -> 200 OK in 5120 ms   (gateway retry #1)
2026-11-28 20:41:13.140 POST /webhooks/payment eventId=evt_9Kq2 order=ORD-771045 amount=2490000 -> 200 OK in 388 ms    (gateway retry #2)
2026-11-28 20:41:03.990 POST /webhooks/payment eventId=evt_7Ld0 order=ORD-771052 amount=150000  -> 500 in 2210 ms (ledger: deadlock detected)
2026-11-28 20:41:09.002 POST /webhooks/payment eventId=evt_7Ld0 order=ORD-771052 amount=150000  -> 200 OK in 95 ms (gateway retry #1)` },
    { name: 'ledger-query.sql', lang: 'sql', content: `SELECT order_id, count(*) AS credits, sum(amount) AS total
FROM ledger_entries
WHERE type = 'PAYMENT_CAPTURED' AND created_at >= '2026-11-28'
GROUP BY order_id HAVING count(*) > 1
ORDER BY credits DESC LIMIT 5;
-- order_id    | credits | total
-- ORD-771045  |       3 | 7470000
-- ORD-770981  |       3 | 1170000
-- ORD-771310  |       2 | 4980000
-- (1214 rows)` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
record PaymentEvent(String eventId, String orderId, long amount) {}

interface Ledger {
    /** Ghi nhận tiền vào đơn. Có thể ném RuntimeException nếu DB lỗi (khi đó KHÔNG có gì được ghi). */
    void credit(String orderId, long amount);
}

// ===== Code cần sửa =====
class WebhookHandler {
    private final Ledger ledger;

    WebhookHandler(Ledger ledger) { this.ledger = ledger; }

    /** Trả "OK" cho cổng thanh toán. Nếu ném exception, controller trả HTTP 500 và cổng sẽ gửi lại sau. */
    String handle(PaymentEvent e) {
        ledger.credit(e.orderId(), e.amount());
        return "OK";
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static class FakeLedger implements Ledger {
        final Map<String, Long> credited = new ConcurrentHashMap<>();
        final AtomicInteger failNext = new AtomicInteger();
        public void credit(String orderId, long amount) {
            if (failNext.getAndUpdate(n -> Math.max(0, n - 1)) > 0) throw new RuntimeException("deadlock detected");
            try { Thread.sleep(5); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            credited.merge(orderId, amount, Long::sum);
        }
        long of(String o) { return credited.getOrDefault(o, 0L); }
    }

    public static void main(String[] args) throws Exception {
        // 1. Cổng gửi lại cùng một sự kiện 3 lần (tuần tự)
        FakeLedger l1 = new FakeLedger();
        WebhookHandler h1 = new WebhookHandler(l1);
        PaymentEvent e = new PaymentEvent("evt_9Kq2", "ORD-1", 2_490_000);
        for (int i = 0; i < 3; i++) h1.handle(e);
        check("gui_lai_tuan_tu", l1.of("ORD-1") == 2_490_000, "kỳ vọng ghi 2.490.000 một lần, thực tế " + l1.of("ORD-1"));

        // 2. Hai sự kiện KHÁC nhau của cùng một đơn (ví dụ trả góp 2 lần) vẫn phải ghi đủ
        h1.handle(new PaymentEvent("evt_A", "ORD-2", 100));
        h1.handle(new PaymentEvent("evt_B", "ORD-2", 200));
        check("su_kien_khac_nhau", l1.of("ORD-2") == 300, "kỳ vọng 300, thực tế " + l1.of("ORD-2"));

        // 3. Cổng gửi trùng ĐỒNG THỜI (retry đến khi lần đầu chưa xử lý xong)
        FakeLedger l3 = new FakeLedger();
        WebhookHandler h3 = new WebhookHandler(l3);
        PaymentEvent e3 = new PaymentEvent("evt_C", "ORD-3", 500);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> fs = new ArrayList<>();
        for (int i = 0; i < 8; i++) fs.add(pool.submit(() -> { start.await(); return h3.handle(e3); }));
        start.countDown();
        for (Future<?> f : fs) f.get(10, TimeUnit.SECONDS);
        check("gui_trung_dong_thoi", l3.of("ORD-3") == 500, "kỳ vọng ghi 500 một lần, thực tế " + l3.of("ORD-3"));

        // 4. Lần đầu ghi sổ lỗi (DB deadlock) -> lần gửi lại PHẢI được ghi, không bị coi là "đã xử lý"
        FakeLedger l4 = new FakeLedger();
        l4.failNext.set(1);
        WebhookHandler h4 = new WebhookHandler(l4);
        PaymentEvent e4 = new PaymentEvent("evt_D", "ORD-4", 150_000);
        boolean threw = false;
        try { h4.handle(e4); } catch (RuntimeException ex) { threw = true; }
        h4.handle(e4);
        check("loi_lan_dau_van_ghi_lan_sau", threw && l4.of("ORD-4") == 150_000, "kỳ vọng lần đầu báo lỗi và lần gửi lại ghi 150.000, thực tế threw=" + threw + " credited=" + l4.of("ORD-4"));

        pool.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `record PaymentEvent(String eventId, String orderId, long amount) {}

interface Ledger {
    void credit(String orderId, long amount);
}

class WebhookHandler {
    private final Ledger ledger;
    private final Set<String> processed = ConcurrentHashMap.newKeySet();          // eventId đã ghi sổ xong
    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    WebhookHandler(Ledger ledger) { this.ledger = ledger; }

    String handle(PaymentEvent e) {
        Object lock = locks.computeIfAbsent(e.eventId(), k -> new Object());
        synchronized (lock) {                             // các bản gửi trùng đồng thời xếp hàng
            if (processed.contains(e.eventId())) return "OK";   // đã xử lý: chỉ trả OK, không ghi lại
            ledger.credit(e.orderId(), e.amount());       // ném lỗi -> chưa đánh dấu -> cổng gửi lại sẽ thử lại
            processed.add(e.eventId());                   // chỉ đánh dấu SAU KHI ghi sổ thành công
            return "OK";
        }
    }
}`,
  hints: [
    'Cổng thanh toán đảm bảo "at-least-once": một sự kiện có thể đến nhiều lần. Handler phải idempotent — xử lý 1 lần hay 5 lần cho cùng kết quả.',
    'Cần nhớ eventId nào đã ghi sổ xong. Nhưng chú ý test 4: nếu đánh dấu "đã xử lý" TRƯỚC khi ghi sổ, lần ghi lỗi sẽ khiến sự kiện bị bỏ qua mãi mãi.',
    'Các bản gửi trùng có thể đến cùng lúc: phần "kiểm tra đã xử lý chưa → ghi sổ → đánh dấu" phải không bị chen ngang cho cùng một eventId.',
  ],
  rootCause: `**Webhook handler không idempotent trong khi cổng thanh toán gửi theo kiểu at-least-once.** Khi DB chậm, lần xử lý đầu mất hơn 5 giây; cổng coi là thất bại và gửi lại. Mỗi lần nhận, handler đều gọi {{ledger.credit}} → cùng một khoản thanh toán được ghi 2–3 lần. Log cho thấy {{evt_9Kq2}} đến 3 lần (6412ms, 5120ms rồi 388ms) và truy vấn ledger có {{ORD-771045}} với 3 bút toán.

Một yếu tố thứ hai làm vấn đề khó: ghi sổ có thể **lỗi giữa chừng** ({{evt_7Ld0}} lỗi deadlock lần đầu). Nếu chỉ "đánh dấu đã nhận" trước khi ghi, lần lỗi đó sẽ biến thành **mất tiền** thay vì cộng thừa.`,
  fix: `### Cách sửa trong bài
- Lưu {{eventId}} đã xử lý **sau khi** ghi sổ thành công; lần nhận sau thấy đã có thì chỉ trả {{OK}}.
- Khoá theo {{eventId}} để các bản gửi trùng đồng thời không cùng lọt qua bước kiểm tra.

### Trên production thật
Set trong bộ nhớ mất khi restart và không chia sẻ giữa các pod. Cách chuẩn là để **DB đảm bảo duy nhất**, trong **cùng transaction** với bút toán:
~~~sql
CREATE TABLE processed_events (event_id text PRIMARY KEY, processed_at timestamptz NOT NULL);
-- trong một transaction:
INSERT INTO processed_events(event_id, processed_at) VALUES (:eventId, now());  -- trùng -> lỗi unique -> bỏ qua
INSERT INTO ledger_entries(...) VALUES (...);
COMMIT;   -- ghi sổ lỗi -> rollback cả dòng processed_events -> lần gửi lại sẽ xử lý tiếp
~~~
Hoặc đặt **unique constraint** trên {{(order_id, payment_ref)}} của bảng bút toán. Thêm vào đó: trả {{OK}} **nhanh** (ghi sự kiện vào hàng đợi/outbox rồi xử lý nền) để cổng không phải gửi lại vì timeout.

### So sánh
| Cách | Đúng khi restart / nhiều pod | Ghi chú |
|---|---|---|
| Set trong bộ nhớ | Không | Chỉ để hiểu cơ chế |
| Bảng processed_events + unique, cùng transaction | Có | Chuẩn, đơn giản |
| Unique constraint trên bút toán | Có | Chặn ở tầng dữ liệu, an toàn nhất |
| Redis SETNX | Một phần | Không cùng transaction với DB, có khe hở khi lỗi |

### Phòng ngừa
- Mọi consumer của webhook, Kafka, SQS đều giả định **trùng lặp là chuyện bình thường**.
- Test: gửi cùng một sự kiện 3 lần, đồng thời, và có lỗi giữa chừng.
- Đối soát hằng ngày giữa sao kê cổng thanh toán và ledger.

### Liên hệ phỏng vấn
Câu hỏi "làm sao xử lý webhook/message bị gửi trùng" xuất hiện ở hầu hết vòng phỏng vấn fintech: nêu at-least-once, idempotency key, unique constraint trong cùng transaction, và vì sao không đánh dấu trước khi xử lý thành công.`,
  related: [],
  tags: ['idempotency', 'webhook', 'at-least-once', 'payment']
},
{
  id: 'bug-003',
  title: 'Chia tiền nhóm: tổng các phần không bằng tổng hoá đơn',
  domain: 'Ví điện tử / Thanh toán nhóm',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Tính năng "chia tiền hoá đơn" của ví: một người trả hoá đơn, app chia đều cho các thành viên và tạo yêu cầu thanh toán cho từng người. Tiền là **VND (không có phần lẻ)**, lưu dạng {{long}}.

**Sự cố:** Đối soát cuối tháng lệch **hơn 2,1 triệu đồng** trên 180.000 lần chia tiền: có hoá đơn tổng các phần **thiếu** vài đồng, có hoá đơn lại **thừa**. Khách hàng phàn nàn "chia 10 nghìn cho 4 người mà mỗi người bị đòi 3 nghìn".

**Nhiệm vụ của bạn:** Sửa {{SplitService.split}} để **tổng các phần luôn đúng bằng tổng hoá đơn**, và các phần chênh nhau **không quá 1 đồng**.`,
  artifacts: [
    { name: 'split-audit.csv', lang: 'text', content: `split_id,total,members,shares,sum_shares,diff
SP-100231,100000,3,"33333|33333|33333",99999,-1
SP-100244,10000,4,"3000|3000|3000|3000",12000,+2000
SP-100259,250000,6,"41667|41667|41667|41667|41667|41667",250002,+2
SP-100260,7,3,"2|2|2",6,-1
-- month total diff: -1,184,312 VND (under-collected) / +944,207 VND (over-collected)` },
  ],
  starter: `// ===== Code cần sửa =====
class SplitService {
    /** Chia đều total (VND, không có phần lẻ) cho n thành viên. Trả về danh sách n phần. */
    List<Long> split(long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        List<Long> shares = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            shares.add(Math.round((double) total / n));   // mỗi người một phần "làm tròn"
        }
        return shares;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long sum(List<Long> xs) { long s = 0; for (long x : xs) s += x; return s; }
    static long spread(List<Long> xs) { return Collections.max(xs) - Collections.min(xs); }

    public static void main(String[] args) {
        SplitService s = new SplitService();
        long[][] cases = { {100_000, 3}, {10_000, 4}, {250_000, 6}, {7, 3}, {1_000_000_007L, 10} };
        for (long[] c : cases) {
            List<Long> r = s.split(c[0], (int) c[1]);
            boolean ok = r.size() == c[1] && sum(r) == c[0] && spread(r) <= 1;
            check("chia_" + c[0] + "_cho_" + c[1], ok, "các phần " + r + " có tổng " + sum(r) + " (kỳ vọng " + c[0] + ", chênh tối đa 1 đồng)");
        }
        List<Long> one = s.split(55_555, 1);
        check("mot_nguoi", one.size() == 1 && one.get(0) == 55_555, "một người phải trả đủ, thực tế " + one);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class SplitService {
    List<Long> split(long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        long base = total / n;          // phần nguyên chia đều (số học nguyên, không qua double)
        long remainder = total % n;     // số đồng còn dư, luôn < n
        List<Long> shares = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            shares.add(base + (i < remainder ? 1 : 0));   // phân phát từng đồng dư cho các phần đầu
        }
        return shares;                  // tổng = base*n + remainder = total
    }
}`,
  hints: [
    'Làm tròn từng phần một cách độc lập thì sai số cộng dồn lại: 3 × 33.333 = 99.999.',
    'Dùng số học nguyên: total / n cho phần chung, total % n cho số đồng còn dư.',
    'Phát từng đồng dư cho vài người đầu tiên (mỗi người thêm 1 đồng). Tổng sẽ luôn đúng và chênh lệch tối đa 1 đồng.',
  ],
  rootCause: `**Làm tròn từng phần một cách độc lập** (và còn qua {{double}}). Khi chia không hết, mỗi phần bị làm tròn lên hoặc xuống cùng một hướng, sai số nhân lên theo số người: 100.000/3 → 3 × 33.333 = 99.999 (thiếu 1 đồng); 10.000/4 = 2.500 vẫn đúng, nhưng file audit cho thấy {{3000}} — vì phiên bản trước đó còn làm tròn lên hàng nghìn ở tầng hiển thị. Với số rất lớn, {{double}} còn mất chính xác (chỉ khoảng 15–16 chữ số có nghĩa). Nguyên tắc vi phạm: **tổng các phần phải bằng tổng gốc** — một ràng buộc nghiệp vụ mà code không hề kiểm tra.`,
  fix: `### Cách sửa
Dùng **số học nguyên**: phần chung {{total / n}}, số dư {{total % n}} được phát thêm 1 đồng cho {{remainder}} người đầu. Tổng luôn đúng, chênh lệch tối đa 1 đồng, không có {{double}} nào.

### Với tiền có phần thập phân (USD, EUR)
Đổi về **đơn vị nhỏ nhất** (cent) dạng {{long}}, chia như trên, rồi đổi lại; hoặc dùng {{BigDecimal}} với {{divide(n, 2, RoundingMode.DOWN)}} cho n−1 phần đầu và **phần cuối = tổng − tổng các phần trước**.
~~~java
BigDecimal part = total.divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
BigDecimal last = total.subtract(part.multiply(BigDecimal.valueOf(n - 1)));   // gánh phần lẻ
~~~

### Phòng ngừa
- Viết **property test**: với mọi total và n ngẫu nhiên, tổng các phần == total (jqwik hoặc vòng lặp ngẫu nhiên).
- Assert bất biến ngay trong code nghiệp vụ trước khi lưu: tổng phải khớp, nếu không thì từ chối.
- Không bao giờ dùng {{float}}/{{double}} cho tiền.

### Liên hệ phỏng vấn
Câu "chia 100 nghìn cho 3 người thế nào" kiểm tra bạn có nghĩ tới **bảo toàn tổng** (allocation) chứ không chỉ "làm tròn". Nêu được cách phân phát phần dư và lý do không dùng double là điểm cộng rõ.`,
  related: ['core-012'],
  tags: ['money', 'rounding', 'BigDecimal', 'allocation']
},
{
  id: 'bug-004',
  title: 'Sao kê ngân hàng: giao dịch lúc 0 giờ 30 bị tính sang ngày hôm trước',
  domain: 'Ngân hàng / Báo cáo',
  level: 'senior',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Hệ thống sao kê của ngân hàng tổng hợp giao dịch theo **ngày giao dịch theo giờ Việt Nam** (UTC+7) để gửi báo cáo cho khách hàng và cơ quan quản lý. Thời điểm giao dịch lưu dạng {{Instant}} (UTC). Service chạy trong container có múi giờ UTC.

**Sự cố:** Khách doanh nghiệp khiếu nại: khoản chuyển **00:30 ngày 07/11** xuất hiện trong sao kê **ngày 06/11**. Kiểm tra cho thấy khoảng **4% giao dịch mỗi ngày** (từ 0:00 đến 6:59 sáng) bị xếp sai ngày; báo cáo ngày gửi cơ quan quản lý lệch số liệu.

**Nhiệm vụ của bạn:** Sửa {{StatementService.dailyTotals}} để xếp giao dịch theo **ngày theo giờ Việt Nam**.`,
  artifacts: [
    { name: 'complaint-ticket.txt', lang: 'text', content: `Ticket CS-48812  Priority: High  Customer: Cong ty TNHH Minh Phat (corporate)
"Lenh chuyen 250.000.000d chung toi thuc hien luc 00:30 ngay 07/11 nam trong sao ke ngay 06/11.
Ke toan cua chung toi khong khop so voi so phu. Day la lan thu 3 trong thang."
Attached: transfer receipt ref FT2631100031 time 07/11/2026 00:30:12 (GMT+7)` },
    { name: 'db-row.txt', lang: 'text', content: `txn_id        | created_at (timestamptz, shown in UTC) | amount
FT2631100031  | 2026-11-06 17:30:12+00                 | 250000000
container env : TZ unset (UTC), user.timezone=UTC` },
  ],
  starter: `import java.time.*;

// ===== Hạ tầng (KHÔNG cần sửa) =====
record Txn(String id, Instant at, long amount) {}

// ===== Code cần sửa =====
class StatementService {
    /** Tổng tiền giao dịch theo NGÀY GIAO DỊCH của ngân hàng (theo giờ Việt Nam). */
    Map<LocalDate, Long> dailyTotals(List<Txn> txns) {
        Map<LocalDate, Long> out = new TreeMap<>();
        for (Txn t : txns) {
            LocalDate day = LocalDateTime.ofInstant(t.at(), ZoneOffset.UTC).toLocalDate();
            out.merge(day, t.amount(), Long::sum);
        }
        return out;
    }
}`,
  tests: `import java.time.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static Txn t(String id, String instant, long amount) { return new Txn(id, Instant.parse(instant), amount); }

    public static void main(String[] args) {
        StatementService s = new StatementService();

        Map<LocalDate, Long> r1 = s.dailyTotals(List.of(t("FT1", "2026-11-06T17:30:12Z", 250_000_000L)));
        check("giao_dich_0h30_sang", r1.equals(Map.of(LocalDate.of(2026, 11, 7), 250_000_000L)),
            "00:30 ngày 07/11 giờ VN phải thuộc ngày 2026-11-07, thực tế " + r1);

        Map<LocalDate, Long> r2 = s.dailyTotals(List.of(t("FT2", "2026-11-06T16:59:59Z", 100L), t("FT3", "2026-11-06T17:00:00Z", 200L)));
        check("ranh_gioi_nua_dem", r2.equals(Map.of(LocalDate.of(2026, 11, 6), 100L, LocalDate.of(2026, 11, 7), 200L)),
            "23:59:59 thuộc 06/11, 00:00:00 thuộc 07/11 (giờ VN), thực tế " + r2);

        Map<LocalDate, Long> r3 = s.dailyTotals(List.of(t("FT4", "2026-10-31T18:00:00Z", 50L)));
        check("sang_thang_moi", r3.equals(Map.of(LocalDate.of(2026, 11, 1), 50L)),
            "01:00 ngày 01/11 giờ VN phải thuộc tháng 11, thực tế " + r3);

        Map<LocalDate, Long> r4 = s.dailyTotals(List.of(t("FT5", "2026-11-07T03:00:00Z", 10L), t("FT6", "2026-11-07T09:00:00Z", 20L)));
        check("ban_ngay_khong_doi", r4.equals(Map.of(LocalDate.of(2026, 11, 7), 30L)),
            "giao dịch ban ngày 07/11 cộng chung một ngày, thực tế " + r4);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `import java.time.*;

record Txn(String id, Instant at, long amount) {}

class StatementService {
    // Ngày giao dịch là khái niệm NGHIỆP VỤ gắn với giờ Việt Nam -> nêu múi giờ tường minh,
    // không phụ thuộc múi giờ của máy chủ hay container.
    private static final ZoneId BANK_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    Map<LocalDate, Long> dailyTotals(List<Txn> txns) {
        Map<LocalDate, Long> out = new TreeMap<>();
        for (Txn t : txns) {
            LocalDate day = t.at().atZone(BANK_ZONE).toLocalDate();
            out.merge(day, t.amount(), Long::sum);
        }
        return out;
    }
}`,
  hints: [
    'Instant là một thời điểm tuyệt đối (UTC). "Ngày" chỉ có nghĩa khi gắn với một múi giờ. Code đang dùng múi giờ nào?',
    '2026-11-06T17:30:12Z theo giờ Việt Nam (UTC+7) là 00:30:12 ngày 07/11.',
    'Dùng ZoneId.of("Asia/Ho_Chi_Minh") và t.at().atZone(zone).toLocalDate().',
  ],
  rootCause: `**Ngày nghiệp vụ được tính theo múi giờ UTC thay vì giờ Việt Nam.** Thời điểm lưu đúng ({{Instant}}, cột {{timestamptz}}), nhưng khi đổi sang "ngày", code dùng {{ZoneOffset.UTC}}. Giao dịch {{2026-11-06 17:30:12+00}} là 00:30 ngày 07/11 giờ Việt Nam, nhưng bị xếp vào 06/11. Mọi giao dịch từ 0:00 đến 6:59 sáng (giờ VN) đều lệch một ngày — khớp với tỉ lệ khoảng 4% giao dịch. Biến thể hay gặp khác của cùng lỗi: dùng {{LocalDate.now()}}/{{ZoneId.systemDefault()}}, kết quả đúng trên máy dev (giờ VN) nhưng sai trong container (UTC).`,
  fix: `### Cách sửa
Đặt múi giờ nghiệp vụ **tường minh**: {{ZoneId.of("Asia/Ho_Chi_Minh")}} và {{instant.atZone(zone).toLocalDate()}}. Không dựa vào {{ZoneId.systemDefault()}} hay biến môi trường {{TZ}} của container.

### Trên production thật
- Lưu thời điểm bằng {{Instant}} / {{timestamptz}} (đã đúng).
- Khi truy vấn "giao dịch của ngày D", tính ranh giới bằng múi giờ nghiệp vụ rồi lọc theo khoảng **[đầu ngày, đầu ngày hôm sau)**:
~~~java
ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
Instant from = day.atStartOfDay(vn).toInstant();            // 2026-11-06T17:00:00Z
Instant to   = day.plusDays(1).atStartOfDay(vn).toInstant();
// WHERE created_at >= :from AND created_at < :to
~~~
- Inject {{Clock}} vào service để test được các mốc 23:59:59, 00:00:00, cuối tháng, cuối năm.

### Phòng ngừa
- Quy ước trong team: mọi chuyển đổi Instant → ngày/giờ phải nêu ZoneId; cấm {{systemDefault()}} trong code nghiệp vụ (kiểm bằng ArchUnit hoặc grep trong CI).
- Bộ test ranh giới ngày luôn có trong mọi báo cáo theo ngày.
- Đặt cùng một múi giờ cho môi trường dev và CI như production (UTC) để lỗi lộ ra sớm.

### Liên hệ phỏng vấn
"Lưu thời gian thế nào để không lỗi múi giờ" là câu hỏi rất hay gặp ở ngân hàng: lưu Instant/timestamptz, đổi sang giờ địa phương chỉ khi hiển thị hoặc tính ranh giới nghiệp vụ, nêu ZoneId tường minh, test các mốc nửa đêm.`,
  related: ['core-013'],
  tags: ['timezone', 'java.time', 'Instant', 'banking', 'reporting']
},
{
  id: 'bug-005',
  title: 'API danh sách đơn hàng chậm 3 giây: 501 câu query cho một request',
  domain: 'Thương mại điện tử / Backend API',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Trang quản trị của người bán hiển thị 500 đơn hàng gần nhất kèm tên khách. Service dùng repository (trong dự án thật là Spring Data JPA). Ở đây repository được mô phỏng và **đếm số câu query**.

**Sự cố:** Sau khi một người bán lớn có nhiều đơn, API {{GET /orders/recent}} có p95 **3,2 giây**, DB CPU tăng 40% mỗi lần người bán mở trang. APM cho thấy **501 câu SELECT** cho một request.

**Nhiệm vụ của bạn:** Sửa {{OrderQueryService.recentOrders}} để chỉ dùng **tối đa 2 câu query** cho cả danh sách, giữ nguyên thứ tự đơn hàng và xử lý khách hàng đã bị xoá.`,
  artifacts: [
    { name: 'apm-trace.txt', lang: 'text', content: `GET /orders/recent?limit=500   duration=3184 ms   db.calls=501   db.time=2875 ms
  span  OrderRepo.findRecent           1 call     41 ms   SELECT * FROM orders ORDER BY created_at DESC LIMIT 500
  span  CustomerRepo.findById        500 calls  2834 ms   SELECT * FROM customers WHERE id = ?
        (distinct customer ids in result: 212)` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
record Order(long id, long customerId, long amount) {}
record Customer(long id, String name) {}
record OrderView(long orderId, String customerName, long amount) {}

interface OrderRepo { List<Order> findRecent(int limit); }                 // 1 query

interface CustomerRepo {
    Optional<Customer> findById(long id);                                 // 1 query mỗi lần gọi
    Map<Long, Customer> findAllById(Collection<Long> ids);               // 1 query cho cả tập id (WHERE id IN (...))
}

// ===== Code cần sửa =====
class OrderQueryService {
    private final OrderRepo orders;
    private final CustomerRepo customers;

    OrderQueryService(OrderRepo orders, CustomerRepo customers) { this.orders = orders; this.customers = customers; }

    List<OrderView> recentOrders(int limit) {
        List<OrderView> out = new ArrayList<>();
        for (Order o : orders.findRecent(limit)) {
            String name = customers.findById(o.customerId()).map(Customer::name).orElse("(đã xoá)");
            out.add(new OrderView(o.id(), name, o.amount()));
        }
        return out;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static final AtomicInteger QUERIES = new AtomicInteger();

    static class FakeOrders implements OrderRepo {
        final List<Order> data = new ArrayList<>();
        public List<Order> findRecent(int limit) { QUERIES.incrementAndGet(); return new ArrayList<>(data.subList(0, Math.min(limit, data.size()))); }
    }
    static class FakeCustomers implements CustomerRepo {
        final Map<Long, Customer> data = new HashMap<>();
        public Optional<Customer> findById(long id) { QUERIES.incrementAndGet(); return Optional.ofNullable(data.get(id)); }
        public Map<Long, Customer> findAllById(Collection<Long> ids) {
            QUERIES.incrementAndGet();
            Map<Long, Customer> r = new HashMap<>();
            for (Long id : ids) if (data.containsKey(id)) r.put(id, data.get(id));
            return r;
        }
    }

    public static void main(String[] args) {
        FakeOrders fo = new FakeOrders();
        FakeCustomers fc = new FakeCustomers();
        for (long c = 1; c <= 212; c++) fc.data.put(c, new Customer(c, "KH-" + c));
        for (long i = 1; i <= 500; i++) fo.data.add(new Order(1000 + i, (i % 213), i * 1000));   // customerId 0 không tồn tại
        OrderQueryService s = new OrderQueryService(fo, fc);

        QUERIES.set(0);
        List<OrderView> r = s.recentOrders(500);
        int q = QUERIES.get();
        check("toi_da_2_query", q <= 2, "kỳ vọng tối đa 2 câu query, thực tế " + q);

        boolean orderKept = r.size() == 500;
        for (int i = 0; orderKept && i < r.size(); i++) orderKept = r.get(i).orderId() == 1001 + i;
        check("giu_thu_tu_don", orderKept, "danh sách phải giữ đúng thứ tự từ findRecent");

        boolean namesOk = r.size() == 500;
        for (OrderView v : r) {
            long cid = (v.orderId() - 1000) % 213;
            String expected = cid == 0 ? "(đã xoá)" : "KH-" + cid;
            if (!expected.equals(v.customerName())) { namesOk = false; break; }
        }
        check("ten_khach_dung_va_khach_da_xoa", namesOk, "tên khách sai hoặc khách đã xoá không hiển thị (đã xoá)");

        QUERIES.set(0);
        FakeOrders empty = new FakeOrders();
        List<OrderView> r2 = new OrderQueryService(empty, fc).recentOrders(500);
        check("danh_sach_rong", r2.isEmpty() && QUERIES.get() <= 2, "danh sách rỗng trả về rỗng, query=" + QUERIES.get());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `record Order(long id, long customerId, long amount) {}
record Customer(long id, String name) {}
record OrderView(long orderId, String customerName, long amount) {}

interface OrderRepo { List<Order> findRecent(int limit); }

interface CustomerRepo {
    Optional<Customer> findById(long id);
    Map<Long, Customer> findAllById(Collection<Long> ids);
}

class OrderQueryService {
    private final OrderRepo orders;
    private final CustomerRepo customers;

    OrderQueryService(OrderRepo orders, CustomerRepo customers) { this.orders = orders; this.customers = customers; }

    List<OrderView> recentOrders(int limit) {
        List<Order> list = orders.findRecent(limit);                       // query 1
        if (list.isEmpty()) return List.of();
        Set<Long> ids = new HashSet<>();
        for (Order o : list) ids.add(o.customerId());                       // gom id khác nhau (212 thay vì 500)
        Map<Long, Customer> byId = customers.findAllById(ids);             // query 2: WHERE id IN (...)
        List<OrderView> out = new ArrayList<>(list.size());
        for (Order o : list) {                                              // ghép trong bộ nhớ, giữ thứ tự
            Customer c = byId.get(o.customerId());
            out.add(new OrderView(o.id(), c == null ? "(đã xoá)" : c.name(), o.amount()));
        }
        return out;
    }
}`,
  hints: [
    'Đếm: 1 query lấy đơn + 1 query cho MỖI đơn để lấy tên khách = 1 + N. Đó là N+1.',
    'Gom tất cả customerId (khác nhau) lại rồi lấy một lần bằng findAllById.',
    'Sau khi có Map id → Customer, ghép trong bộ nhớ theo đúng thứ tự danh sách đơn; id không có trong map là khách đã xoá.',
  ],
  rootCause: `**N+1 query.** Code lấy 500 đơn bằng 1 query rồi gọi {{findById}} **trong vòng lặp** cho từng đơn → 500 query nữa, dù chỉ có 212 khách khác nhau. Mỗi query nhanh (khoảng 5ms) nhưng 500 round-trip tuần tự cộng lại gần 3 giây và tạo tải lớn cho DB. Trace APM cho thấy đúng {{db.calls=501}} và {{CustomerRepo.findById 500 calls}}. Trong JPA thật, lỗi này thường **ẩn** sau quan hệ {{@ManyToOne(fetch = LAZY)}}: chỉ cần gọi {{order.getCustomer().getName()}} trong vòng lặp là Hibernate sinh một query mỗi lần.`,
  fix: `### Cách sửa trong bài
Gom id → **một** query {{findAllById}} ({{WHERE id IN (...)}}) → ghép trong bộ nhớ bằng Map. 501 query còn 2.

### Trên production với JPA/Hibernate
- **JOIN FETCH** khi luôn cần dữ liệu liên quan: {{select o from Order o join fetch o.customer where ...}}.
- **{{@EntityGraph(attributePaths = "customer")}}** trên method repository.
- **{{hibernate.default_batch_fetch_size}}** (ví dụ 50–100): Hibernate gom các lần lazy load thành {{IN (...)}} theo lô — giảm N+1 thành N/50+1 mà không đổi code.
- **Projection/DTO query** cho màn hình danh sách: chỉ lấy cột cần thiết, không tải entity.
- Lưu ý phân trang + JOIN FETCH collection (OneToMany) làm Hibernate phân trang trong bộ nhớ (cảnh báo HHH90003004) — dùng hai bước: lấy id theo trang, rồi fetch theo id.

### Phòng ngừa
- Test đếm số query (datasource-proxy, Hypersistence Utils, hoặc thống kê Hibernate) cho các API danh sách quan trọng.
- Bật cảnh báo trong APM khi một request có hơn 20–50 query.
- Review: thấy truy cập quan hệ lazy trong vòng lặp là dừng lại hỏi.

### Liên hệ phỏng vấn
N+1 là câu hỏi JPA phổ biến nhất ở level Senior. Trả lời tốt: nhận diện (đếm query, log SQL), giải thích cơ chế lazy loading, và nêu ít nhất 3 cách sửa kèm khi nào dùng cách nào.`,
  related: ['jpa-001'],
  tags: ['N+1', 'JPA', 'performance', 'query']
},
{
  id: 'bug-006',
  title: 'Sau 5 lỗi dữ liệu, mọi request báo "Connection is not available"',
  domain: 'Fintech / Báo cáo merchant',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** Service báo cáo cho merchant mượn connection từ **pool** (trong dự án thật là HikariCP) để chạy truy vấn báo cáo. Pool có kích thước cố định.

**Sự cố:** Một merchant có dữ liệu lỗi khiến truy vấn báo cáo ném exception. Sau vài lần merchant đó bấm "Tải lại", **toàn bộ** service báo lỗi {{Connection is not available, request timed out after 30000ms}} cho mọi merchant khác. Restart pod thì hết, vài giờ sau lại bị. Pool có 10 connection, nhưng dashboard cho thấy 10/10 đang "active" dù DB không có query nào chạy.

**Nhiệm vụ của bạn:** Tìm vì sao connection không quay về pool và sửa {{ReportService.monthlyReport}}.`,
  artifacts: [
    { name: 'report-service.log', lang: 'text', content: `14:02:11.402 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
14:02:19.877 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
14:02:25.130 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
... (7 more)
14:04:02.611 WARN  HikariPool-1  : Connection leak detection triggered for conn10 on thread http-nio-8080-exec-4, stack trace follows
        at ReportService.monthlyReport(ReportService.java:21)
14:05:40.003 ERROR ReportService : report failed merchant=M-0007 : SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms (total=10, active=10, idle=0, waiting=37)` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng HikariCP, KHÔNG cần sửa) =====
class PoolExhaustedException extends RuntimeException {
    PoolExhaustedException(String m) { super(m); }
}

class ConnectionPool {
    private final int max;
    private int inUse = 0;
    ConnectionPool(int max) { this.max = max; }
    synchronized Connection borrow() {
        if (inUse >= max) throw new PoolExhaustedException("Connection is not available (active=" + inUse + "/" + max + ")");
        inUse++;
        return new Connection(this);
    }
    synchronized void giveBack() { inUse--; }
    synchronized int active() { return inUse; }
}

class Connection implements AutoCloseable {
    private final ConnectionPool pool;
    private boolean closed = false;
    Connection(ConnectionPool pool) { this.pool = pool; }
    String query(String merchantId) {
        if (merchantId.startsWith("BAD")) throw new IllegalStateException("corrupt row for " + merchantId);
        return "report:" + merchantId;
    }
    @Override public void close() {            // trả connection về pool (gọi nhiều lần cũng an toàn)
        if (!closed) { closed = true; pool.giveBack(); }
    }
}

// ===== Code cần sửa =====
class ReportService {
    private final ConnectionPool pool;
    ReportService(ConnectionPool pool) { this.pool = pool; }

    String monthlyReport(String merchantId) {
        Connection c = pool.borrow();
        String data = c.query(merchantId);
        c.close();
        return data;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        ConnectionPool pool = new ConnectionPool(3);
        ReportService s = new ReportService(pool);

        check("bao_cao_binh_thuong", "report:M-1".equals(s.monthlyReport("M-1")) && pool.active() == 0,
            "báo cáo bình thường phải trả connection, active=" + pool.active());

        int errors = 0;
        for (int i = 0; i < 10; i++) {
            try { s.monthlyReport("BAD-91"); } catch (IllegalStateException e) { errors++; } catch (RuntimeException e) { /* pool cạn */ }
        }
        check("loi_du_lieu_van_tra_connection", errors == 10 && pool.active() == 0,
            "sau 10 lần lỗi dữ liệu, pool phải trống (active=0), thực tế active=" + pool.active() + ", lỗi đúng kiểu=" + errors);

        String after = null;
        try { after = s.monthlyReport("M-7"); } catch (RuntimeException e) { after = "EXC " + e.getMessage(); }
        check("merchant_khac_khong_bi_anh_huong", "report:M-7".equals(after), "merchant khác phải chạy được, thực tế " + after);

        boolean propagated = false;
        try { s.monthlyReport("BAD-2"); } catch (IllegalStateException e) { propagated = true; } catch (RuntimeException e) { propagated = false; }
        check("loi_goc_khong_bi_nuot", propagated, "lỗi dữ liệu phải được ném ra cho controller (không nuốt, không đổi kiểu)");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class PoolExhaustedException extends RuntimeException {
    PoolExhaustedException(String m) { super(m); }
}

class ConnectionPool {
    private final int max;
    private int inUse = 0;
    ConnectionPool(int max) { this.max = max; }
    synchronized Connection borrow() {
        if (inUse >= max) throw new PoolExhaustedException("Connection is not available (active=" + inUse + "/" + max + ")");
        inUse++;
        return new Connection(this);
    }
    synchronized void giveBack() { inUse--; }
    synchronized int active() { return inUse; }
}

class Connection implements AutoCloseable {
    private final ConnectionPool pool;
    private boolean closed = false;
    Connection(ConnectionPool pool) { this.pool = pool; }
    String query(String merchantId) {
        if (merchantId.startsWith("BAD")) throw new IllegalStateException("corrupt row for " + merchantId);
        return "report:" + merchantId;
    }
    @Override public void close() {
        if (!closed) { closed = true; pool.giveBack(); }
    }
}

class ReportService {
    private final ConnectionPool pool;
    ReportService(ConnectionPool pool) { this.pool = pool; }

    String monthlyReport(String merchantId) {
        // try-with-resources: close() luôn được gọi, kể cả khi query ném exception
        try (Connection c = pool.borrow()) {
            return c.query(merchantId);
        }
    }
}`,
  hints: [
    'Đi theo đường chạy khi query ném exception: dòng c.close() có được chạy không?',
    'Mỗi lần lỗi, một connection bị "mượn" mà không bao giờ trả. Pool có giới hạn nên sau vài lần lỗi thì cạn.',
    'Connection implements AutoCloseable: dùng try-with-resources để close luôn chạy. Đừng bắt và nuốt exception — controller vẫn cần biết lỗi.',
  ],
  rootCause: `**Rò rỉ connection trên nhánh lỗi.** {{c.close()}} chỉ chạy khi {{query}} thành công; khi dữ liệu lỗi làm {{query}} ném exception, method thoát ngay và connection **không bao giờ được trả về pool**. Merchant M-0091 bấm tải lại 10 lần → 10/10 connection bị giữ vĩnh viễn ({{active=10, idle=0}} trong khi DB không chạy query nào) → mọi request khác chờ 30 giây rồi lỗi. Dòng {{Connection leak detection triggered ... at ReportService.monthlyReport}} của HikariCP chỉ thẳng vào chỗ mượn connection mà không trả. Restart pod "chữa" được vì tạo pool mới.`,
  fix: `### Cách sửa
Dùng **try-with-resources**: {{close()}} được gọi khi rời khối, kể cả khi có exception; exception gốc vẫn được ném ra cho controller xử lý.
~~~java
try (Connection c = pool.borrow()) {
    return c.query(merchantId);
}
~~~

### Trên production thật
- Trong Spring, hầu như **không tự mượn connection**: dùng {{JdbcTemplate}}, Spring Data, hoặc {{@Transactional}} — framework tự trả connection. Rò rỉ thường xuất hiện khi tự gọi {{dataSource.getConnection()}}, tự mở {{EntityManager}}, hoặc stream kết quả ({{Stream<T>}} từ repository) mà không đóng.
- Bật **{{leakDetectionThreshold}}** của HikariCP (ví dụ 20000ms) ở môi trường test và staging: Hikari in stack trace nơi mượn connection quá lâu.
- Theo dõi metric {{hikaricp_connections_active}} và {{hikaricp_connections_pending}}; cảnh báo khi active chạm max kéo dài.
- Lỗi do **một** merchant không được làm sập **mọi** merchant: cân nhắc bulkhead (pool riêng cho báo cáo nặng) và timeout truy vấn.

### Phòng ngừa
- Static analysis (SpotBugs OBL_UNSATISFIED_OBLIGATION, Sonar "Resources should be closed").
- Test nhánh lỗi: sau N lần lỗi, pool phải trống.

### Liên hệ phỏng vấn
Câu "service báo hết connection nhưng DB rảnh — bạn điều tra thế nào?" rất hay gặp: nêu leak detection của Hikari, metric active/idle/pending, thread dump, và try-with-resources/để framework quản lý connection.`,
  related: ['core-015'],
  tags: ['connection pool', 'HikariCP', 'resource leak', 'try-with-resources']
},
{
  id: 'bug-007',
  title: 'Chuyển tiền qua lại giữa hai ví làm service treo cứng',
  domain: 'Ví điện tử / Chuyển tiền P2P',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Chuyển tiền P2P giữa hai ví trong cùng hệ thống. Để tránh race condition, dev trước đã **khoá cả hai tài khoản** bằng {{synchronized}} trước khi trừ và cộng tiền.

**Sự cố:** Ngày lương về, hai vợ chồng thường xuyên chuyển tiền qua lại. Thỉnh thoảng một pod **treo cứng**: CPU gần 0%, mọi request chuyển tiền timeout, health check vẫn trả UP. Thread dump cho thấy hai thread **chờ nhau mãi mãi**. Restart pod thì hết, vài giờ sau lặp lại.

**Nhiệm vụ của bạn:** Sửa {{TransferService.transfer}} để **không bao giờ deadlock**, vẫn đảm bảo tổng tiền không đổi và không âm.`,
  artifacts: [
    { name: 'jstack-pod-3.txt', lang: 'text', content: `Found one Java-level deadlock:
=============================
"http-nio-8080-exec-12":
  waiting to lock monitor 0x00007f3a8c0042d8 (object 0x00000006c1b2e7a0, a Account),
  which is held by "http-nio-8080-exec-31"
"http-nio-8080-exec-31":
  waiting to lock monitor 0x00007f3a8c0046b8 (object 0x00000006c1b2e6f0, a Account),
  which is held by "http-nio-8080-exec-12"

Java stack information for the threads listed above:
===================================================
"http-nio-8080-exec-12":
        at TransferService.transfer(TransferService.java:14)
        - waiting to lock <0x00000006c1b2e7a0> (a Account)      <- account W-2002 (to)
        - locked <0x00000006c1b2e6f0> (a Account)               <- account W-1001 (from)
"http-nio-8080-exec-31":
        at TransferService.transfer(TransferService.java:14)
        - waiting to lock <0x00000006c1b2e6f0> (a Account)      <- account W-1001 (to)
        - locked <0x00000006c1b2e7a0> (a Account)               <- account W-2002 (from)` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Account {
    final long id;
    long balance;
    Account(long id, long balance) { this.id = id; this.balance = balance; }
}

// ===== Code cần sửa =====
class TransferService {
    /** Chuyển amount từ from sang to. Trả false nếu không đủ tiền. */
    boolean transfer(Account from, Account to, long amount) {
        synchronized (from) {
            synchronized (to) {
                if (from.balance < amount) return false;
                from.balance -= amount;
                to.balance += amount;
                return true;
            }
        }
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        TransferService s = new TransferService();

        Account a0 = new Account(1, 100), b0 = new Account(2, 0);
        boolean ok = s.transfer(a0, b0, 60);
        boolean no = s.transfer(a0, b0, 60);
        check("chuyen_don_le", ok && !no && a0.balance == 40 && b0.balance == 60, "kỳ vọng a=40 b=60 và lần 2 bị từ chối, thực tế a=" + a0.balance + " b=" + b0.balance);

        // Hai chiều đồng thời: A->B và B->A liên tục (đúng như sự cố)
        Account a = new Account(1001, 1_000_000), b = new Account(2002, 1_000_000);
        Runnable ab = () -> { for (int i = 0; i < 200_000; i++) s.transfer(a, b, 1); };
        Runnable ba = () -> { for (int i = 0; i < 200_000; i++) s.transfer(b, a, 1); };
        Thread[] ts = { new Thread(ab), new Thread(ba), new Thread(ab), new Thread(ba) };
        for (Thread t : ts) { t.setDaemon(true); t.start(); }
        long deadline = System.currentTimeMillis() + 8000;
        for (Thread t : ts) t.join(Math.max(1, deadline - System.currentTimeMillis()));
        boolean finished = true;
        for (Thread t : ts) if (t.isAlive()) finished = false;
        check("khong_deadlock", finished, "các thread chuyển tiền hai chiều không kết thúc sau 8 giây -> deadlock");

        if (finished) {
            check("tong_tien_khong_doi", a.balance + b.balance == 2_000_000, "tổng tiền phải giữ 2.000.000, thực tế " + (a.balance + b.balance));
            check("khong_am", a.balance >= 0 && b.balance >= 0, "số dư không được âm: a=" + a.balance + " b=" + b.balance);
        } else {
            check("tong_tien_khong_doi", false, "không kiểm tra được vì deadlock");
            check("khong_am", false, "không kiểm tra được vì deadlock");
        }

        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);   // kết thúc kể cả khi còn thread kẹt
    }
}`,
  reference: `class Account {
    final long id;
    long balance;
    Account(long id, long balance) { this.id = id; this.balance = balance; }
}

class TransferService {
    boolean transfer(Account from, Account to, long amount) {
        // Luôn khoá theo CÙNG một thứ tự toàn cục (id nhỏ trước) -> không thể tạo vòng chờ.
        Account first = from.id < to.id ? from : to;
        Account second = from.id < to.id ? to : from;
        synchronized (first) {
            synchronized (second) {
                if (from.balance < amount) return false;
                from.balance -= amount;
                to.balance += amount;
                return true;
            }
        }
    }
}`,
  hints: [
    'Đọc jstack: exec-12 giữ W-1001 và chờ W-2002; exec-31 giữ W-2002 và chờ W-1001. Đây là vòng chờ.',
    'Thread chuyển A→B khoá A trước; thread chuyển B→A khoá B trước. Thứ tự khoá phụ thuộc chiều chuyển tiền.',
    'Khoá theo một thứ tự cố định không phụ thuộc chiều chuyển, ví dụ theo id tăng dần.',
  ],
  rootCause: `**Deadlock do thứ tự khoá không nhất quán.** {{transfer(from, to)}} khoá {{from}} trước rồi {{to}}. Khi vợ chuyển W-1001→W-2002 và chồng chuyển W-2002→W-1001 cùng lúc, thread thứ nhất giữ W-1001 chờ W-2002, thread thứ hai giữ W-2002 chờ W-1001 — vòng chờ, không ai nhả. {{synchronized}} không có timeout nên hai thread kẹt vĩnh viễn; dần dần mọi thread của Tomcat chạm vào hai ví này cũng kẹt theo. CPU gần 0% vì các thread chỉ đứng chờ. jstack in rõ "Found one Java-level deadlock" kèm hai monitor đổi chéo.`,
  fix: `### Cách sửa
Khoá theo **thứ tự toàn cục** (id tăng dần): mọi thread luôn khoá ví id nhỏ trước, nên không thể có vòng chờ. Điều kiện để deadlock xảy ra (giữ một khoá trong lúc chờ khoá khác **theo thứ tự ngược nhau**) bị loại bỏ.

### Các cách khác
- {{ReentrantLock.tryLock(timeout)}}: không lấy được thì nhả khoá đang giữ và thử lại sau (có backoff) — tránh treo nhưng phức tạp hơn và có thể livelock.
- Một khoá chung cho mọi giao dịch: đúng nhưng tuần tự hoá toàn bộ, throughput sụp.

### Trên production thật (DB)
Khoá trong JVM không có tác dụng khi chạy nhiều pod; khoá nằm ở DB. Quy tắc giống hệt: khoá các dòng theo **thứ tự id** ({{SELECT ... FOR UPDATE ORDER BY id}}), transaction ngắn, và **retry có giới hạn** khi DB báo deadlock (PostgreSQL tự phát hiện và huỷ một transaction). Hoặc dùng UPDATE có điều kiện cho từng ví trong một transaction theo thứ tự id.

### Phòng ngừa
- Health check nên kiểm tra "thread pool còn xử lý được không" chứ không chỉ "process còn sống".
- Bật cảnh báo số deadlock (DB) và theo dõi số thread BLOCKED (JVM, JFR).
- Test đồng thời hai chiều cho mọi thao tác khoá nhiều đối tượng.

### Liên hệ phỏng vấn
"Chuyển tiền A→B và B→A cùng lúc có vấn đề gì" là câu kinh điển: nêu bốn điều kiện deadlock, cách đọc jstack, khoá theo thứ tự, tryLock, và cách xử lý tương tự ở tầng DB.`,
  related: ['scenario-124'],
  tags: ['deadlock', 'concurrency', 'locking', 'jstack']
},
{
  id: 'bug-008',
  title: 'Job đồng bộ đơn hàng sang ERP chỉ gửi được một nửa',
  domain: 'Bán lẻ / Tích hợp ERP',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Mỗi đêm, job {{ErpExportJob}} lấy các đơn hàng **chưa đồng bộ** (trạng thái PENDING), gửi sang hệ thống ERP của kế toán, rồi đánh dấu đã gửi (EXPORTED). Job đọc theo trang 100 đơn để không tải hết vào bộ nhớ.

**Sự cố:** Kế toán báo doanh thu trên ERP **thấp hơn** hệ thống bán hàng khoảng 50%. Log của job báo "exported 4,000 orders" trong khi có 8,000 đơn PENDING. Chạy lại job lần hai thì gửi thêm khoảng một nửa số còn lại, lần ba thêm một nửa nữa… nên team "chữa cháy" bằng cách chạy job 5 lần mỗi đêm.

**Nhiệm vụ của bạn:** Sửa {{ErpExportJob.exportAll}} để **một lần chạy gửi đủ mọi đơn PENDING, mỗi đơn đúng một lần**.`,
  artifacts: [
    { name: 'erp-export.log', lang: 'text', content: `01:00:00.012 INFO  ErpExportJob : start, pending=8000, pageSize=100
01:00:00.388 DEBUG ErpExportJob : page offset=0    -> ids 1..100
01:00:00.802 DEBUG ErpExportJob : page offset=100  -> ids 201..300
01:00:01.190 DEBUG ErpExportJob : page offset=200  -> ids 401..500
...
01:00:16.540 DEBUG ErpExportJob : page offset=3900 -> ids 7801..7900
01:00:16.902 DEBUG ErpExportJob : page offset=4000 -> (empty)
01:00:16.903 INFO  ErpExportJob : done, exported=4000, remaining pending=4000` },
    { name: 'repository-query.sql', lang: 'sql', content: `-- OrderRepo.findPending(offset, limit)
SELECT * FROM orders WHERE status = 'PENDING' ORDER BY id LIMIT :limit OFFSET :offset;
-- OrderRepo.findPendingAfter(lastId, limit)
SELECT * FROM orders WHERE status = 'PENDING' AND id > :lastId ORDER BY id LIMIT :limit;` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
record ErpOrder(long id, long amount) {}

interface OrderRepo {
    /** SELECT ... WHERE status='PENDING' ORDER BY id LIMIT limit OFFSET offset */
    List<ErpOrder> findPending(int offset, int limit);
    /** SELECT ... WHERE status='PENDING' AND id > lastId ORDER BY id LIMIT limit */
    List<ErpOrder> findPendingAfter(long lastId, int limit);
    /** UPDATE orders SET status='EXPORTED' WHERE id = ? */
    void markExported(long id);
}

interface Erp { void send(ErpOrder o); }

// ===== Code cần sửa =====
class ErpExportJob {
    private final OrderRepo repo;
    private final Erp erp;
    ErpExportJob(OrderRepo repo, Erp erp) { this.repo = repo; this.erp = erp; }

    /** Gửi mọi đơn PENDING sang ERP. Trả về số đơn đã gửi. */
    int exportAll(int pageSize) {
        int offset = 0, count = 0;
        while (true) {
            List<ErpOrder> page = repo.findPending(offset, pageSize);
            if (page.isEmpty()) break;
            for (ErpOrder o : page) {
                erp.send(o);
                repo.markExported(o.id());
                count++;
            }
            offset += pageSize;
        }
        return count;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    /** "Bảng orders" trong bộ nhớ: id -> PENDING/EXPORTED, sắp theo id. */
    static class FakeRepo implements OrderRepo {
        final TreeMap<Long, Boolean> pending = new TreeMap<>();   // true = PENDING
        Runnable onEachPage = () -> {};
        List<ErpOrder> pendingList() {
            List<ErpOrder> r = new ArrayList<>();
            for (Map.Entry<Long, Boolean> e : pending.entrySet()) if (e.getValue()) r.add(new ErpOrder(e.getKey(), e.getKey() * 10));
            return r;
        }
        public List<ErpOrder> findPending(int offset, int limit) {
            onEachPage.run();
            List<ErpOrder> all = pendingList();
            return new ArrayList<>(all.subList(Math.min(offset, all.size()), Math.min(offset + limit, all.size())));
        }
        public List<ErpOrder> findPendingAfter(long lastId, int limit) {
            onEachPage.run();
            List<ErpOrder> r = new ArrayList<>();
            for (ErpOrder o : pendingList()) if (o.id() > lastId && r.size() < limit) r.add(o);
            return r;
        }
        public void markExported(long id) { pending.put(id, false); }
    }

    static class FakeErp implements Erp {
        final List<Long> sent = new ArrayList<>();
        public void send(ErpOrder o) { sent.add(o.id()); }
    }

    public static void main(String[] args) {
        FakeRepo r1 = new FakeRepo();
        for (long id = 1; id <= 8000; id++) r1.pending.put(id, true);
        FakeErp e1 = new FakeErp();
        int n = new ErpExportJob(r1, e1).exportAll(100);
        check("gui_du_8000_don", n == 8000 && e1.sent.size() == 8000, "kỳ vọng 8000 đơn trong một lần chạy, thực tế " + e1.sent.size());
        check("khong_gui_trung", new HashSet<>(e1.sent).size() == e1.sent.size(), "có đơn bị gửi trùng sang ERP");
        check("khong_con_pending", r1.pendingList().isEmpty(), "sau job vẫn còn " + r1.pendingList().size() + " đơn PENDING");

        // Có đơn mới phát sinh trong lúc job đang chạy (id lớn hơn)
        FakeRepo r2 = new FakeRepo();
        for (long id = 1; id <= 300; id++) r2.pending.put(id, true);
        final long[] nextId = { 1000 };
        r2.onEachPage = () -> { if (nextId[0] < 1003) r2.pending.put(nextId[0]++, true); };
        FakeErp e2 = new FakeErp();
        new ErpExportJob(r2, e2).exportAll(50);
        check("don_moi_trong_luc_chay", new HashSet<>(e2.sent).size() == e2.sent.size() && e2.sent.containsAll(List.of(1L, 150L, 300L)),
            "đơn cũ phải được gửi đủ và không trùng khi có đơn mới phát sinh");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `record ErpOrder(long id, long amount) {}

interface OrderRepo {
    List<ErpOrder> findPending(int offset, int limit);
    List<ErpOrder> findPendingAfter(long lastId, int limit);
    void markExported(long id);
}

interface Erp { void send(ErpOrder o); }

class ErpExportJob {
    private final OrderRepo repo;
    private final Erp erp;
    ErpExportJob(OrderRepo repo, Erp erp) { this.repo = repo; this.erp = erp; }

    int exportAll(int pageSize) {
        long lastId = 0;          // keyset: nhớ id cuối cùng đã xử lý thay vì đếm offset
        int count = 0;
        while (true) {
            List<ErpOrder> page = repo.findPendingAfter(lastId, pageSize);
            if (page.isEmpty()) break;
            for (ErpOrder o : page) {
                erp.send(o);
                repo.markExported(o.id());
                count++;
                lastId = o.id();
            }
        }
        return count;
    }
}`,
  hints: [
    'Nhìn log: trang offset=100 trả về id 201..300 — id 101..200 đi đâu?',
    'Sau khi xử lý trang đầu, 100 đơn đó không còn PENDING nữa, nên tập "PENDING" co lại. OFFSET 100 trên tập đã co sẽ nhảy qua 100 đơn chưa xử lý.',
    'Dùng keyset pagination: nhớ id cuối cùng đã xử lý và lấy trang tiếp theo bằng findPendingAfter(lastId, limit).',
  ],
  rootCause: `**Phân trang OFFSET trên một tập dữ liệu đang bị chính job thay đổi.** Query lọc {{status = 'PENDING'}}. Sau khi xử lý trang đầu (id 1..100), các đơn đó thành EXPORTED và **rời khỏi** tập kết quả. Trang tiếp theo dùng {{OFFSET 100}} trên tập đã co lại → bỏ qua 100 đơn đầu của tập mới (id 101..200) và lấy id 201..300. Lặp lại, job chỉ xử lý mỗi trang **cách một trang**, đúng một nửa; log chứng minh: offset=100 → ids 201..300. Chạy lại thì lại bỏ một nửa số còn lại — nên "chạy 5 lần" chỉ che triệu chứng.`,
  fix: `### Cách sửa
**Keyset pagination**: nhớ {{lastId}} của bản ghi cuối và lấy {{WHERE id > :lastId ORDER BY id LIMIT :n}}. Vị trí trang không phụ thuộc số bản ghi đã rời khỏi tập, nên không bỏ sót và không trùng. Bonus: keyset dùng index nên trang sau **nhanh như trang đầu**, còn OFFSET 1.000.000 buộc DB đọc rồi bỏ một triệu dòng.

Một cách khác đúng trong trường hợp này: luôn lấy **OFFSET 0** (vì dòng đã xử lý tự rời tập) — nhưng nếu một đơn gửi lỗi và vẫn PENDING thì job lặp vô hạn ở đơn đó; keyset an toàn hơn.

### Trên production thật
- Commit theo lô (mỗi trang một transaction) để job dừng giữa chừng vẫn chạy lại được.
- ERP phải nhận **idempotent** (gửi kèm orderId làm khoá) vì job có thể gửi xong mà chưa kịp đánh dấu.
- Spring Batch: {{JdbcPagingItemReader}} dùng keyset theo sort key; {{JpaPagingItemReader}} dùng OFFSET nên dính đúng lỗi này khi processor sửa dữ liệu thuộc điều kiện lọc.

### Phòng ngừa
- Job luôn log và kiểm tra **bất biến**: số đã gửi + số còn lại = số ban đầu; lệch thì cảnh báo.
- Đối soát tổng giữa hai hệ thống hằng ngày.

### Liên hệ phỏng vấn
"OFFSET pagination có vấn đề gì?" — nêu hai ý: chậm dần với offset lớn, và **sai** (bỏ sót/trùng) khi dữ liệu thay đổi trong lúc phân trang; giải pháp keyset/cursor.`,
  related: ['scenario-097'],
  tags: ['pagination', 'keyset', 'batch job', 'SQL']
},
{
  id: 'bug-009',
  title: 'Thanh toán bị từ chối nhưng tồn kho vẫn bị trừ',
  domain: 'Thương mại điện tử / Đặt hàng',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Service đặt hàng (Spring Boot 3, Spring Data JPA, PostgreSQL). Method {{reserveAndCharge}} trừ tồn kho, tạo đơn và gọi cổng thanh toán; nó được đánh dấu {{@Transactional}} để nếu thanh toán lỗi thì mọi thứ rollback. Controller gọi {{placeOrder}}, method này kiểm tra input rồi gọi {{reserveAndCharge}}.

**Sự cố:** Sau đợt flash sale, kho báo lệch: hệ thống ghi còn 1.240 sản phẩm nhưng kiểm kê thực tế còn 1.613. Đối soát cho thấy 373 sản phẩm bị trừ kho từ **đúng những đơn bị cổng thanh toán từ chối** (thẻ hết hạn, không đủ số dư). Các đơn đó vẫn nằm trong bảng {{orders}} ở trạng thái "chờ thanh toán", và khách không mua lại được vì sản phẩm hiển thị "hết hàng".

**Nhiệm vụ của bạn:** Code đã có {{@Tx}} (mô phỏng {{@Transactional}}) và một proxy mô phỏng cơ chế AOP của Spring. Tìm vì sao rollback không xảy ra và sửa phần "Code cần sửa".`,
  artifacts: [
    { name: 'order-service.log', lang: 'text', content: `# logging.level.org.springframework.transaction.interceptor=TRACE
20:14:03.118 TRACE TransactionInterceptor : Don't need to create transaction for [com.shop.order.OrderServiceImpl.placeOrder]: This method isn't transactional.
20:14:03.121 DEBUG SQL : update inventory set quantity=? where sku=?
20:14:03.124 DEBUG SQL : insert into orders (customer_id,sku,qty,status,id) values (?,?,?,?,?)
20:14:03.612 WARN  PaymentClient : charge declined customer=C-88213 amount=300000 reason=CARD_EXPIRED
20:14:03.613 ERROR OrderController : place order failed : com.shop.payment.PaymentDeclinedException: CARD_EXPIRED
20:14:03.613 INFO  OrderController : response 402 Payment Required orderRef=null
# Không có dòng "Creating new transaction" và không có dòng "Rolling back" nào trong toàn bộ log ngày 07/11.` },
    { name: 'OrderController.java', lang: 'java', content: `@PostMapping("/orders")
public ResponseEntity<OrderResponse> place(@RequestBody PlaceOrderRequest req) {
    // orderService là bean được Spring inject, thực chất là proxy
    String id = orderService.placeOrder(req.customerId(), req.sku(), req.qty());
    return ResponseEntity.status(201).body(new OrderResponse(id));
}` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng Spring AOP + transaction, KHÔNG cần sửa) =====
@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@interface Tx {}   // mô phỏng @Transactional

class PaymentDeclinedException extends RuntimeException {
    PaymentDeclinedException(String m) { super(m); }
}

interface PaymentGateway { void charge(String customer, long amount); }

class Db {   // mô phỏng database: tồn kho + bảng orders
    Map<String, Integer> stock = new HashMap<>();
    List<String> orders = new ArrayList<>();
}

class TxManager {   // REQUIRED: đang có transaction thì tham gia, chưa có thì mở mới
    private final Db db;
    private Map<String, Integer> stockSnapshot;
    private List<String> ordersSnapshot;
    private int depth = 0;
    int physicalBegins = 0;
    TxManager(Db db) { this.db = db; }
    void begin() {
        if (depth++ > 0) return;
        physicalBegins++;
        stockSnapshot = new HashMap<>(db.stock);
        ordersSnapshot = new ArrayList<>(db.orders);
    }
    void commit() { depth--; }
    void rollback() {
        if (--depth > 0) return;
        db.stock = stockSnapshot;
        db.orders = ordersSnapshot;
    }
}

class TxProxy {   // giống proxy Spring tạo cho bean có @Transactional
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface, TxManager tx) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (p, m, args) -> {
            boolean transactional = target.getClass().getMethod(m.getName(), m.getParameterTypes()).isAnnotationPresent(Tx.class);
            if (!transactional) return invoke(m, target, args);
            tx.begin();
            try {
                Object r = invoke(m, target, args);
                tx.commit();
                return r;
            } catch (RuntimeException e) {
                tx.rollback();
                throw e;
            }
        });
    }
    private static Object invoke(java.lang.reflect.Method m, Object target, Object[] args) {
        try { return m.invoke(target, args); }
        catch (java.lang.reflect.InvocationTargetException e) { throw (RuntimeException) e.getCause(); }
        catch (IllegalAccessException e) { throw new IllegalStateException(e); }
    }
}

// ===== Code cần sửa =====
interface OrderService {
    String placeOrder(String customer, String sku, int qty);
    String reserveAndCharge(String customer, String sku, int qty);
}

class OrderServiceImpl implements OrderService {
    private final Db db;
    private final PaymentGateway payment;
    OrderServiceImpl(Db db, PaymentGateway payment) { this.db = db; this.payment = payment; }

    public String placeOrder(String customer, String sku, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be > 0");
        return reserveAndCharge(customer, sku, qty);
    }

    @Tx
    public String reserveAndCharge(String customer, String sku, int qty) {
        int left = db.stock.getOrDefault(sku, 0);
        if (left < qty) throw new IllegalStateException("out of stock: " + sku);
        db.stock.put(sku, left - qty);                  // trừ kho
        String id = "ORD-" + (db.orders.size() + 1);
        db.orders.add(id);                              // tạo đơn
        payment.charge(customer, qty * 100_000L);       // có thể ném PaymentDeclinedException
        return id;
    }
}

class OrderModule {   // nơi "Spring" tạo bean: controller nhận về proxy
    static OrderService create(Db db, TxManager tx, PaymentGateway payment) {
        return TxProxy.wrap(new OrderServiceImpl(db, payment), OrderService.class, tx);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Db db = new Db();
        db.stock.put("SKU-1", 10);
        TxManager tx = new TxManager(db);
        PaymentGateway pg = (customer, amount) -> {
            if (customer.startsWith("DECLINED")) throw new PaymentDeclinedException("CARD_EXPIRED " + customer);
        };
        OrderService svc = OrderModule.create(db, tx, pg);

        String id = svc.placeOrder("C-1", "SKU-1", 2);
        check("thanh_toan_thanh_cong", id != null && db.stock.get("SKU-1") == 8 && db.orders.size() == 1,
            "đơn hợp lệ phải trừ kho còn 8 và có 1 đơn, thực tế kho=" + db.stock.get("SKU-1") + " đơn=" + db.orders);

        int beginsBefore = tx.physicalBegins;
        svc.placeOrder("C-2", "SKU-1", 1);
        check("moi_don_chay_trong_mot_transaction", tx.physicalBegins - beginsBefore == 1,
            "mỗi lần placeOrder phải mở đúng 1 transaction, thực tế mở " + (tx.physicalBegins - beginsBefore));

        RuntimeException err = null;
        try { svc.placeOrder("DECLINED-88213", "SKU-1", 3); } catch (RuntimeException e) { err = e; }
        check("thanh_toan_loi_khong_tru_kho", db.stock.get("SKU-1") == 7 && db.orders.size() == 2,
            "thanh toán bị từ chối phải rollback: kho phải còn 7 và 2 đơn, thực tế kho=" + db.stock.get("SKU-1") + " đơn=" + db.orders);
        check("loi_thanh_toan_duoc_nem_ra", err instanceof PaymentDeclinedException,
            "controller phải nhận PaymentDeclinedException để trả 402, thực tế " + err);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@interface Tx {}

class PaymentDeclinedException extends RuntimeException {
    PaymentDeclinedException(String m) { super(m); }
}

interface PaymentGateway { void charge(String customer, long amount); }

class Db {
    Map<String, Integer> stock = new HashMap<>();
    List<String> orders = new ArrayList<>();
}

class TxManager {
    private final Db db;
    private Map<String, Integer> stockSnapshot;
    private List<String> ordersSnapshot;
    private int depth = 0;
    int physicalBegins = 0;
    TxManager(Db db) { this.db = db; }
    void begin() {
        if (depth++ > 0) return;
        physicalBegins++;
        stockSnapshot = new HashMap<>(db.stock);
        ordersSnapshot = new ArrayList<>(db.orders);
    }
    void commit() { depth--; }
    void rollback() {
        if (--depth > 0) return;
        db.stock = stockSnapshot;
        db.orders = ordersSnapshot;
    }
}

class TxProxy {
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface, TxManager tx) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (p, m, args) -> {
            boolean transactional = target.getClass().getMethod(m.getName(), m.getParameterTypes()).isAnnotationPresent(Tx.class);
            if (!transactional) return invoke(m, target, args);
            tx.begin();
            try {
                Object r = invoke(m, target, args);
                tx.commit();
                return r;
            } catch (RuntimeException e) {
                tx.rollback();
                throw e;
            }
        });
    }
    private static Object invoke(java.lang.reflect.Method m, Object target, Object[] args) {
        try { return m.invoke(target, args); }
        catch (java.lang.reflect.InvocationTargetException e) { throw (RuntimeException) e.getCause(); }
        catch (IllegalAccessException e) { throw new IllegalStateException(e); }
    }
}

// Sửa: đặt @Tx lên chính method mà controller gọi (đi qua proxy).
// reserveAndCharge thành private: không còn là "cửa" public mà gọi vào sẽ tưởng có transaction.
interface OrderService {
    String placeOrder(String customer, String sku, int qty);
}

class OrderServiceImpl implements OrderService {
    private final Db db;
    private final PaymentGateway payment;
    OrderServiceImpl(Db db, PaymentGateway payment) { this.db = db; this.payment = payment; }

    @Tx
    public String placeOrder(String customer, String sku, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be > 0");
        return reserveAndCharge(customer, sku, qty);   // gọi nội bộ, nhưng đã nằm TRONG transaction của placeOrder
    }

    private String reserveAndCharge(String customer, String sku, int qty) {
        int left = db.stock.getOrDefault(sku, 0);
        if (left < qty) throw new IllegalStateException("out of stock: " + sku);
        db.stock.put(sku, left - qty);
        String id = "ORD-" + (db.orders.size() + 1);
        db.orders.add(id);
        payment.charge(customer, qty * 100_000L);
        return id;
    }
}

class OrderModule {
    static OrderService create(Db db, TxManager tx, PaymentGateway payment) {
        return TxProxy.wrap(new OrderServiceImpl(db, payment), OrderService.class, tx);
    }
}`,
  hints: [
    'Log có dòng "Don\'t need to create transaction for [...placeOrder]" và không có dòng "Creating new transaction" nào. Vậy reserveAndCharge có thật sự chạy qua proxy không?',
    'Proxy chỉ chặn được lời gọi đi VÀO từ bên ngoài (controller → proxy → bean). Bên trong placeOrder, lệnh reserveAndCharge(...) chính là this.reserveAndCharge(...): gọi thẳng trên object thật, proxy không biết.',
    'Cách sửa gọn nhất: đặt @Tx lên method public mà controller gọi (placeOrder). Cách khác: tách phần cần transaction sang một bean riêng và inject bean đó.',
  ],
  rootCause: `**Self-invocation bỏ qua proxy.** Spring áp dụng {{@Transactional}} bằng proxy: chỉ lời gọi **đi qua proxy** mới được mở transaction. Controller gọi {{placeOrder}} qua proxy, nhưng {{placeOrder}} không có annotation, nên proxy gọi thẳng vào object thật (dòng TRACE {{Don't need to create transaction for [...placeOrder]: This method isn't transactional}}). Bên trong, {{reserveAndCharge(...)}} thực chất là {{this.reserveAndCharge(...)}}: lời gọi trên chính object thật, **không đi qua proxy**, nên {{@Transactional}} trên nó không có tác dụng gì.

Hệ quả: mỗi câu SQL chạy ở chế độ auto-commit. {{update inventory}} và {{insert into orders}} đã commit **trước khi** gọi cổng thanh toán; khi thanh toán ném {{PaymentDeclinedException}} thì không còn gì để rollback. Log không có dòng "Creating new transaction" hay "Rolling back" nào, khớp với 373 sản phẩm bị trừ từ các đơn bị từ chối.`,
  fix: `### Cách sửa
Đặt transaction lên **method public mà bên ngoài gọi vào** ({{placeOrder}}), và biến phần bên trong thành method private. Lời gọi nội bộ lúc này nằm **trong** transaction đã mở bởi proxy, nên exception từ cổng thanh toán làm rollback cả việc trừ kho lẫn tạo đơn.

Các cách khác, xếp theo mức nên dùng:
| Cách | Khi nào dùng | Nhược điểm |
|---|---|---|
| {{@Transactional}} trên method public được gọi từ ngoài | Hầu hết trường hợp | Không có |
| Tách sang bean khác (ví dụ {{OrderTxWorker}}) và inject | Khi cần transaction riêng cho một phần ({{REQUIRES_NEW}}) | Thêm một class |
| {{TransactionTemplate}} | Cần ranh giới transaction rõ trong code | Code dài hơn |
| Tự inject chính mình ({{@Lazy}} self) / {{AopContext.currentProxy()}} | Chỉ khi buộc phải giữ cấu trúc cũ | Khó đọc, dễ sai |
| AspectJ weaving ({{mode = ASPECTJ}}) | Hệ thống muốn self-invocation có transaction | Cấu hình build phức tạp |

### Trên production thật
- **Không gọi API bên ngoài trong transaction dài** khi có thể: transaction giữ connection và khoá dòng {{inventory}} trong lúc chờ cổng thanh toán (có thể vài giây). Thiết kế tốt hơn: giữ chỗ tồn kho (reserve) trong transaction ngắn, gọi thanh toán, rồi xác nhận hoặc nhả chỗ ở transaction thứ hai, kèm job dọn các chỗ giữ quá hạn.
- Bật {{logging.level.org.springframework.transaction.interceptor=TRACE}} ở staging để thấy method nào thật sự có transaction.
- Viết integration test cho nhánh lỗi: thanh toán ném exception thì số lượng tồn kho phải giữ nguyên. Unit test với mock không bắt được lỗi này vì không có proxy.

### Phòng ngừa
- Quy tắc review: {{@Transactional}} trên method private, protected, hoặc method chỉ được gọi nội bộ là dấu hiệu sai. IntelliJ cảnh báo trường hợp gọi method {{@Transactional}} qua {{this}}.
- Một method {{@Transactional}} cũng không có tác dụng nếu class được tạo bằng {{new}} thay vì do Spring quản lý.

### Liên hệ phỏng vấn
"Vì sao {{@Transactional}} không hoạt động?" là câu hỏi Spring phổ biến nhất ở vòng Senior. Hãy kể đủ 4 trường hợp: self-invocation, method không public, exception là checked (mặc định không rollback), và exception bị bắt rồi nuốt bên trong method.`,
  related: ['spring-004', 'spring-028', 'spring-026'],
  tags: ['@Transactional', 'self-invocation', 'Spring AOP', 'proxy', 'rollback']
},
{
  id: 'bug-010',
  title: 'Khách chưa đăng nhập nhìn thấy lịch sử giao dịch của người khác',
  domain: 'Ngân hàng số / Mobile banking',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** API mobile banking chạy trên Tomcat (thread pool 200 thread). Một filter tự viết đọc token, tra ra userId rồi lưu vào {{UserContext}} (một {{ThreadLocal}}) để các tầng dưới lấy user hiện tại mà không phải truyền tham số. Endpoint {{/history}} trả lịch sử giao dịch của user trong context; nếu không có user thì trả 401.

**Sự cố:** Một khách hàng báo cáo: mở app khi **phiên đăng nhập đã hết hạn**, màn hình vẫn hiện lịch sử giao dịch, nhưng là của **một người khác**. Đội bảo mật tái hiện được khoảng 1 lần mỗi 150 request ẩn danh vào giờ cao điểm. Đây là sự cố lộ dữ liệu cá nhân, phải báo cáo cho bộ phận tuân thủ trong 24 giờ.

**Nhiệm vụ của bạn:** Tìm vì sao user của request trước "chảy" sang request sau và sửa {{AuthFilter}}. Test chạy các request trên **một** worker thread được tái sử dụng, giống Tomcat.`,
  artifacts: [
    { name: 'access.log', lang: 'text', content: `09:41:07.212 [http-nio-8080-exec-17] INFO  AuthFilter : token ok user=U-0451907 path=/history
09:41:07.240 [http-nio-8080-exec-17] INFO  HistoryController : history user=U-0451907 rows=20 status=200
09:41:09.003 [http-nio-8080-exec-17] WARN  AuthFilter : no/expired token path=/history ip=113.161.x.x
09:41:09.031 [http-nio-8080-exec-17] INFO  HistoryController : history user=U-0451907 rows=20 status=200
09:41:11.554 [http-nio-8080-exec-42] INFO  AuthFilter : token ok user=U-0388102 path=/history
09:41:11.570 [http-nio-8080-exec-42] ERROR HistoryController : history failed user=U-0388102 : QueryTimeoutException
09:41:12.118 [http-nio-8080-exec-42] WARN  AuthFilter : no/expired token path=/history ip=27.72.x.x
09:41:12.140 [http-nio-8080-exec-42] INFO  HistoryController : history user=U-0388102 rows=20 status=200` },
    { name: 'AuthFilter.java (bản chạy trên production)', lang: 'java', content: `@Override
protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {
    String token = req.getHeader("Authorization");
    if (token != null && tokenService.isValid(token)) {
        UserContext.set(tokenService.userOf(token));
    } else {
        log.warn("no/expired token path={}", req.getRequestURI());
    }
    chain.doFilter(req, res);
}` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Request {
    final String token, path;
    Request(String token, String path) { this.token = token; this.path = path; }
}

class UserContext {   // giống SecurityContextHolder / MDC: dữ liệu gắn với THREAD đang chạy
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();
    static void set(String userId) { CURRENT.set(userId); }
    static String get() { return CURRENT.get(); }
    static void clear() { CURRENT.remove(); }
}

class TokenService {
    static String userOf(String token) { return "U-" + token.toUpperCase(); }
}

class HistoryController {
    String handle(Request req) {
        String user = UserContext.get();
        if (user == null) return "401";
        if (req.path.equals("/history-slow")) throw new IllegalStateException("QueryTimeoutException user=" + user);
        return "history:" + user;
    }
}

// ===== Code cần sửa =====
class AuthFilter {
    private final HistoryController controller = new HistoryController();

    String doFilter(Request req) {
        if (req.token != null) {
            UserContext.set(TokenService.userOf(req.token));
        }
        return controller.handle(req);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    // Tomcat tái sử dụng thread: mọi request trong test chạy trên CÙNG một worker thread
    static final ExecutorService worker = Executors.newSingleThreadExecutor();
    static AuthFilter filter = new AuthFilter();

    static String call(String token, String path) throws Exception {
        return worker.submit(() -> {
            try { return filter.doFilter(new Request(token, path)); }
            catch (RuntimeException e) { return "500"; }
        }).get(5, TimeUnit.SECONDS);
    }

    public static void main(String[] args) throws Exception {
        String a = call("alice", "/history");
        check("co_token_thay_lich_su_cua_minh", "history:U-ALICE".equals(a), "user có token phải thấy lịch sử của mình, thực tế " + a);

        String anon = call(null, "/history");
        check("an_danh_khong_thay_du_lieu_nguoi_truoc", "401".equals(anon),
            "request không token phải nhận 401, thực tế " + anon + " (lộ dữ liệu người trước)");

        String err = call("bob", "/history-slow");
        String anon2 = call(null, "/history");
        check("sau_exception_context_van_duoc_don", "500".equals(err) && "401".equals(anon2),
            "request lỗi của bob không được để lại user cho request sau, thực tế " + err + " rồi " + anon2);

        String left = worker.submit(() -> String.valueOf(UserContext.get())).get(5, TimeUnit.SECONDS);
        check("thread_tra_ve_pool_sach_se", "null".equals(left), "sau mỗi request ThreadLocal phải trống, thực tế " + left);

        worker.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `class Request {
    final String token, path;
    Request(String token, String path) { this.token = token; this.path = path; }
}

class UserContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();
    static void set(String userId) { CURRENT.set(userId); }
    static String get() { return CURRENT.get(); }
    static void clear() { CURRENT.remove(); }
}

class TokenService {
    static String userOf(String token) { return "U-" + token.toUpperCase(); }
}

class HistoryController {
    String handle(Request req) {
        String user = UserContext.get();
        if (user == null) return "401";
        if (req.path.equals("/history-slow")) throw new IllegalStateException("QueryTimeoutException user=" + user);
        return "history:" + user;
    }
}

class AuthFilter {
    private final HistoryController controller = new HistoryController();

    String doFilter(Request req) {
        try {
            if (req.token != null) {
                UserContext.set(TokenService.userOf(req.token));
            }
            return controller.handle(req);
        } finally {
            UserContext.clear();   // luôn dọn, kể cả khi controller ném exception: thread sắp quay về pool
        }
    }
}`,
  hints: [
    'Log: cùng thread http-nio-8080-exec-17, request không token ngay sau request của U-0451907 lại trả lịch sử của U-0451907. Giá trị trong ThreadLocal sống bao lâu?',
    'ThreadLocal gắn với thread, không gắn với request. Thread của Tomcat được tái sử dụng, nên nếu không xoá thì giá trị của request trước vẫn còn ở request sau.',
    'Bọc phần xử lý trong try/finally và gọi UserContext.clear() (ThreadLocal.remove()) trong finally, để cả nhánh exception cũng được dọn.',
  ],
  rootCause: `**ThreadLocal không được dọn khi thread quay về pool.** {{UserContext}} lưu user trong {{ThreadLocal}}, tức là gắn với **thread** chứ không phải với request. Tomcat tái sử dụng 200 worker thread cho mọi request. Filter chỉ {{set}} khi có token hợp lệ và **không bao giờ gọi** {{remove()}}, nên:
- Request ẩn danh rơi vào thread vừa phục vụ U-0451907 vẫn đọc được {{U-0451907}} (log: cùng thread {{exec-17}}, dòng {{no/expired token}} rồi {{history user=U-0451907 status=200}}).
- Nhánh exception cũng để lại user ({{exec-42}}: request của U-0388102 lỗi {{QueryTimeoutException}}, request ẩn danh sau đó nhận dữ liệu của U-0388102).

Tỉ lệ "khoảng 1/150 request" phản ánh xác suất một request ẩn danh rơi vào thread đã từng phục vụ user khác mà chưa bị ghi đè.`,
  fix: `### Cách sửa
Bọc toàn bộ xử lý trong {{try/finally}} và gọi {{UserContext.clear()}} (bên trong là {{ThreadLocal.remove()}}) ở {{finally}}. Quy tắc: **ai set thì người đó remove, trong finally**. Không dùng {{set(null)}}: nó vẫn giữ entry trong map của thread.

### Trên production thật
- Dùng cơ chế có sẵn của framework thay vì tự viết: Spring Security tự dọn {{SecurityContextHolder}} sau mỗi request (qua {{SecurityContextHolderFilter}}); với log, dùng {{MDC.clear()}} hoặc {{MDC.putCloseable}} trong filter.
- Thread pool tự quản ({{ExecutorService}}, {{@Async}}) cũng có vấn đề này: context không tự truyền sang thread mới và không tự dọn. Dùng {{TaskDecorator}} để copy context vào và dọn sau khi task chạy xong.
- Ngoài lộ dữ liệu, ThreadLocal không dọn còn gây **memory leak**: object lớn (hoặc ClassLoader khi redeploy) bị giữ bởi thread sống mãi.
- Java 21: virtual thread không được pool nên ít gặp lỗi "chảy" context, nhưng hàng triệu virtual thread mỗi cái giữ một bản sao ThreadLocal thì tốn bộ nhớ. {{ScopedValue}} (preview trong 21, final trong 25) là cách thay thế có phạm vi rõ ràng.

### Phòng ngừa
- Test chạy nhiều request trên **cùng một** thread (single-thread executor) như bài này; test mỗi request một thread mới sẽ không bao giờ thấy lỗi.
- Review: mỗi {{ThreadLocal.set}} phải có {{remove}} trong {{finally}} tương ứng.

### Liên hệ phỏng vấn
Câu "ThreadLocal dùng khi nào và rủi ro gì trong thread pool?" rất hay gặp. Trả lời đủ 2 rủi ro: lộ dữ liệu giữa request (bảo mật) và memory leak, kèm cách dọn bằng try/finally và TaskDecorator.`,
  related: ['concurrency-008', 'concurrency-007'],
  tags: ['ThreadLocal', 'thread pool', 'security', 'data leak', 'context propagation']
},
{
  id: 'bug-011',
  title: 'Pod consumer bị restart, vài giao dịch nạp tiền biến mất',
  domain: 'Ví điện tử / Xử lý sự kiện Kafka',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Service {{wallet-ledger}} đọc topic {{topup-completed}} (sự kiện "nạp tiền thành công" từ cổng ngân hàng) và cộng tiền vào ví. Consumer tắt auto-commit, tự {{commitSync}} để "chủ động kiểm soát offset". Mỗi lần poll lấy tối đa 3 record.

**Sự cố:** Sau một lần Kubernetes kill pod vì vượt memory limit (OOMKilled) lúc 21:07, đối soát cuối ngày phát hiện **3 giao dịch nạp tiền** đã có trên topic (ngân hàng đã trừ tiền khách) nhưng **không có** trong sổ cái ví. Khách gọi tổng đài vì bị trừ tiền ngân hàng mà ví không tăng. Consumer lag về 0 ngay sau khi pod khởi động lại, không có lỗi nào khác.

**Nhiệm vụ của bạn:** Tìm vì sao record bị mất khi consumer chết giữa chừng và sửa {{TopupConsumer.pollAndProcess}}. Không được để giao dịch bị cộng **hai lần**.`,
  artifacts: [
    { name: 'wallet-ledger.log', lang: 'text', content: `21:07:02.114 INFO  TopupConsumer : polled 3 records partition=topup-completed-4 offsets=[18820..18822]
21:07:02.119 INFO  TopupConsumer : committed offset=18823 partition=topup-completed-4
21:07:02.131 INFO  Ledger : credited TOPUP-77120 wallet=W-5512 amount=500000
21:07:02.145 INFO  Ledger : credited TOPUP-77121 wallet=W-0931 amount=2000000
# 21:07:02.150 pod wallet-ledger-6c9f7-xk2lp OOMKilled (exit code 137)
21:07:31.882 INFO  KafkaConsumer : Setting offset for partition topup-completed-4 to the committed offset FetchPosition{offset=18823, ...}
21:07:31.990 INFO  TopupConsumer : polled 3 records partition=topup-completed-4 offsets=[18823..18825]` },
    { name: 'reconcile-2026-11-07.csv', lang: 'text', content: `topup_id,bank_status,ledger_status,partition,offset
TOPUP-77120,SUCCESS,CREDITED,4,18820
TOPUP-77121,SUCCESS,CREDITED,4,18821
TOPUP-77122,SUCCESS,MISSING,4,18822` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng Kafka + sổ cái, KHÔNG cần sửa) =====
class Broker {   // một partition: danh sách record + offset đã commit của consumer group
    final List<String> log = new ArrayList<>();
    long committed = 0;
    List<String> poll(long from, int max) {
        int start = (int) from;
        return new ArrayList<>(log.subList(start, Math.min(log.size(), start + max)));
    }
    void commitSync(long nextOffset) { committed = nextOffset; }
}

class Ledger {   // cộng tiền vào ví; failOnce mô phỏng pod chết đúng lúc xử lý record đó
    final List<String> credited = new ArrayList<>();
    final Set<String> failOnce = new HashSet<>();
    void credit(String topupId) {
        if (failOnce.remove(topupId)) throw new IllegalStateException("pod killed while processing " + topupId);
        credited.add(topupId);
    }
    boolean alreadyCredited(String topupId) { return credited.contains(topupId); }
}

// ===== Code cần sửa =====
class TopupConsumer {   // mỗi lần pod khởi động lại là một instance mới, đọc tiếp từ offset đã commit
    private final Broker broker;
    private final Ledger ledger;
    TopupConsumer(Broker broker, Ledger ledger) { this.broker = broker; this.ledger = ledger; }

    /** Trả về số record đã nhận trong lần poll này (0 = hết). */
    int pollAndProcess() {
        long from = broker.committed;
        List<String> records = broker.poll(from, 3);
        if (records.isEmpty()) return 0;
        broker.commitSync(from + records.size());     // "chủ động" commit cho chắc
        for (String topupId : records) {
            ledger.credit(topupId);
        }
        return records.size();
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    // chạy consumer cho đến khi hết record; nếu "pod chết" thì tạo consumer mới (restart) và chạy tiếp
    static void runWithRestarts(Broker b, Ledger l) {
        for (int restarts = 0; restarts < 5; restarts++) {
            TopupConsumer c = new TopupConsumer(b, l);
            try {
                while (c.pollAndProcess() > 0) { }
                return;
            } catch (IllegalStateException crash) { /* pod restart */ }
        }
    }

    public static void main(String[] args) {
        Broker b1 = new Broker(); Ledger l1 = new Ledger();
        for (int i = 1; i <= 3; i++) b1.log.add("TOPUP-" + i);
        runWithRestarts(b1, l1);
        check("xu_ly_binh_thuong", l1.credited.equals(List.of("TOPUP-1", "TOPUP-2", "TOPUP-3")) && b1.committed == 3,
            "không có sự cố: phải cộng đủ 3 giao dịch và commit offset 3, thực tế " + l1.credited + " offset=" + b1.committed);

        Broker b = new Broker(); Ledger l = new Ledger();
        for (int i = 1; i <= 7; i++) b.log.add("TOPUP-" + i);
        l.failOnce.add("TOPUP-3");
        runWithRestarts(b, l);
        List<String> missing = new ArrayList<>();
        for (String id : b.log) if (!l.credited.contains(id)) missing.add(id);
        check("pod_chet_giua_batch_khong_mat_giao_dich", missing.isEmpty(), "sau khi restart phải cộng đủ 7 giao dịch, bị mất " + missing);

        long dup = l.credited.size() - new HashSet<>(l.credited).size();
        check("khong_cong_tien_hai_lan", dup == 0, "mỗi giao dịch chỉ được cộng một lần, thực tế trùng " + dup + ": " + l.credited);

        check("offset_cuoi_cung_dung", b.committed == 7, "xử lý xong phải commit offset 7, thực tế " + b.committed);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Broker {
    final List<String> log = new ArrayList<>();
    long committed = 0;
    List<String> poll(long from, int max) {
        int start = (int) from;
        return new ArrayList<>(log.subList(start, Math.min(log.size(), start + max)));
    }
    void commitSync(long nextOffset) { committed = nextOffset; }
}

class Ledger {
    final List<String> credited = new ArrayList<>();
    final Set<String> failOnce = new HashSet<>();
    void credit(String topupId) {
        if (failOnce.remove(topupId)) throw new IllegalStateException("pod killed while processing " + topupId);
        credited.add(topupId);
    }
    boolean alreadyCredited(String topupId) { return credited.contains(topupId); }
}

class TopupConsumer {
    private final Broker broker;
    private final Ledger ledger;
    TopupConsumer(Broker broker, Ledger ledger) { this.broker = broker; this.ledger = ledger; }

    int pollAndProcess() {
        long from = broker.committed;
        List<String> records = broker.poll(from, 3);
        if (records.isEmpty()) return 0;
        for (String topupId : records) {
            // at-least-once: record có thể được giao lại sau restart, nên xử lý phải idempotent
            if (!ledger.alreadyCredited(topupId)) {
                ledger.credit(topupId);
            }
        }
        broker.commitSync(from + records.size());     // commit SAU khi đã xử lý xong cả batch
        return records.size();
    }
}`,
  hints: [
    'Log: "committed offset=18823" xuất hiện TRƯỚC khi TOPUP-77122 (offset 18822) được xử lý. Sau restart, consumer bắt đầu đọc từ đâu?',
    'Commit offset nghĩa là nói với Kafka "tôi đã xử lý xong mọi thứ trước offset này". Commit trước khi xử lý biến consumer thành at-most-once: chết giữa chừng là mất.',
    'Chuyển commitSync xuống sau vòng xử lý. Khi đó record có thể được giao lại (at-least-once), nên phải bỏ qua giao dịch đã cộng rồi (idempotent consumer).',
  ],
  rootCause: `**Commit offset trước khi xử lý (at-most-once).** Consumer gọi {{commitSync(from + records.size())}} ngay sau khi poll, tức là báo với Kafka "đã xử lý xong offset 18820..18822" khi thực tế chưa xử lý record nào. Pod bị OOMKilled sau khi cộng xong TOPUP-77120 và TOPUP-77121; khi khởi động lại, consumer đọc từ offset đã commit (dòng {{Setting offset for partition topup-completed-4 to the committed offset}} với offset 18823), nên record ở offset 18822 (TOPUP-77122) **không bao giờ được đọc lại**. File đối soát khớp đúng: 18820 và 18821 CREDITED, 18822 MISSING. Lag về 0 nên không có cảnh báo nào.`,
  fix: `### Cách sửa
1. **Xử lý trước, commit sau**: gọi {{commitSync}} sau khi cả batch đã xử lý xong. Consumer chết giữa chừng thì sau restart sẽ đọc lại từ offset cũ: không mất record (at-least-once).
2. **Consumer idempotent**: at-least-once nghĩa là record có thể được giao **lại** (TOPUP-1, TOPUP-2 trong test được đọc lại sau restart). Kiểm tra giao dịch đã được cộng chưa trước khi cộng.

### Trên production thật
- Idempotency phải nằm **trong database, cùng transaction với việc cộng tiền**: bảng {{processed_events(topup_id PRIMARY KEY)}} hoặc unique constraint trên {{ledger_entries.topup_id}}. Kiểm tra bằng {{List.contains}} trong bộ nhớ như bài tập không đủ khi có nhiều pod.
- Với Spring Kafka, dùng {{AckMode.RECORD}} hoặc {{BATCH}} (mặc định commit sau khi listener chạy xong), không tự commit trước khi xử lý.
- Nếu xử lý bất đồng bộ (đẩy record sang thread pool), auto-commit có thể commit trước khi thread xử lý xong: cùng lỗi mất dữ liệu. Chỉ commit offset của những record đã hoàn tất.
- Kafka "exactly-once" ({{transactional.id}}, {{read_committed}}) chỉ áp dụng khi kết quả được ghi lại vào Kafka. Ghi vào database thì vẫn cần at-least-once + idempotent.

| Chiến lược | Khi consumer chết | Phù hợp |
|---|---|---|
| Commit trước, xử lý sau | **Mất** record | Gần như không bao giờ (metric không quan trọng) |
| Xử lý trước, commit sau | Record bị xử lý **lại** | Mặc định, kèm idempotency |
| Lưu offset cùng transaction DB | Không mất, không trùng | Hệ thống tài chính cần chặt chẽ |

### Phòng ngừa
- Đối soát tự động hằng giờ giữa nguồn (ngân hàng) và sổ cái, không chỉ cuối ngày.
- Test chaos: kill consumer giữa batch (như bài này) phải nằm trong test tích hợp.

### Liên hệ phỏng vấn
Câu hỏi kinh điển: "at-most-once, at-least-once, exactly-once khác nhau thế nào và bạn đạt được bằng cách nào?". Trả lời bằng thứ tự commit/xử lý, và nói rõ exactly-once với side effect bên ngoài Kafka thực chất là at-least-once + idempotency.`,
  related: ['microservices-009', 'microservices-031', 'microservices-022'],
  tags: ['Kafka', 'offset commit', 'at-least-once', 'idempotency', 'data loss']
},
{
  id: 'bug-012',
  title: 'Khách nhận email xác nhận cho đơn hàng không hề tồn tại',
  domain: 'Thương mại điện tử / Event-driven',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** {{order-service}} tạo đơn trong một transaction: lưu đơn, **publish sự kiện OrderCreated**, rồi cộng điểm thưởng cho khách. {{notification-service}} nhận sự kiện, đọc đơn từ database và gửi email xác nhận.

**Sự cố:** Hai vấn đề xuất hiện cùng lúc sau khi bật tính năng điểm thưởng:
1. Khoảng 2% sự kiện bị {{notification-service}} báo {{ORDER_NOT_FOUND}} rồi bỏ qua, dù đơn có trong DB khi kiểm tra lại vài giây sau. Khách không nhận được email.
2. Tệ hơn: khách có tài khoản điểm thưởng bị khoá vẫn nhận email "Đặt hàng thành công", nhưng đơn **không tồn tại** (transaction đã rollback vì lỗi cộng điểm). Tổng đài nhận 41 cuộc gọi trong một ngày.

**Nhiệm vụ của bạn:** Sửa {{OrderService.create}} để sự kiện chỉ được phát **sau khi** transaction commit thành công. Hạ tầng mô phỏng: dữ liệu ghi trong transaction chỉ nhìn thấy được sau khi commit; {{TxManager.afterCommit}} giống {{TransactionSynchronization.afterCommit}} của Spring.`,
  artifacts: [
    { name: 'notification-service.log', lang: 'text', content: `10:22:41.517 INFO  OrderEventListener : received OrderCreated orderId=O-20261107-5531
10:22:41.523 WARN  OrderEventListener : ORDER_NOT_FOUND orderId=O-20261107-5531, skip
10:31:09.880 INFO  OrderEventListener : received OrderCreated orderId=O-20261107-6012
10:31:09.902 INFO  EmailSender : sent ORDER_CONFIRMED to=k***@gmail.com orderId=O-20261107-6012` },
    { name: 'order-service.log', lang: 'text', content: `10:22:41.509 INFO  OrderService : saved order O-20261107-5531, publishing OrderCreated
10:22:41.538 DEBUG JpaTransactionManager : Initiating transaction commit
10:31:09.874 INFO  OrderService : saved order O-20261107-6012, publishing OrderCreated
10:31:09.951 ERROR OrderService : loyalty failed customer=C-7781 : LoyaltyAccountLockedException
10:31:09.952 DEBUG JpaTransactionManager : Initiating transaction rollback` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Db {   // ghi trong transaction nằm ở "pending", chỉ thấy được sau commit
    final Map<String, String> committed = new HashMap<>();
    Map<String, String> pending = null;
    void save(String id, String customer) {
        if (pending == null) throw new IllegalStateException("no transaction");
        pending.put(id, customer);
    }
    String findCommitted(String id) { return committed.get(id); }
}

class TxManager {
    private final Db db;
    private List<Runnable> afterCommit = new ArrayList<>();
    TxManager(Db db) { this.db = db; }
    void afterCommit(Runnable r) { afterCommit.add(r); }   // chạy sau khi commit thành công
    void inTx(Runnable work) {
        db.pending = new HashMap<>();
        afterCommit = new ArrayList<>();
        try {
            work.run();
        } catch (RuntimeException e) {
            db.pending = null;                // rollback
            afterCommit.clear();
            throw e;
        }
        db.committed.putAll(db.pending);      // commit
        db.pending = null;
        List<Runnable> callbacks = afterCommit;
        afterCommit = new ArrayList<>();
        callbacks.forEach(Runnable::run);
    }
}

class EventBus {   // giao sự kiện ngay cho notification-service (như Kafka consumer nhận rất nhanh)
    final List<String> notifications = new ArrayList<>();
    private final Db db;
    EventBus(Db db) { this.db = db; }
    void publishOrderCreated(String orderId) {
        String customer = db.findCommitted(orderId);
        notifications.add(customer == null ? "ORDER_NOT_FOUND:" + orderId : "EMAIL:" + orderId + ":" + customer);
    }
}

class LoyaltyAccountLockedException extends RuntimeException {
    LoyaltyAccountLockedException(String m) { super(m); }
}

class LoyaltyService {
    final Set<String> locked = new HashSet<>();
    void addPoints(String customer, int points) {
        if (locked.contains(customer)) throw new LoyaltyAccountLockedException(customer);
    }
}

// ===== Code cần sửa =====
class OrderService {
    private final Db db; private final TxManager tx; private final EventBus bus; private final LoyaltyService loyalty;
    OrderService(Db db, TxManager tx, EventBus bus, LoyaltyService loyalty) {
        this.db = db; this.tx = tx; this.bus = bus; this.loyalty = loyalty;
    }

    void create(String orderId, String customer, int points) {
        tx.inTx(() -> {
            db.save(orderId, customer);
            bus.publishOrderCreated(orderId);
            loyalty.addPoints(customer, points);
        });
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Db db = new Db();
        TxManager tx = new TxManager(db);
        EventBus bus = new EventBus(db);
        LoyaltyService loyalty = new LoyaltyService();
        loyalty.locked.add("C-7781");
        OrderService svc = new OrderService(db, tx, bus, loyalty);

        svc.create("O-1", "C-1", 50);
        check("don_thanh_cong_gui_email", bus.notifications.contains("EMAIL:O-1:C-1"),
            "đơn commit thành công phải có email, thực tế " + bus.notifications);
        check("su_kien_doc_duoc_don", bus.notifications.stream().noneMatch(n -> n.startsWith("ORDER_NOT_FOUND")),
            "consumer không được thấy ORDER_NOT_FOUND, thực tế " + bus.notifications);

        RuntimeException err = null;
        try { svc.create("O-2", "C-7781", 30); } catch (RuntimeException e) { err = e; }
        check("rollback_khong_phat_su_kien", db.findCommitted("O-2") == null && bus.notifications.stream().noneMatch(n -> n.contains("O-2")),
            "đơn bị rollback không được có sự kiện nào, thực tế " + bus.notifications);
        check("loi_goc_duoc_nem_ra", err instanceof LoyaltyAccountLockedException, "phải ném LoyaltyAccountLockedException, thực tế " + err);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Db {
    final Map<String, String> committed = new HashMap<>();
    Map<String, String> pending = null;
    void save(String id, String customer) {
        if (pending == null) throw new IllegalStateException("no transaction");
        pending.put(id, customer);
    }
    String findCommitted(String id) { return committed.get(id); }
}

class TxManager {
    private final Db db;
    private List<Runnable> afterCommit = new ArrayList<>();
    TxManager(Db db) { this.db = db; }
    void afterCommit(Runnable r) { afterCommit.add(r); }
    void inTx(Runnable work) {
        db.pending = new HashMap<>();
        afterCommit = new ArrayList<>();
        try {
            work.run();
        } catch (RuntimeException e) {
            db.pending = null;
            afterCommit.clear();
            throw e;
        }
        db.committed.putAll(db.pending);
        db.pending = null;
        List<Runnable> callbacks = afterCommit;
        afterCommit = new ArrayList<>();
        callbacks.forEach(Runnable::run);
    }
}

class EventBus {
    final List<String> notifications = new ArrayList<>();
    private final Db db;
    EventBus(Db db) { this.db = db; }
    void publishOrderCreated(String orderId) {
        String customer = db.findCommitted(orderId);
        notifications.add(customer == null ? "ORDER_NOT_FOUND:" + orderId : "EMAIL:" + orderId + ":" + customer);
    }
}

class LoyaltyAccountLockedException extends RuntimeException {
    LoyaltyAccountLockedException(String m) { super(m); }
}

class LoyaltyService {
    final Set<String> locked = new HashSet<>();
    void addPoints(String customer, int points) {
        if (locked.contains(customer)) throw new LoyaltyAccountLockedException(customer);
    }
}

class OrderService {
    private final Db db; private final TxManager tx; private final EventBus bus; private final LoyaltyService loyalty;
    OrderService(Db db, TxManager tx, EventBus bus, LoyaltyService loyalty) {
        this.db = db; this.tx = tx; this.bus = bus; this.loyalty = loyalty;
    }

    void create(String orderId, String customer, int points) {
        tx.inTx(() -> {
            db.save(orderId, customer);
            loyalty.addPoints(customer, points);
            // chỉ phát sự kiện khi dữ liệu đã thật sự commit (giống @TransactionalEventListener(AFTER_COMMIT))
            tx.afterCommit(() -> bus.publishOrderCreated(orderId));
        });
    }
}`,
  hints: [
    'So timestamp hai file log: sự kiện của O-20261107-5531 được nhận lúc 41.517, nhưng order-service mới "Initiating transaction commit" lúc 41.538. Consumer đọc DB khi nào?',
    'Dữ liệu trong transaction chưa commit thì transaction khác không nhìn thấy (isolation). Và nếu transaction rollback, sự kiện đã gửi đi thì không thu hồi được.',
    'Đăng ký việc publish chạy sau commit: tx.afterCommit(() -> bus.publishOrderCreated(orderId)). Trong Spring là @TransactionalEventListener(phase = AFTER_COMMIT) hoặc tốt hơn là Outbox pattern.',
  ],
  rootCause: `**Phát sự kiện bên trong transaction, trước khi commit.** {{publishOrderCreated}} được gọi giữa transaction, nên:
1. **Consumer nhanh hơn commit**: notification-service nhận sự kiện lúc {{10:22:41.517}} và đọc DB lúc {{41.523}}, trong khi order-service đến {{41.538}} mới commit. Dữ liệu chưa commit thì transaction khác không thấy, nên consumer báo {{ORDER_NOT_FOUND}} và bỏ qua (khoảng 2% sự kiện, đúng những lần consumer nhanh hơn commit).
2. **Sự kiện của transaction bị rollback**: với khách C-7781, sự kiện đã đi ra ngoài lúc {{10:31:09.874}}, sau đó cộng điểm lỗi ({{LoyaltyAccountLockedException}}) làm transaction rollback lúc {{10:31:09.952}}. Email "đặt hàng thành công" đã gửi ({{EmailSender : sent ... O-20261107-6012}}) cho một đơn không tồn tại. Sự kiện đã gửi đi thì không rollback được.`,
  fix: `### Cách sửa
Chỉ phát sự kiện **sau khi commit thành công**: đăng ký callback {{afterCommit}}. Nếu transaction rollback, callback bị huỷ và không có sự kiện nào đi ra ngoài; nếu commit, consumer chắc chắn đọc được đơn.

Trong Spring Boot:
~~~java
@Transactional
public void create(CreateOrder cmd) {
    orderRepo.save(order);
    loyalty.addPoints(cmd.customerId(), cmd.points());
    events.publishEvent(new OrderCreated(order.getId()));   // sự kiện nội bộ
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
void on(OrderCreated e) { kafkaTemplate.send("order-created", e.orderId(), e); }
~~~

### Vẫn còn một lỗ hổng: dual write
{{afterCommit}} giải quyết hai triệu chứng trên, nhưng nếu pod chết **giữa** lúc commit DB và lúc gửi Kafka, sự kiện bị mất vĩnh viễn: DB có đơn, Kafka không có sự kiện. Với sự kiện quan trọng (thanh toán, tồn kho), dùng **Transactional Outbox**:
1. Trong cùng transaction, ghi đơn **và** một dòng vào bảng {{outbox}}.
2. Một relay (job poll bảng outbox, hoặc Debezium đọc WAL) gửi lên Kafka rồi đánh dấu đã gửi.
3. Relay có thể gửi trùng, nên consumer phải idempotent.

| Cách | Mất sự kiện khi crash | Sự kiện "ma" khi rollback | Độ phức tạp |
|---|---|---|---|
| Publish trong transaction | Không | **Có** | Thấp |
| afterCommit / AFTER_COMMIT | **Có** (crash sau commit) | Không | Thấp |
| Outbox | Không | Không | Trung bình |

### Phòng ngừa
- Quy tắc review: không gọi Kafka, email, HTTP bên ngoài bên trong method {{@Transactional}}.
- Consumer nhận {{ORDER_NOT_FOUND}} không nên im lặng bỏ qua: retry có backoff rồi đưa vào DLQ để còn phát hiện.

### Liên hệ phỏng vấn
"Bạn ghi DB và gửi Kafka thế nào cho nhất quán?" là câu hỏi microservices kinh điển. Trả lời theo thứ tự: vì sao publish trong transaction sai, afterCommit giải quyết được gì và còn thiếu gì, rồi Outbox + consumer idempotent.`,
  related: ['microservices-005', 'microservices-038', 'spring-016'],
  tags: ['outbox', 'dual write', 'TransactionalEventListener', 'Kafka', 'consistency']
},
{
  id: 'bug-013',
  title: 'Một mã đơn duy nhất làm worker phân luồng crash liên tục',
  domain: 'Logistics / Xử lý đơn hàng song song',
  level: 'mid',
  severity: 'P2',
  minutes: 15,
  story: `**Bối cảnh dự án:** Để xử lý đơn song song mà vẫn giữ thứ tự các sự kiện của **cùng một đơn**, service chia đơn vào 6 hàng đợi theo mã đơn: {{Math.abs(orderId.hashCode()) % 6}}. Mỗi hàng đợi có một thread xử lý tuần tự. Code chạy ổn 8 tháng và đã có unit test với vài chục mã đơn.

**Sự cố:** Sáng 07/11, hàng đợi đầu vào bắt đầu ùn: một message cứ bị xử lý lại, lỗi, rồi xử lý lại (poison message). Sau 40 phút, 12.000 đơn bị kẹt phía sau. Log báo {{IndexOutOfBoundsException: Index -2 out of bounds for length 6}} với **đúng một** mã đơn: {{ORD-67730402450}}.

**Nhiệm vụ của bạn:** Tìm vì sao chỉ số hàng đợi ra số âm dù đã dùng {{Math.abs}}, và sửa {{OrderRouter.partitionOf}}.`,
  artifacts: [
    { name: 'router.log', lang: 'text', content: `07:12:55.301 ERROR InboundListener : route failed orderId=ORD-67730402450 attempt=1
java.lang.IndexOutOfBoundsException: Index -2 out of bounds for length 6
    at com.logi.router.OrderRouter.route(OrderRouter.java:27)
    at com.logi.router.InboundListener.onMessage(InboundListener.java:41)
07:12:56.318 ERROR InboundListener : route failed orderId=ORD-67730402450 attempt=2
07:12:58.330 ERROR InboundListener : route failed orderId=ORD-67730402450 attempt=3
...
07:52:40.004 WARN  InboundListener : backlog=12043 oldest=39m45s` },
    { name: 'jshell', lang: 'text', content: `jshell> "ORD-67730402450".hashCode()
$1 ==> -2147483648

jshell> Math.abs(-2147483648)
$2 ==> -2147483648

jshell> Integer.MIN_VALUE % 6
$3 ==> -2` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Partitions {
    final List<List<String>> queues = new ArrayList<>();
    Partitions(int n) { for (int i = 0; i < n; i++) queues.add(new ArrayList<>()); }
    int size() { return queues.size(); }
}

// ===== Code cần sửa =====
class OrderRouter {
    private final Partitions partitions;
    OrderRouter(Partitions partitions) { this.partitions = partitions; }

    int partitionOf(String orderId) {
        return Math.abs(orderId.hashCode()) % partitions.size();
    }

    void route(String orderId) {
        partitions.queues.get(partitionOf(orderId)).add(orderId);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Partitions parts = new Partitions(6);
        OrderRouter r = new OrderRouter(parts);

        boolean allInRange = true; String bad = "";
        for (int i = 0; i < 20000; i++) {
            String id = "ORD-" + (1000000 + i * 7919);
            int p = r.partitionOf(id);
            if (p < 0 || p >= 6) { allInRange = false; bad = id + "->" + p; break; }
        }
        check("ma_don_thuong_nam_trong_khoang", allInRange, "partition phải trong [0, 6), sai ở " + bad);

        String poison = "ORD-67730402450";   // hashCode() == Integer.MIN_VALUE
        int p = -1; String err = null;
        try { p = r.partitionOf(poison); r.route(poison); } catch (RuntimeException e) { err = e.toString(); }
        check("ma_don_co_hash_min_value", err == null && p >= 0 && p < 6, "mã đơn có hash MIN_VALUE phải vào partition hợp lệ, thực tế p=" + p + " lỗi=" + err);

        check("cung_ma_don_cung_partition", r.partitionOf("ORD-555") == r.partitionOf("ORD-555") && r.partitionOf(poison) == r.partitionOf(poison),
            "cùng một mã đơn phải luôn vào cùng partition để giữ thứ tự");

        int[] count = new int[6];
        for (int i = 0; i < 60000; i++) { int q = r.partitionOf("ORD-" + (5000000 + i)); if (q >= 0 && q < 6) count[q]++; }
        boolean balanced = true;
        for (int c : count) if (c < 8000 || c > 12000) balanced = false;
        check("phan_bo_deu", balanced, "60.000 đơn phải chia tương đối đều cho 6 partition, thực tế " + Arrays.toString(count));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Partitions {
    final List<List<String>> queues = new ArrayList<>();
    Partitions(int n) { for (int i = 0; i < n; i++) queues.add(new ArrayList<>()); }
    int size() { return queues.size(); }
}

class OrderRouter {
    private final Partitions partitions;
    OrderRouter(Partitions partitions) { this.partitions = partitions; }

    int partitionOf(String orderId) {
        // floorMod luôn trả về giá trị trong [0, n) với n > 0, kể cả khi hashCode() là Integer.MIN_VALUE
        return Math.floorMod(orderId.hashCode(), partitions.size());
    }

    void route(String orderId) {
        partitions.queues.get(partitionOf(orderId)).add(orderId);
    }
}`,
  hints: [
    'Xem file jshell: hashCode của mã đơn này là -2147483648. Math.abs của số đó bằng bao nhiêu?',
    'int chỉ chứa được từ -2147483648 đến 2147483647. Giá trị dương 2147483648 không tồn tại, nên Math.abs(Integer.MIN_VALUE) tràn số và trả lại chính nó (số âm). Phép % trong Java giữ dấu của số bị chia.',
    'Dùng Math.floorMod(hash, n) (luôn trả về [0, n)), hoặc (hash & 0x7fffffff) % n như Kafka làm. Không dùng Math.abs(hash % n) vì phân bố lệch nhẹ và dễ đọc nhầm.',
  ],
  rootCause: `**Math.abs tràn số với Integer.MIN_VALUE.** Kiểu {{int}} chứa từ -2147483648 đến 2147483647, nên giá trị tuyệt đối của -2147483648 **không biểu diễn được**: {{Math.abs(Integer.MIN_VALUE)}} trả về chính -2147483648 (Javadoc ghi rõ điều này). Mã {{ORD-67730402450}} có {{hashCode() == -2147483648}}, và phép {{%}} trong Java giữ dấu của số bị chia, nên {{-2147483648 % 6 = -2}}, đúng chỉ số trong {{Index -2 out of bounds for length 6}}.

Xác suất một chuỗi có hash đúng bằng MIN_VALUE là khoảng 1/4,3 tỉ, nên unit test vài chục mã không bao giờ bắt được. Nhưng với hàng chục triệu đơn mỗi năm, sớm muộn sẽ gặp. Và vì listener retry vô hạn, **một** message lỗi chặn cả hàng đợi phía sau (poison message).`,
  fix: `### Cách sửa
~~~java
int partitionOf(String orderId) {
    return Math.floorMod(orderId.hashCode(), partitions.size());   // luôn trong [0, n)
}
~~~
Các cách đúng khác: {{(hash & 0x7fffffff) % n}} (xoá bit dấu; Kafka dùng cách này trong {{Utils.toPositive}}). Lưu ý: đổi công thức sẽ làm **một số đơn đổi partition**; nếu hệ thống đang chạy cần giữ thứ tự theo đơn, deploy khi hàng đợi đã rút hết hoặc chỉ áp dụng cho đơn mới.

| Biểu thức | Kết quả với MIN_VALUE, n = 6 | Ghi chú |
|---|---|---|
| {{Math.abs(h) % n}} | -2 | **Sai**, crash |
| {{Math.abs(h % n)}} | 2 | Đúng khoảng, nhưng dễ đọc nhầm |
| {{Math.floorMod(h, n)}} | 4 | Đúng, rõ ý |
| {{(h & 0x7fffffff) % n}} | 0 | Đúng, nhanh |

### Bài học lớn hơn: poison message
Bug một dòng làm kẹt 12.000 đơn vì **retry vô hạn**. Mọi consumer cần: giới hạn số lần retry, backoff, và đẩy message lỗi sang **DLQ** (dead letter queue) để hàng đợi tiếp tục chạy, kèm cảnh báo khi DLQ có message.

### Phòng ngừa
- Test biên với giá trị đặc biệt: {{Integer.MIN_VALUE}}, {{Integer.MAX_VALUE}}, 0, chuỗi rỗng. Property-based test (jqwik) sinh ngẫu nhiên hàng triệu key cũng giúp lộ lỗi kiểu này.
- SpotBugs có rule {{RV_ABSOLUTE_VALUE_OF_HASHCODE}} bắt đúng mẫu {{Math.abs(x.hashCode())}}.

### Liên hệ phỏng vấn
Câu hỏi về sharding/partition hay đi kèm "chọn partition cho key thế nào?". Nêu được bẫy {{Math.abs}}, giữ thứ tự theo key, và consistent hashing khi số partition thay đổi là điểm cộng rõ ràng.`,
  related: ['db-006', 'microservices-009'],
  tags: ['hashCode', 'integer overflow', 'partitioning', 'poison message', 'DLQ']
},
{
  id: 'bug-014',
  title: 'Pod bị OOMKilled đều đặn 2 ngày một lần',
  domain: 'Thương mại điện tử / Tìm kiếm sản phẩm',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Service tìm kiếm có một cache tự viết để giảm tải Elasticsearch: kết quả tìm kiếm được lưu trong {{HashMap}} theo chuỗi truy vấn. Cấu hình có tham số {{search.cache.max-entries=1000}}.

**Sự cố:** Heap tăng đều khoảng 1 GB mỗi ngày; cứ khoảng 2 ngày pod bị Kubernetes kill vì vượt memory limit 2 GiB (OOMKilled), mỗi lần kéo theo vài phút lỗi 503. Team đã tăng limit từ 1 lên 2 GiB, chỉ làm sự cố thưa đi. Một bản cập nhật frontend gần đây thêm tham số {{&ts=<thời gian>}} vào URL tìm kiếm để tránh cache của trình duyệt.

**Nhiệm vụ của bạn:** Sửa {{ProductSearchCache}} để cache **có giới hạn** và giữ lại những truy vấn hay dùng (LRU: bỏ phần tử lâu nhất không được dùng).`,
  artifacts: [
    { name: 'jmap-histo.txt', lang: 'text', content: `$ jcmd 1 GC.class_histogram | head -8
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:      21458103     1203772512  [B (java.base@21.0.5)
   2:      21455921      514942104  java.lang.String (java.base@21.0.5)
   3:       3576020      114432640  java.util.HashMap$Node (java.base@21.0.5)
   4:       3576018       85824432  java.util.ArrayList (java.base@21.0.5)
   5:             1       33554448  [Ljava.util.HashMap$Node; (java.base@21.0.5)` },
    { name: 'cache-metrics.txt', lang: 'text', content: `search_cache_size        3576018
search_cache_hit_ratio   0.004
sample keys: "laptop gaming&ts=1730962331123", "laptop gaming&ts=1730962334790", "tai nghe&ts=1730962335012"` },
  ],
  starter: `// ===== Code cần sửa =====
class ProductSearchCache {
    private final int maxEntries;
    private final Function<String, List<String>> loader;   // gọi Elasticsearch, tốn kém
    private final Map<String, List<String>> cache = new HashMap<>();

    ProductSearchCache(int maxEntries, Function<String, List<String>> loader) {
        this.maxEntries = maxEntries;
        this.loader = loader;
    }

    synchronized List<String> search(String query) {
        return cache.computeIfAbsent(query, loader);
    }

    synchronized int size() { return cache.size(); }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Map<String, Integer> loads = new HashMap<>();
        Function<String, List<String>> es = q -> { loads.merge(q, 1, Integer::sum); return List.of("result-for-" + q); };
        ProductSearchCache cache = new ProductSearchCache(1000, es);

        List<String> r1 = cache.search("laptop gaming");
        List<String> r2 = cache.search("laptop gaming");
        check("truy_van_lap_lai_dung_cache", r1.equals(r2) && loads.get("laptop gaming") == 1,
            "truy vấn lặp lại không được gọi Elasticsearch lần hai, thực tế gọi " + loads.get("laptop gaming") + " lần");

        for (int i = 0; i < 50000; i++) cache.search("q-" + i + "&ts=" + (1730962331123L + i));
        check("cache_co_gioi_han", cache.size() <= 1000, "cache tối đa 1000 phần tử, thực tế " + cache.size());

        ProductSearchCache lru = new ProductSearchCache(100, es);
        lru.search("iphone");
        for (int i = 0; i < 5000; i++) {
            lru.search("rare-" + i);
            if (i % 50 == 0) lru.search("iphone");   // truy vấn "nóng" được dùng thường xuyên
        }
        check("giu_lai_truy_van_hay_dung", loads.get("iphone") == 1,
            "truy vấn hay dùng phải còn trong cache (LRU), thực tế Elasticsearch bị gọi " + loads.get("iphone") + " lần");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class ProductSearchCache {
    private final Function<String, List<String>> loader;
    private final Map<String, List<String>> cache;

    ProductSearchCache(int maxEntries, Function<String, List<String>> loader) {
        this.loader = loader;
        // accessOrder = true: mỗi lần get/put đưa phần tử về cuối danh sách => phần tử đầu là "lâu nhất không dùng"
        this.cache = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, List<String>> eldest) {
                return size() > maxEntries;   // vượt giới hạn thì bỏ phần tử lâu nhất không được dùng
            }
        };
    }

    synchronized List<String> search(String query) {
        List<String> hit = cache.get(query);
        if (hit != null) return hit;
        List<String> loaded = loader.apply(query);
        cache.put(query, loaded);
        return loaded;
    }

    synchronized int size() { return cache.size(); }
}`,
  hints: [
    'Tham số maxEntries được truyền vào constructor nhưng có dòng nào dùng nó không? Và metric cho thấy cache có 3,5 triệu phần tử với hit ratio 0,4%.',
    'HashMap không bao giờ tự xoá phần tử. Mỗi key có &ts=... khác nhau nên mỗi request tạo một entry mới, sống mãi đến khi hết heap.',
    'LinkedHashMap với accessOrder = true và override removeEldestEntry (trả về size() > maxEntries) là một LRU cache gọn trong vài dòng. Chỉ giới hạn theo thứ tự chèn (FIFO) sẽ không giữ được truy vấn "nóng".',
  ],
  rootCause: `**Cache không có giới hạn và không có cơ chế loại bỏ.** {{maxEntries}} được lưu nhưng không bao giờ dùng; {{HashMap}} giữ mọi entry mãi mãi. Trước đây số truy vấn khác nhau có hạn nên lỗi không lộ. Khi frontend thêm {{&ts=...}} vào URL, **mỗi request là một key mới**: {{search_cache_size 3576018}}, hit ratio chỉ 0,004, và histogram cho thấy 3,57 triệu {{HashMap$Node}} cùng 21 triệu String/byte[] chiếm khoảng 1,7 GB. Heap tăng đến khi chạm limit 2 GiB thì pod bị kill. Tăng memory limit chỉ làm sự cố đến chậm hơn.`,
  fix: `### Cách sửa
Dùng {{LinkedHashMap}} với {{accessOrder = true}} và override {{removeEldestEntry}}: mỗi lần đọc hoặc ghi, phần tử được đưa về cuối danh sách; khi vượt {{maxEntries}}, phần tử đầu (lâu nhất không được dùng) bị loại. Test {{giu_lai_truy_van_hay_dung}} sẽ thất bại nếu chỉ giới hạn theo thứ tự chèn (FIFO), vì "iphone" được chèn sớm nhất.

Cũng phải sửa **nguyên nhân sinh key rác**: chuẩn hoá key trước khi tra cache (bỏ {{ts}}, lowercase, trim). Nếu không, cache có giới hạn vẫn đúng nhưng hit ratio gần 0, vô dụng.

### Trên production thật
Đừng tự viết cache. Dùng **Caffeine** (mặc định của Spring Cache khi có trên classpath):
~~~java
Cache<String, List<String>> cache = Caffeine.newBuilder()
    .maximumSize(10_000)                       // giới hạn số phần tử
    .expireAfterWrite(Duration.ofMinutes(5))   // dữ liệu không cũ quá 5 phút
    .recordStats()                             // hit ratio, eviction count cho Micrometer
    .build();
~~~
Caffeine dùng thuật toán W-TinyLFU, hit ratio thường tốt hơn LRU thuần, và an toàn đa luồng mà không cần {{synchronized}} toàn cục.

### Phòng ngừa
- Mọi cache trong bộ nhớ phải có **giới hạn kích thước và TTL**. {{static Map}} không giới hạn là nguồn memory leak số 1 trong Java.
- Cảnh báo khi hit ratio thấp hoặc kích thước cache tăng liên tục.
- Bật {{-XX:+HeapDumpOnOutOfMemoryError}}; với pod bị OOMKilled (bị kill trước khi JVM kịp ném OOM), đặt {{-XX:MaxRAMPercentage=75}} để JVM ném OOM và dump heap trước khi chạm limit của container.

### Liên hệ phỏng vấn
"Kể một memory leak bạn từng gặp và cách tìm ra" là câu hỏi rất hay gặp. Câu trả lời tốt: triệu chứng (heap tăng đều, OOMKilled), công cụ (class histogram, heap dump với Eclipse MAT, xem dominator tree), nguyên nhân (cache không giới hạn, key không chuẩn hoá), cách sửa và số liệu sau khi sửa.`,
  related: ['jvm-005', 'jvm-004', 'collections-005', 'collections-028'],
  tags: ['memory leak', 'cache', 'LRU', 'LinkedHashMap', 'OOMKilled']
},
{
  id: 'bug-015',
  title: 'Hai lần trừ tiền cùng lúc, số dư ví chỉ bị trừ một lần',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** Ví điện tử cho phép thanh toán QR tại cửa hàng. {{WalletService.debit}} đọc ví, kiểm tra số dư, trừ tiền rồi lưu. Entity {{Wallet}} có cột {{version}} nhưng câu UPDATE không dùng nó trong điều kiện WHERE (đội cũ bỏ {{@Version}} vì "hay bị OptimisticLockException"). Ứng dụng chạy 6 pod, mỗi pod nhiều thread.

**Sự cố:** Job đối soát đêm 05/11 báo **37 ví** có số dư lớn hơn tổng nạp trừ tổng chi, tổng lệch **18,4 triệu đồng**; vài ví còn chi vượt số dư. Tất cả đều có hai giao dịch thanh toán cách nhau dưới 50 ms (khách bấm hai lần, hoặc hai đơn từ hai thiết bị).

**Nhiệm vụ của bạn:** Tìm vì sao hai lần trừ tiền chỉ còn lại một, và sửa {{WalletService.debit}} để không mất cập nhật, không chi vượt số dư, và không retry vô hạn.`,
  artifacts: [
    { name: 'payment.log', lang: 'text', content: `21:14:07.112 [http-nio-8080-exec-14] INFO  WalletService : debit start wallet=W-88213 amount=300000 txn=T-5521
21:14:07.118 [http-nio-8080-exec-9]  INFO  WalletService : debit start wallet=W-88213 amount=200000 txn=T-5522
21:14:07.121 [http-nio-8080-exec-14] DEBUG SQL : select id,balance,version from wallet where id='W-88213'  -> balance=1000000 version=41
21:14:07.124 [http-nio-8080-exec-9]  DEBUG SQL : select id,balance,version from wallet where id='W-88213'  -> balance=1000000 version=41
21:14:07.139 [http-nio-8080-exec-9]  DEBUG SQL : update wallet set balance=800000, version=42 where id='W-88213'
21:14:07.141 [http-nio-8080-exec-9]  INFO  WalletService : debit ok wallet=W-88213 txn=T-5522 balance=800000
21:14:07.146 [http-nio-8080-exec-14] DEBUG SQL : update wallet set balance=700000, version=42 where id='W-88213'
21:14:07.148 [http-nio-8080-exec-14] INFO  WalletService : debit ok wallet=W-88213 txn=T-5521 balance=700000` },
    { name: 'reconcile-2026-11-05.txt', lang: 'text', content: `wallet     topups     payments   expected_balance  actual_balance  diff
W-88213    1,000,000    500,000           500,000         700,000  +200,000
W-10457    2,500,000  2,650,000          -150,000          50,000  +200,000   <-- chi vượt số dư
W-77302      800,000    420,000           380,000         500,000  +120,000
...
TOTAL mismatched wallets: 37   total diff: +18,400,000 VND` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Wallet {
    final String id; long balance; long version;
    Wallet(String id, long balance, long version) { this.id = id; this.balance = balance; this.version = version; }
    Wallet copy() { return new Wallet(id, balance, version); }
}

class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String msg) { super(msg); }
}

// Mô phỏng bảng wallet. load() trả về bản sao như entity JPA đọc trong một transaction.
// onLoad: test dùng để chen một giao dịch khác vào giữa lúc đọc và lúc ghi.
class WalletStore {
    private final Map<String, Wallet> rows = new HashMap<>();
    Runnable onLoad;
    int loads;
    void insert(String id, long balance) { rows.put(id, new Wallet(id, balance, 0)); }
    Wallet load(String id) {
        loads++;
        Wallet w = rows.get(id).copy();
        Runnable hook = onLoad;
        if (hook != null) hook.run();
        return w;
    }
    // update wallet set balance=?, version=version+1 where id=?
    void save(Wallet w) { Wallet cur = rows.get(w.id); cur.balance = w.balance; cur.version++; }
    // update wallet set balance=?, version=version+1 where id=? and version=?  (false nếu 0 dòng được cập nhật)
    boolean saveIfVersion(Wallet w) {
        Wallet cur = rows.get(w.id);
        if (cur.version != w.version) return false;
        cur.balance = w.balance; cur.version++;
        return true;
    }
    void touch(String id) { rows.get(id).version++; }   // một giao dịch khác vừa cập nhật ví
    long balance(String id) { return rows.get(id).balance; }
}

// ===== Code cần sửa =====
class WalletService {
    private final WalletStore store;
    WalletService(WalletStore store) { this.store = store; }

    void debit(String walletId, long amount) {
        Wallet w = store.load(walletId);
        if (w.balance < amount) throw new InsufficientFundsException("số dư không đủ: " + w.balance);
        w.balance -= amount;
        store.save(w);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        WalletStore s1 = new WalletStore(); s1.insert("W", 1_000_000);
        new WalletService(s1).debit("W", 300_000);
        check("tru_tien_binh_thuong", s1.balance("W") == 700_000, "1.000.000 - 300.000 phải còn 700.000, thực tế " + s1.balance("W"));

        // Giao dịch 200.000 chen vào giữa lúc giao dịch 300.000 đọc và ghi
        WalletStore s2 = new WalletStore(); s2.insert("W", 1_000_000);
        WalletService svc2 = new WalletService(s2);
        s2.onLoad = () -> { s2.onLoad = null; svc2.debit("W", 200_000); };
        String err2 = null;
        try { svc2.debit("W", 300_000); } catch (RuntimeException e) { err2 = e.toString(); }
        check("khong_mat_cap_nhat", err2 == null && s2.balance("W") == 500_000,
            "trừ 200.000 và 300.000 đồng thời phải còn 500.000, thực tế " + s2.balance("W") + (err2 == null ? "" : " lỗi=" + err2));

        // Số dư 500.000: giao dịch 400.000 chen vào, giao dịch 300.000 phải bị từ chối
        WalletStore s3 = new WalletStore(); s3.insert("W", 500_000);
        WalletService svc3 = new WalletService(s3);
        s3.onLoad = () -> { s3.onLoad = null; svc3.debit("W", 400_000); };
        boolean rejected = false;
        try { svc3.debit("W", 300_000); } catch (InsufficientFundsException e) { rejected = true; }
        check("khong_chi_vuot_so_du", rejected && s3.balance("W") == 100_000,
            "sau khi trừ 400.000, lệnh 300.000 phải bị từ chối và số dư còn 100.000; thực tế rejected=" + rejected + " balance=" + s3.balance("W"));

        // Ví bị cập nhật liên tục: phải dừng sau vài lần thử và báo lỗi, không ghi đè
        WalletStore s4 = new WalletStore(); s4.insert("W", 1_000_000);
        s4.onLoad = () -> s4.touch("W");
        String err4 = null;
        try { new WalletService(s4).debit("W", 100_000); } catch (InsufficientFundsException e) { err4 = "sai loại lỗi"; } catch (RuntimeException e) { err4 = "ok"; }
        check("retry_co_gioi_han", "ok".equals(err4) && s4.balance("W") == 1_000_000 && s4.loads >= 2 && s4.loads <= 5,
            "khi luôn xung đột phải thử lại 2-5 lần rồi ném lỗi, không trừ tiền; thực tế loads=" + s4.loads + " balance=" + s4.balance("W") + " err=" + err4);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Wallet {
    final String id; long balance; long version;
    Wallet(String id, long balance, long version) { this.id = id; this.balance = balance; this.version = version; }
    Wallet copy() { return new Wallet(id, balance, version); }
}

class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String msg) { super(msg); }
}

class WalletStore {
    private final Map<String, Wallet> rows = new HashMap<>();
    Runnable onLoad;
    int loads;
    void insert(String id, long balance) { rows.put(id, new Wallet(id, balance, 0)); }
    Wallet load(String id) {
        loads++;
        Wallet w = rows.get(id).copy();
        Runnable hook = onLoad;
        if (hook != null) hook.run();
        return w;
    }
    void save(Wallet w) { Wallet cur = rows.get(w.id); cur.balance = w.balance; cur.version++; }
    boolean saveIfVersion(Wallet w) {
        Wallet cur = rows.get(w.id);
        if (cur.version != w.version) return false;
        cur.balance = w.balance; cur.version++;
        return true;
    }
    void touch(String id) { rows.get(id).version++; }
    long balance(String id) { return rows.get(id).balance; }
}

class WalletService {
    static final int MAX_ATTEMPTS = 3;
    private final WalletStore store;
    WalletService(WalletStore store) { this.store = store; }

    void debit(String walletId, long amount) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            Wallet w = store.load(walletId);              // đọc lại số dư MỚI NHẤT ở mỗi lần thử
            if (w.balance < amount) throw new InsufficientFundsException("số dư không đủ: " + w.balance);
            w.balance -= amount;
            if (store.saveIfVersion(w)) return;           // where version = ? : chỉ ghi khi không ai sửa xen vào
        }
        throw new IllegalStateException("ví " + walletId + " bị cập nhật đồng thời, đã thử " + MAX_ATTEMPTS + " lần");
    }
}`,
  hints: [
    'Đọc payment.log: hai thread cùng đọc balance=1000000 version=41. Câu UPDATE thứ hai dựa trên số dư nào?',
    'UPDATE không có điều kiện "and version = 41" nên thread chậm hơn ghi đè kết quả của thread nhanh hơn: lost update kiểu read-modify-write. WalletStore đã có sẵn saveIfVersion.',
    'Dùng saveIfVersion; nếu trả về false thì ĐỌC LẠI ví (số dư mới) rồi kiểm tra số dư và trừ lại, tối đa vài lần; hết lượt thì ném lỗi chứ không ghi đè.',
  ],
  rootCause: `**Lost update do read-modify-write không có kiểm tra phiên bản.** Hai request cùng đọc ví {{W-88213}} với {{balance=1000000 version=41}} (dòng 21:14:07.121 và .124). Request T-5522 ghi {{balance=800000}}, rồi T-5521 ghi {{balance=700000}} tính từ số dư cũ 1.000.000, đè mất lần trừ 200.000. Câu UPDATE {{where id='W-88213'}} không có {{and version=41}}, nên lần ghi thứ hai vẫn thành công dù dữ liệu đã đổi.

Cùng cơ chế đó, kiểm tra số dư cũng sai: cả hai request đều thấy đủ tiền dựa trên số dư cũ, nên ví {{W-10457}} chi vượt số dư (expected -150.000). Cột {{version}} có trong bảng nhưng vô dụng vì không nằm trong điều kiện WHERE.`,
  fix: `### Cách sửa trong bài
Ghi có điều kiện phiên bản ({{saveIfVersion}}, tương đương {{update ... where id=? and version=?}}) và khi ghi thất bại thì **đọc lại** rồi tính lại, tối đa 3 lần:
~~~java
for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    Wallet w = store.load(walletId);
    if (w.balance < amount) throw new InsufficientFundsException("...");
    w.balance -= amount;
    if (store.saveIfVersion(w)) return;
}
throw new IllegalStateException("cập nhật đồng thời, hết lượt thử");
~~~
Điểm hay sai: retry mà **không đọc lại** (dùng lại đối tượng cũ) thì chỉ ghi đè chậm hơn; và retry vô hạn thì ví hot làm treo thread.

### Trên production thật (Spring + JPA)
| Cách | Khi nào dùng | Lưu ý |
|---|---|---|
| {{@Version}} + retry | Xung đột hiếm, đa số request khác ví | Bắt {{ObjectOptimisticLockingFailureException}}, retry **cả transaction** (ví dụ Spring Retry đặt bên ngoài {{@Transactional}}) |
| Update nguyên tử {{update wallet set balance = balance - :amt where id = :id and balance >= :amt}} | Trừ tiền đơn giản | Kiểm tra số dòng cập nhật = 1, không cần đọc trước; nhanh nhất |
| {{SELECT ... FOR UPDATE}} (pessimistic) | Ví hot, xung đột thường xuyên | Giữ transaction ngắn, có lock timeout |

Với ví điện tử, cách phổ biến nhất là update nguyên tử có điều kiện số dư, kèm bảng sổ cái ghi từng giao dịch với idempotency key. Đội cũ bỏ {{@Version}} vì "hay bị exception": exception đó chính là tín hiệu có xung đột thật; bỏ nó đi là đổi lỗi ồn ào lấy lỗi âm thầm mất tiền.

### Phòng ngừa
- Mọi read-modify-write trên tiền/tồn kho phải có một trong ba cơ chế trên; review code tìm mẫu "load, set, save".
- Test đồng thời có chèn giao dịch vào giữa (như {{onLoad}} trong bài), không chỉ test tuần tự.
- Job đối soát số dư với sổ cái hằng ngày, đây là thứ đã phát hiện ra bug.

### Liên hệ phỏng vấn
Câu "hai người cùng cập nhật một bản ghi" xuất hiện ở hầu hết vòng Senior. Hãy kể theo thứ tự: chỉ ra lost update, so sánh optimistic với pessimistic và update nguyên tử, rồi nói cách retry đúng (đọc lại, giới hạn lượt, retry cả transaction).`,
  related: ['jpa-004', 'scenario-008', 'scenario-119'],
  tags: ['lost update', 'optimistic locking', '@Version', 'retry', 'wallet']
},
{
  id: 'bug-016',
  title: 'Khách không được cộng điểm thưởng mà log không có lỗi nào',
  domain: 'Thương mại điện tử / Loyalty',
  level: 'mid',
  severity: 'P2',
  minutes: 15,
  story: `**Bối cảnh dự án:** Sau khi đặt đơn thành công, {{OrderService.afterOrderPlaced}} cộng điểm thưởng (1 điểm cho mỗi 1.000 đồng) bằng cách gọi loyalty-service **bất đồng bộ** với {{CompletableFuture.runAsync}}, để đơn hàng không phải chờ.

**Sự cố:** Từ 03/11, CSKH nhận hơn 400 khiếu nại "đặt đơn rồi mà không có điểm". Đối soát cho thấy khoảng **3% đơn** không được cộng điểm, tập trung vào giờ cao điểm. Log của order-service **không có một dòng lỗi nào**; dashboard của loyalty-service lại thấy p99 vượt 2 giây và có timeout.

**Nhiệm vụ của bạn:** Tìm vì sao lỗi biến mất không dấu vết, và sửa {{afterOrderPlaced}} để: lỗi được ghi log kèm mã đơn và nguyên nhân, đơn lỗi được đưa vào hàng đợi cộng lại, còn luồng đặt đơn vẫn không bị ảnh hưởng.`,
  artifacts: [
    { name: 'OrderService.java (đoạn đang chạy)', lang: 'java', content: `public void afterOrderPlaced(Order order) {
    // cộng điểm bất đồng bộ, không chặn response của API đặt đơn
    CompletableFuture.runAsync(
        () -> loyaltyClient.addPoints(order.getUserId(), order.getAmount() / 1000),
        loyaltyExecutor);
}` },
    { name: 'loyalty-service.log', lang: 'text', content: `20:31:02.411 WARN  [loyalty-http-7]  PointsController : request aborted by client after 2000ms userId=U-23871
20:31:02.906 WARN  [loyalty-http-12] PointsController : request aborted by client after 2000ms userId=U-90112
20:31:03.554 WARN  [loyalty-http-3]  PointsController : request aborted by client after 2000ms userId=U-44120
...
order-service.log 20:00-21:00: 0 dòng ERROR, 0 dòng WARN liên quan loyalty` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Log {
    final List<String> errors = new ArrayList<>();
    void error(String msg) { errors.add(msg); }
}

class LoyaltyClient {
    final Map<String, Long> points = new HashMap<>();
    final Set<String> slowUsers = new HashSet<>();     // các user mà lời gọi sẽ timeout
    void addPoints(String userId, long p) {
        if (slowUsers.contains(userId)) throw new IllegalStateException("loyalty-service timeout after 2000ms");
        points.merge(userId, p, Long::sum);
    }
}

class RetryQueue {   // bảng outbox: job định kỳ cộng điểm lại cho các đơn này
    final List<String> orderIds = new ArrayList<>();
    void add(String orderId) { orderIds.add(orderId); }
}

// ===== Code cần sửa =====
class OrderService {
    private final LoyaltyClient loyalty; private final Log log; private final RetryQueue retryQueue; private final Executor executor;
    OrderService(LoyaltyClient loyalty, Log log, RetryQueue retryQueue, Executor executor) {
        this.loyalty = loyalty; this.log = log; this.retryQueue = retryQueue; this.executor = executor;
    }

    void afterOrderPlaced(String orderId, String userId, long amount) {
        CompletableFuture.runAsync(() -> loyalty.addPoints(userId, amount / 1000), executor);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Executor direct = Runnable::run;   // chạy ngay trên thread gọi để test xác định
        LoyaltyClient loyalty = new LoyaltyClient(); Log log = new Log(); RetryQueue q = new RetryQueue();
        loyalty.slowUsers.add("U-SLOW");
        OrderService svc = new OrderService(loyalty, log, q, direct);

        svc.afterOrderPlaced("ORD-1", "U-OK", 250_000);
        check("don_binh_thuong_duoc_cong_diem", Long.valueOf(250).equals(loyalty.points.get("U-OK")) && log.errors.isEmpty() && q.orderIds.isEmpty(),
            "đơn 250.000 phải được 250 điểm, không log lỗi, không vào hàng đợi; points=" + loyalty.points + " errors=" + log.errors + " queue=" + q.orderIds);

        String thrown = null;
        try { svc.afterOrderPlaced("ORD-2", "U-SLOW", 120_000); } catch (RuntimeException e) { thrown = e.toString(); }
        check("dat_don_khong_bi_anh_huong", thrown == null, "lỗi cộng điểm không được ném ra luồng đặt đơn: " + thrown);

        boolean logged = log.errors.stream().anyMatch(m -> m.contains("ORD-2") && m.contains("timeout"));
        check("loi_duoc_ghi_log", logged, "phải log lỗi chứa mã đơn ORD-2 và nguyên nhân (timeout); log hiện có: " + log.errors);

        check("don_loi_vao_hang_doi_cong_lai", q.orderIds.equals(List.of("ORD-2")), "ORD-2 phải được đưa vào RetryQueue đúng một lần, thực tế " + q.orderIds);

        LoyaltyClient l2 = new LoyaltyClient(); Log log2 = new Log(); RetryQueue q2 = new RetryQueue();
        OrderService s2 = new OrderService(l2, log2, q2, direct);
        for (int i = 0; i < 100; i++) { String u = "U-" + i; if (i % 33 == 0) l2.slowUsers.add(u); s2.afterOrderPlaced("ORD-" + (1000 + i), u, 100_000); }
        check("nhieu_don_dem_dung", q2.orderIds.size() == 4 && log2.errors.size() == 4 && l2.points.size() == 96,
            "100 đơn, 4 đơn lỗi: phải có 4 log, 4 đơn trong hàng đợi, 96 user có điểm; thực tế log=" + log2.errors.size() + " queue=" + q2.orderIds.size() + " points=" + l2.points.size());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Log {
    final List<String> errors = new ArrayList<>();
    void error(String msg) { errors.add(msg); }
}

class LoyaltyClient {
    final Map<String, Long> points = new HashMap<>();
    final Set<String> slowUsers = new HashSet<>();
    void addPoints(String userId, long p) {
        if (slowUsers.contains(userId)) throw new IllegalStateException("loyalty-service timeout after 2000ms");
        points.merge(userId, p, Long::sum);
    }
}

class RetryQueue {
    final List<String> orderIds = new ArrayList<>();
    void add(String orderId) { orderIds.add(orderId); }
}

class OrderService {
    private final LoyaltyClient loyalty; private final Log log; private final RetryQueue retryQueue; private final Executor executor;
    OrderService(LoyaltyClient loyalty, Log log, RetryQueue retryQueue, Executor executor) {
        this.loyalty = loyalty; this.log = log; this.retryQueue = retryQueue; this.executor = executor;
    }

    void afterOrderPlaced(String orderId, String userId, long amount) {
        CompletableFuture.runAsync(() -> loyalty.addPoints(userId, amount / 1000), executor)
            .exceptionally(ex -> {
                // runAsync bọc lỗi trong CompletionException: lấy nguyên nhân gốc để log có nghĩa
                Throwable cause = (ex instanceof CompletionException && ex.getCause() != null) ? ex.getCause() : ex;
                log.error("loyalty addPoints failed orderId=" + orderId + " userId=" + userId + " cause=" + cause.getMessage());
                retryQueue.add(orderId);   // job sẽ cộng lại; loyalty-service phải idempotent theo orderId
                return null;
            });
    }
}`,
  hints: [
    'runAsync trả về một CompletableFuture. Code hiện tại làm gì với đối tượng đó? Exception ném trong task đi đâu?',
    'Exception trong task không bay ra thread gọi cũng không được in ra đâu cả: nó chỉ được lưu bên trong future (dạng CompletionException). Không ai gọi join/get hay gắn handler thì lỗi biến mất.',
    'Gắn .exceptionally(...) (hoặc .whenComplete) ngay sau runAsync: lấy getCause() của CompletionException, log kèm orderId, đưa orderId vào RetryQueue, trả về null để future hoàn tất bình thường.',
  ],
  rootCause: `**Exception bị "nuốt" trong CompletableFuture fire-and-forget.** Khi task trong {{runAsync}} ném exception, CompletableFuture **không** in stack trace và không ném ra thread nào; nó chỉ hoàn tất future ở trạng thái lỗi (bọc trong {{CompletionException}}). Code gọi {{runAsync}} rồi bỏ đi kết quả, không {{join}}, không {{exceptionally}}/{{whenComplete}}, nên lỗi timeout của loyalty-service (log phía loyalty: {{request aborted by client after 2000ms}}) không để lại dấu vết nào ở order-service: đúng như "0 dòng ERROR".

Khác với {{ExecutorService.execute}} (lỗi đi tới UncaughtExceptionHandler của thread và thường được in ra), CompletableFuture giữ lỗi cho người tiêu thụ kết quả. Không có người tiêu thụ thì không có lỗi. Giờ cao điểm loyalty chậm, khoảng 3% lời gọi timeout và số điểm đó mất vĩnh viễn.`,
  fix: `### Cách sửa trong bài
~~~java
CompletableFuture.runAsync(() -> loyalty.addPoints(userId, amount / 1000), executor)
    .exceptionally(ex -> {
        Throwable cause = ex instanceof CompletionException && ex.getCause() != null ? ex.getCause() : ex;
        log.error("loyalty addPoints failed orderId=" + orderId + " cause=" + cause.getMessage());
        retryQueue.add(orderId);
        return null;
    });
~~~
Nhớ unwrap {{CompletionException}}, nếu không log chỉ thấy tên lớp bao ngoài.

### Trên production thật
- **Đừng để việc quan trọng chạy kiểu fire-and-forget trong bộ nhớ.** Pod restart giữa chừng cũng làm mất task. Cách bền vững: ghi bản ghi "cần cộng điểm" vào **outbox** trong cùng transaction với đơn hàng, rồi job/consumer xử lý và retry; loyalty-service khử trùng theo orderId để cộng lại không bị cộng hai lần.
- Đặt timeout rõ ràng: {{orTimeout}} hoặc timeout của HTTP client, và dùng executor riêng có giới hạn queue, không dùng {{ForkJoinPool.commonPool}} cho tác vụ I/O.
- Metric đếm số lần thất bại theo loại và cảnh báo khi tăng; đây là thứ thiếu khiến sự cố kéo dài một tuần.

| Cách gắn xử lý lỗi | Đặc điểm |
|---|---|
| {{exceptionally}} | Chỉ chạy khi lỗi, trả giá trị thay thế |
| {{whenComplete}} | Chạy cả khi thành công lẫn lỗi, không đổi kết quả (lỗi vẫn truyền tiếp) |
| {{handle}} | Chạy cả hai trường hợp và trả kết quả mới |

### Phòng ngừa
- Quy ước review: mọi {{CompletableFuture}} tạo ra phải được join, trả về cho caller, hoặc có handler lỗi. Error Prone có check {{FutureReturnValueIgnored}} cảnh báo khi bỏ qua future trả về.
- Test với executor chạy đồng bộ ({{Runnable::run}}) như trong bài để kiểm tra nhánh lỗi một cách xác định.

### Liên hệ phỏng vấn
Câu hỏi "CompletableFuture xử lý exception thế nào" rất hay gặp. Nói được ba điều là đủ điểm Senior: lỗi bị giữ trong future và có thể bị nuốt; khác biệt giữa exceptionally, handle và whenComplete; và tác vụ quan trọng nên đi qua outbox chứ không chỉ chạy bất đồng bộ trong bộ nhớ.`,
  related: ['concurrency-005', 'concurrency-037', 'concurrency-042', 'microservices-022'],
  tags: ['CompletableFuture', 'exception handling', 'fire-and-forget', 'outbox', 'observability']
},
{
  id: 'bug-017',
  title: 'Ngân hàng đối tác chậm 2 phút, hệ thống của mình sập 40 phút',
  domain: 'Thanh toán / Tích hợp ngân hàng',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** payment-service (40 pod) gọi bank-adapter để tra cứu trạng thái giao dịch. Lớp {{RetryingClient}} được viết để "chống lỗi mạng": gặp lỗi thì thử lại tối đa 20 lần, mỗi lần cách nhau 50 ms. Bình thường bank-adapter nhận khoảng 1.200 request/giây.

**Sự cố:** 14:02 ngày 06/11, ngân hàng đối tác bảo trì đột xuất khoảng 2 phút, bank-adapter trả 503. Ngân hàng hoạt động lại lúc 14:04, nhưng bank-adapter vẫn quá tải và trả 503/timeout tới **14:42**. Trong thời gian đó, lượng request vào bank-adapter lên tới **24.000/giây**, gần gấp 20 lần bình thường; ngoài ra các request sai tham số (400) cũng bị gọi lại 20 lần.

**Nhiệm vụ của bạn:** Sửa {{RetryingClient.callWithRetry}}: chỉ retry lỗi tạm thời (429, 502, 503, 504), tối đa 5 lần gọi, chờ theo **exponential backoff có trần** (100, 200, 400, 800 ms, trần 1.000 ms) với **full jitter** (chờ ngẫu nhiên từ 0 tới mức trần của lần đó).`,
  artifacts: [
    { name: 'grafana-bank-adapter.txt', lang: 'text', content: `time   req/s(in)  ok/s    503/s    p99(ms)  note
14:00    1,190    1,185        5      180
14:02    6,800       40    6,760    2,000   ngân hàng bảo trì
14:03   23,900        0   23,900    2,000
14:04   24,100      310   23,790    2,000   ngân hàng hoạt động lại
14:10   23,600      420   23,180    2,000
14:30   22,800      650   22,150    2,000
14:42    3,100    2,950      150      950   tắt retry bằng feature flag
14:45    1,210    1,200       10      190` },
    { name: 'payment-service.log', lang: 'text', content: `14:03:11.050 WARN RetryingClient : status=503 attempt=1 retry in 50ms
14:03:11.101 WARN RetryingClient : status=503 attempt=2 retry in 50ms
14:03:11.152 WARN RetryingClient : status=503 attempt=3 retry in 50ms
...
14:03:12.006 WARN RetryingClient : status=503 attempt=20 giving up
14:03:12.010 WARN RetryingClient : status=400 attempt=1 retry in 50ms   (thiếu tham số bankRef)
14:03:12.061 WARN RetryingClient : status=400 attempt=2 retry in 50ms` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Response {
    final int status;
    Response(int status) { this.status = status; }
}

class FakeDownstream {   // trả lần lượt các status trong kịch bản, hết kịch bản thì lặp lại status cuối
    private final int[] script; int calls;
    FakeDownstream(int... script) { this.script = script; }
    Response call() { int s = script[Math.min(calls, script.length - 1)]; calls++; return new Response(s); }
}

class Sleeper {   // không ngủ thật, chỉ ghi lại thời gian chờ để test kiểm tra
    final List<Long> sleeps = new ArrayList<>();
    void sleep(long ms) { sleeps.add(ms); }
}

// ===== Code cần sửa =====
class RetryingClient {
    private final FakeDownstream downstream; private final Sleeper sleeper; private final Random random;
    RetryingClient(FakeDownstream downstream, Sleeper sleeper, Random random) {
        this.downstream = downstream; this.sleeper = sleeper; this.random = random;
    }

    Response callWithRetry() {
        Response r = null;
        for (int i = 0; i < 20; i++) {
            r = downstream.call();
            if (r.status < 400) return r;
            sleeper.sleep(50);
        }
        return r;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        FakeDownstream d1 = new FakeDownstream(503, 503, 200);
        Response r1 = new RetryingClient(d1, new Sleeper(), new Random(1)).callWithRetry();
        check("thanh_cong_sau_loi_tam_thoi", r1.status == 200 && d1.calls == 3, "503, 503, 200 phải trả 200 sau 3 lần gọi; thực tế status=" + r1.status + " calls=" + d1.calls);

        FakeDownstream d2 = new FakeDownstream(400);
        Response r2 = new RetryingClient(d2, new Sleeper(), new Random(1)).callWithRetry();
        check("khong_retry_loi_client", r2.status == 400 && d2.calls == 1, "400 là lỗi của request, gọi lại vô ích: phải gọi đúng 1 lần, thực tế " + d2.calls);

        FakeDownstream d3 = new FakeDownstream(503);
        Sleeper s3 = new Sleeper();
        Response r3 = new RetryingClient(d3, s3, new Random(1)).callWithRetry();
        check("gioi_han_so_lan_goi", r3.status == 503 && d3.calls == 5 && s3.sleeps.size() == 4,
            "lỗi liên tục phải dừng sau 5 lần gọi (4 lần chờ); thực tế calls=" + d3.calls + " sleeps=" + s3.sleeps.size());

        Random shared = new Random(42);
        long[] bound = {100, 200, 400, 800};
        boolean inBound = true; long maxLast = 0; Set<Long> firstDelays = new HashSet<>(); String bad = "";
        for (int c = 0; c < 500; c++) {
            Sleeper s = new Sleeper();
            new RetryingClient(new FakeDownstream(503), s, shared).callWithRetry();
            for (int i = 0; i < s.sleeps.size() && i < 4; i++) {
                long v = s.sleeps.get(i);
                if (v < 0 || v > bound[i]) { inBound = false; bad = "lần chờ " + (i + 1) + " = " + v + "ms > " + bound[i]; }
            }
            if (s.sleeps.size() >= 4) maxLast = Math.max(maxLast, s.sleeps.get(3));
            if (!s.sleeps.isEmpty()) firstDelays.add(s.sleeps.get(0));
        }
        check("backoff_tang_dan_co_tran", inBound && maxLast > 400,
            "lần chờ thứ i phải trong [0, min(1000, 100*2^(i-1))] và lần thứ 4 phải có lúc vượt 400ms; " + (inBound ? "max lần 4 = " + maxLast : bad));
        check("jitter_tan_deu", firstDelays.size() > 50,
            "500 client không được chờ cùng một khoảng (full jitter); số giá trị khác nhau của lần chờ đầu = " + firstDelays.size());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Response {
    final int status;
    Response(int status) { this.status = status; }
}

class FakeDownstream {
    private final int[] script; int calls;
    FakeDownstream(int... script) { this.script = script; }
    Response call() { int s = script[Math.min(calls, script.length - 1)]; calls++; return new Response(s); }
}

class Sleeper {
    final List<Long> sleeps = new ArrayList<>();
    void sleep(long ms) { sleeps.add(ms); }
}

class RetryingClient {
    static final int MAX_ATTEMPTS = 5;
    static final long BASE_MS = 100, CAP_MS = 1000;
    private final FakeDownstream downstream; private final Sleeper sleeper; private final Random random;
    RetryingClient(FakeDownstream downstream, Sleeper sleeper, Random random) {
        this.downstream = downstream; this.sleeper = sleeper; this.random = random;
    }

    static boolean retryable(int status) {
        return status == 429 || status == 502 || status == 503 || status == 504;   // lỗi tạm thời
    }

    Response callWithRetry() {
        Response r = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            r = downstream.call();
            if (!retryable(r.status)) return r;        // thành công hoặc lỗi vĩnh viễn (400, 404...): không gọi lại
            if (attempt == MAX_ATTEMPTS) break;
            long ceiling = Math.min(CAP_MS, BASE_MS << (attempt - 1));   // 100, 200, 400, 800, trần 1000
            sleeper.sleep((long) random.nextInt((int) ceiling + 1));    // full jitter: ngẫu nhiên trong [0, ceiling]
        }
        return r;
    }
}`,
  hints: [
    'Tính thử: 40 pod, mỗi request thất bại được gọi tới 20 lần trong khoảng 1 giây. Lượng tải vào bank-adapter khi nó đang yếu tăng bao nhiêu lần? Grafana cho thấy gì?',
    'Ba lỗi cùng lúc: retry cả lỗi 400 (gọi lại không bao giờ thành công), quá nhiều lần thử, và khoảng chờ cố định 50 ms nên mọi client gọi lại đồng loạt (thundering herd). Cần phân loại lỗi, giới hạn số lần, và chờ tăng dần có ngẫu nhiên.',
    'Mức trần lần thứ n = min(1000, 100 * 2^(n-1)); thời gian chờ = random.nextInt(mức trần + 1). Chỉ retry 429/502/503/504, tối đa 5 lần gọi, không chờ sau lần gọi cuối.',
  ],
  rootCause: `**Retry storm: retry dồn dập khuếch đại một sự cố ngắn thành sự cố dài.** Mỗi request thất bại được gọi lại tới 20 lần, cách nhau cố định 50 ms, từ 40 pod. Khi ngân hàng bảo trì, tải vào bank-adapter tăng từ 1.190 lên khoảng 24.000 request/giây (bảng Grafana 14:03), gần đúng 20 lần. Khi ngân hàng hoạt động lại lúc 14:04, bank-adapter vẫn chìm trong hàng đợi request retry nên tiếp tục timeout, sinh thêm retry: một vòng lặp tự duy trì (metastable failure). Chỉ khi tắt retry lúc 14:42, tải mới về 3.100 và hệ thống hồi phục trong 3 phút.

Thêm hai lỗi nhỏ hơn: retry cả **400** (log 14:03:12.010, thiếu tham số bankRef), là lỗi không bao giờ tự hết; và khoảng chờ **cố định**, khiến hàng nghìn client gọi lại cùng một nhịp thay vì trải đều.`,
  fix: `### Cách sửa trong bài
- **Phân loại lỗi:** chỉ retry 429, 502, 503, 504 (và timeout/mất kết nối ở đời thật). 4xx còn lại trả ngay.
- **Giới hạn:** tối đa 5 lần gọi, không chờ sau lần cuối.
- **Exponential backoff có trần + full jitter:** lần chờ thứ n ngẫu nhiên trong [0, min(1000, 100 × 2^(n-1))] ms. Theo phân tích nổi tiếng của AWS Architecture Blog ("Exponential Backoff And Jitter"), full jitter giảm mạnh số lần gọi dồn dập so với backoff không jitter.

### Trên production thật
| Lớp phòng vệ | Tác dụng |
|---|---|
| Backoff + jitter, giới hạn lần thử | Giảm hệ số khuếch đại tải |
| **Retry budget** (ví dụ retry không quá 10% số request thành công) | Khi lỗi diện rộng, tự ngừng retry thay vì nhân tải |
| **Circuit breaker** (Resilience4j) | Downstream lỗi liên tục thì mở mạch, trả lỗi nhanh, thử lại sau thời gian chờ |
| Tôn trọng header Retry-After của 429/503 | Downstream tự nói khi nào nên quay lại |
| Chỉ retry ở **một tầng** | Gateway retry 3, service retry 3, client retry 3 là 27 lần cho một request |
| Timeout ngắn hơn timeout của tầng gọi mình | Tránh giữ thread vô ích |

Với Resilience4j, cấu hình tương ứng là {{IntervalFunction.ofExponentialRandomBackoff(...)}} cho retry kết hợp CircuitBreaker; nhớ chỉ retry các thao tác **idempotent** (tra cứu thì an toàn; lệnh trừ tiền thì phải có idempotency key).

### Phòng ngừa
- Dashboard theo dõi tỉ lệ request retry trên tổng request; cảnh báo khi vượt ngưỡng.
- Có feature flag tắt retry khẩn cấp (đội này đã có, và đó là thứ cứu sự cố lúc 14:42).
- Game day: giả lập downstream trả 503 trong 2 phút và đo thời gian hồi phục.

### Liên hệ phỏng vấn
Khi được hỏi về resilience, nêu rằng retry là con dao hai lưỡi: nó sửa lỗi thoáng qua nhưng khuếch đại sự cố diện rộng. Câu trả lời Senior gồm phân loại lỗi, backoff + jitter, retry budget, circuit breaker và chỉ retry ở một tầng với thao tác idempotent.`,
  related: ['microservices-007', 'microservices-008', 'banking-004'],
  tags: ['retry storm', 'exponential backoff', 'jitter', 'circuit breaker', 'resilience']
},
{
  id: 'bug-018',
  title: 'LLM trả JSON bọc trong code fence làm 3% request chuyển tiền lỗi 500',
  domain: 'AI / LLM integration',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** payment-service (Spring Boot 3.2, 8 pod) có API {{/internal/parse-transfer}} nhận tin nhắn khách ("chuyển 500k cho tài khoản 123") rồi gọi LLM để trích ra JSON lệnh chuyển tiền gồm {{from}}, {{to}}, {{amount}}, {{currency}}. Lớp {{LlmJsonExtractor}} lấy output của model, parse bằng lớp {{Json}} tối giản (trong dự án thật là Jackson {{ObjectMapper}}), map sang {{TransferCommand}} rồi lưu.

**Sự cố:** Trong 7 ngày, 3,1% request (khoảng 1.240/40.000) trả HTTP 500. Log cho thấy model nhiều khi không trả JSON sạch: có lần bọc trong code fence json (dấu ba nháy bao quanh đoạn code), có lần thêm câu dẫn "Đây là kết quả" hoặc câu chốt "nếu cần đổi thì gửi lại y", có lần thiếu {{currency}} hoặc trả {{amount}} dạng chuỗi. Code hiện tại chỉ cắt từ dấu mở ngoặc nhọn đầu tiên tới dấu đóng cuối cùng rồi parse, nên gặp phần văn xuôi giải thích (prose) có dấu ngoặc nhọn là vỡ; thiếu field thì map ra null; sai kiểu thì ném ClassCastException; không hề thử lại.

**Nhiệm vụ của bạn:** Sửa {{LlmJsonExtractor.extract}}: tách JSON an toàn (bỏ qua prose và code fence, xử lý dấu ngoặc lồng nhau), validate schema (đủ field, đúng kiểu, {{amount}} > 0, {{currency}} hợp lệ), retry có giới hạn tối đa 3 lần kèm thông báo lỗi cụ thể cho model; hết lượt thì ném {{ExtractionFailedException}}, không bao giờ trả command rỗng.`,
  artifacts: [
    { name: 'extractor.log', lang: 'text', content: `2026-11-08 09:12:03.114 ERROR [http-nio-8080-exec-4] ParseTransferController : 500 reqId=8f2a
JsonException: có ký tự rác sau JSON tại vị trí 74
    at com.bank.parse.Json.parseObject(Json.java:41)
    at com.bank.parse.LlmJsonExtractor.extract(LlmJsonExtractor.java:31)
2026-11-08 09:12:03.402 ERROR [http-nio-8080-exec-9] ParseTransferController : 500 reqId=8f2b
java.lang.ClassCastException: class java.lang.String cannot be cast to class java.lang.Number
    at com.bank.parse.LlmJsonExtractor.extract(LlmJsonExtractor.java:33)
2026-11-08 09:12:04.887 WARN  [http-nio-8080-exec-12] LlmJsonExtractor : field currency = null (model trả thiếu field)` },
    { name: 'model-outputs.txt', lang: 'text', content: `[req 8f2a] Đây là kết quả: {"from":"A","to":"B","amount":500000,"currency":"VND"} Nếu cần đổi thì gửi lại {y}.
[req 8f2b] {"from":"A","to":"B","amount":"nhiều","currency":"VND"}
[req 8f2c] model bọc JSON trong code fence json (có dòng fence và JSON bên trong)
[req 8f2d] {"from":"A","to":"B","amount":500000}` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class JsonException extends RuntimeException {
    JsonException(String m) { super(m); }
}

class ValidationException extends RuntimeException {
    ValidationException(String m) { super(m); }
}

class ExtractionFailedException extends RuntimeException {
    ExtractionFailedException(String m) { super(m); }
}

class TransferCommand {
    final String fromAccount, toAccount, currency, note;
    final long amount;
    TransferCommand(String from, String to, long amount, String currency, String note) {
        this.fromAccount = from; this.toAccount = to; this.amount = amount; this.currency = currency; this.note = note;
    }
    public String toString() {
        return "TransferCommand{from=" + fromAccount + ", to=" + toAccount + ", amount=" + amount + ", currency=" + currency + "}";
    }
}

class FakeLlm {   // mô phỏng model: trả lần lượt các reply trong kịch bản, hết thì lặp lại reply cuối
    private final List<String> replies;
    int calls;
    FakeLlm(String... replies) { this.replies = Arrays.asList(replies); }
    String complete(String prompt) {
        int k = Math.min(calls, replies.size() - 1);
        calls++;
        return replies.get(k);
    }
}

class Json {   // parser JSON tối giản thay cho Jackson, đủ cho object phẳng
    private final String s; private int i;
    private Json(String s) { this.s = s; }

    static Map<String, Object> parseObject(String text) {
        Json p = new Json(text);
        Map<String, Object> m = p.readObject();
        p.ws();
        if (p.i != p.s.length()) throw new JsonException("có ký tự rác sau JSON tại vị trí " + p.i);
        return m;
    }

    private Map<String, Object> readObject() {
        ws(); expect('{');
        Map<String, Object> m = new LinkedHashMap<>();
        ws();
        if (peek() == '}') { i++; return m; }
        while (true) {
            ws();
            if (peek() != '"') throw new JsonException("thiếu tên field trong dấu nháy tại " + i);
            String key = readString();
            ws(); expect(':');
            Object v = readValue();
            m.put(key, v);
            ws();
            char c = peek();
            if (c == ',') { i++; continue; }
            if (c == '}') { i++; return m; }
            throw new JsonException("kỳ vọng , hoặc } tại " + i);
        }
    }

    private Object readValue() {
        ws();
        char c = peek();
        if (c == '"') return readString();
        if (c == 't') { lit("true"); return Boolean.TRUE; }
        if (c == 'f') { lit("false"); return Boolean.FALSE; }
        if (c == 'n') { lit("null"); return null; }
        int start = i;
        if (c == '-' || c == '+') i++;
        while (i < s.length() && isDigit(s.charAt(i))) i++;
        boolean decimal = false;
        if (i < s.length() && s.charAt(i) == '.') { decimal = true; i++; while (i < s.length() && isDigit(s.charAt(i))) i++; }
        if (i < s.length() && (s.charAt(i) == 'e' || s.charAt(i) == 'E')) {
            decimal = true; i++;
            if (i < s.length() && (s.charAt(i) == '+' || s.charAt(i) == '-')) i++;
            while (i < s.length() && isDigit(s.charAt(i))) i++;
        }
        if (i == start) throw new JsonException("giá trị không hợp lệ tại " + start);
        String num = s.substring(start, i);
        if (decimal) return Double.valueOf(num);
        try { return Long.valueOf(num); } catch (NumberFormatException e) { return new java.math.BigDecimal(num); }
    }

    private String readString() {
        expect('"');
        StringBuilder b = new StringBuilder();
        while (true) {
            if (i >= s.length()) throw new JsonException("chuỗi chưa đóng");
            char c = s.charAt(i++);
            if (c == '"') return b.toString();
            if (c == (char) 92) {   // ký tự backslash
                if (i >= s.length()) throw new JsonException("escape chưa hoàn chỉnh");
                char e = s.charAt(i++);
                if (e == 'n') b.append((char) 10);
                else if (e == 't') b.append((char) 9);
                else if (e == 'r') b.append((char) 13);
                else if (e == 'b') b.append((char) 8);
                else if (e == 'f') b.append((char) 12);
                else if (e == 'u') {
                    if (i + 4 > s.length()) throw new JsonException("unicode escape thiếu");
                    b.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                    i += 4;
                } else b.append(e);
            } else if (c < (char) 32) {
                throw new JsonException("ký tự điều khiển trong chuỗi");
            } else {
                b.append(c);
            }
        }
    }

    private void lit(String w) { if (!s.startsWith(w, i)) throw new JsonException("kỳ vọng " + w + " tại " + i); i += w.length(); }
    private void expect(char c) { ws(); if (peek() != c) throw new JsonException("kỳ vọng " + c + " tại " + i); i++; }
    private char peek() { return i < s.length() ? s.charAt(i) : (char) 0; }
    private void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
    private static boolean isDigit(char c) { return c >= '0' && c <= '9'; }
}

// ===== Code cần sửa =====
class LlmJsonExtractor {
    private final FakeLlm model;
    LlmJsonExtractor(FakeLlm model) { this.model = model; }

    TransferCommand extract(String instruction) {
        String raw = model.complete(instruction);
        int a = raw.indexOf('{');                 // cắt từ dấu { đầu tiên...
        int b = raw.lastIndexOf('}');             // ...tới dấu } cuối cùng
        if (a < 0 || b < a) throw new JsonException("không tìm thấy JSON");
        String json = raw.substring(a, b + 1);
        Map<String, Object> m = Json.parseObject(json);
        String from = (String) m.get("from");
        String to = (String) m.get("to");
        long amount = ((Number) m.get("amount")).longValue();   // sai kiểu -> ClassCastException
        String currency = (String) m.get("currency");
        String note = (String) m.get("note");
        return new TransferCommand(from, to, amount, currency, note);   // thiếu field -> null, không validate
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static String json(String from, String to, long amount, String currency) {
        char d = (char) 34;
        return "{" + d + "from" + d + ":" + d + from + d + ","
             + d + "to" + d + ":" + d + to + d + ","
             + d + "amount" + d + ":" + amount + ","
             + d + "currency" + d + ":" + d + currency + d + "}";
    }

    static String jsonNoCurrency(String from, String to, long amount) {
        char d = (char) 34;
        return "{" + d + "from" + d + ":" + d + from + d + ","
             + d + "to" + d + ":" + d + to + d + ","
             + d + "amount" + d + ":" + amount + "}";
    }

    static String jsonAmountString(String from, String to, String amount, String currency) {
        char d = (char) 34;
        return "{" + d + "from" + d + ":" + d + from + d + ","
             + d + "to" + d + ":" + d + to + d + ","
             + d + "amount" + d + ":" + d + amount + d + ","
             + d + "currency" + d + ":" + d + currency + d + "}";
    }

    static String jsonTrailingComma(String from, String to, long amount, String currency) {
        char d = (char) 34;
        return "{" + d + "from" + d + ":" + d + from + d + ","
             + d + "to" + d + ":" + d + to + d + ","
             + d + "amount" + d + ":" + amount + ","
             + d + "currency" + d + ":" + d + currency + d + ",}";
    }

    static void expectOk(String name, LlmJsonExtractor ex, String from, String to, long amount, String currency) {
        try {
            TransferCommand c = ex.extract("Trích xuất lệnh chuyển tiền từ tin nhắn của khách.");
            boolean ok = c != null && from.equals(c.fromAccount) && to.equals(c.toAccount)
                && c.amount == amount && currency.equals(c.currency);
            check(name, ok, "kỳ vọng from=" + from + " to=" + to + " amount=" + amount + " currency=" + currency + ", thực tế " + c);
        } catch (Throwable t) {
            check(name, false, "ném " + t.getClass().getSimpleName() + ": " + t.getMessage());
        }
    }

    public static void main(String[] args) {
        // 1. JSON bình thường
        LlmJsonExtractor e1 = new LlmJsonExtractor(new FakeLlm(json("A", "B", 500000, "VND")));
        expectOk("json_thuong", e1, "A", "B", 500000, "VND");

        // 2. Có prose trước và sau, prose lại chứa dấu ngoặc nhọn
        String prose = "Kết quả theo mẫu {from,to,amount}: " + json("A", "B", 500000, "VND") + " Nếu sai, gửi lại {y}.";
        LlmJsonExtractor e2 = new LlmJsonExtractor(new FakeLlm(prose));
        expectOk("co_chu_truoc_va_sau", e2, "A", "B", 500000, "VND");

        // 3. JSON bọc trong code fence
        String fence = String.valueOf((char) 96);
        String fenced = fence + "json" + System.lineSeparator() + json("A", "B", 250000, "VND") + System.lineSeparator() + fence;
        LlmJsonExtractor e3 = new LlmJsonExtractor(new FakeLlm(fenced));
        expectOk("json_trong_code_fence", e3, "A", "B", 250000, "VND");

        // 4. Thiếu field: phải retry rồi mới lấy được command đúng
        FakeLlm m4 = new FakeLlm(jsonNoCurrency("A", "B", 500000), json("A", "B", 500000, "VND"));
        LlmJsonExtractor e4 = new LlmJsonExtractor(m4);
        expectOk("thieu_field_roi_retry", e4, "A", "B", 500000, "VND");
        check("retry_khi_thieu_field", m4.calls == 2, "phải gọi model 2 lần (lần đầu thiếu currency), thực tế " + m4.calls);

        // 5. Sai kiểu amount: phải retry rồi mới lấy được command đúng
        FakeLlm m5 = new FakeLlm(jsonAmountString("A", "B", "nhiều", "VND"), json("A", "B", 500000, "VND"));
        LlmJsonExtractor e5 = new LlmJsonExtractor(m5);
        expectOk("sai_kieu_amount_roi_retry", e5, "A", "B", 500000, "VND");
        check("retry_khi_sai_kieu", m5.calls == 2, "phải gọi model 2 lần (lần đầu amount là chuỗi), thực tế " + m5.calls);

        // 6. Dấu phẩy thừa trước dấu đóng ngoặc
        LlmJsonExtractor e6 = new LlmJsonExtractor(new FakeLlm(jsonTrailingComma("A", "B", 500000, "VND")));
        expectOk("dau_phay_thua_truoc_ngoac", e6, "A", "B", 500000, "VND");

        // 7. Không có JSON: phải báo ExtractionFailedException sau tối đa 3 lần, không ném lỗi lạ
        FakeLlm m7 = new FakeLlm("Xin lỗi, tôi không hiểu yêu cầu.");
        LlmJsonExtractor e7 = new LlmJsonExtractor(m7);
        String err7 = null;
        try { e7.extract("Trích xuất lệnh chuyển tiền."); } catch (Throwable t) { err7 = t.getClass().getSimpleName(); }
        check("khong_co_json_bao_loi_co_gioi_han", "ExtractionFailedException".equals(err7) && m7.calls == 3,
            "phải ném ExtractionFailedException sau đúng 3 lần gọi, thực tế err=" + err7 + " calls=" + m7.calls);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class JsonException extends RuntimeException {
    JsonException(String m) { super(m); }
}

class ValidationException extends RuntimeException {
    ValidationException(String m) { super(m); }
}

class ExtractionFailedException extends RuntimeException {
    ExtractionFailedException(String m) { super(m); }
}

class TransferCommand {
    final String fromAccount, toAccount, currency, note;
    final long amount;
    TransferCommand(String from, String to, long amount, String currency, String note) {
        this.fromAccount = from; this.toAccount = to; this.amount = amount; this.currency = currency; this.note = note;
    }
    public String toString() {
        return "TransferCommand{from=" + fromAccount + ", to=" + toAccount + ", amount=" + amount + ", currency=" + currency + "}";
    }
}

class FakeLlm {
    private final List<String> replies;
    int calls;
    FakeLlm(String... replies) { this.replies = Arrays.asList(replies); }
    String complete(String prompt) {
        int k = Math.min(calls, replies.size() - 1);
        calls++;
        return replies.get(k);
    }
}

class Json {
    private final String s; private int i;
    private Json(String s) { this.s = s; }

    static Map<String, Object> parseObject(String text) {
        Json p = new Json(text);
        Map<String, Object> m = p.readObject();
        p.ws();
        if (p.i != p.s.length()) throw new JsonException("có ký tự rác sau JSON tại vị trí " + p.i);
        return m;
    }

    private Map<String, Object> readObject() {
        ws(); expect('{');
        Map<String, Object> m = new LinkedHashMap<>();
        ws();
        if (peek() == '}') { i++; return m; }
        while (true) {
            ws();
            if (peek() != '"') throw new JsonException("thiếu tên field trong dấu nháy tại " + i);
            String key = readString();
            ws(); expect(':');
            Object v = readValue();
            m.put(key, v);
            ws();
            char c = peek();
            if (c == ',') { i++; continue; }
            if (c == '}') { i++; return m; }
            throw new JsonException("kỳ vọng , hoặc } tại " + i);
        }
    }

    private Object readValue() {
        ws();
        char c = peek();
        if (c == '"') return readString();
        if (c == 't') { lit("true"); return Boolean.TRUE; }
        if (c == 'f') { lit("false"); return Boolean.FALSE; }
        if (c == 'n') { lit("null"); return null; }
        int start = i;
        if (c == '-' || c == '+') i++;
        while (i < s.length() && isDigit(s.charAt(i))) i++;
        boolean decimal = false;
        if (i < s.length() && s.charAt(i) == '.') { decimal = true; i++; while (i < s.length() && isDigit(s.charAt(i))) i++; }
        if (i < s.length() && (s.charAt(i) == 'e' || s.charAt(i) == 'E')) {
            decimal = true; i++;
            if (i < s.length() && (s.charAt(i) == '+' || s.charAt(i) == '-')) i++;
            while (i < s.length() && isDigit(s.charAt(i))) i++;
        }
        if (i == start) throw new JsonException("giá trị không hợp lệ tại " + start);
        String num = s.substring(start, i);
        if (decimal) return Double.valueOf(num);
        try { return Long.valueOf(num); } catch (NumberFormatException e) { return new java.math.BigDecimal(num); }
    }

    private String readString() {
        expect('"');
        StringBuilder b = new StringBuilder();
        while (true) {
            if (i >= s.length()) throw new JsonException("chuỗi chưa đóng");
            char c = s.charAt(i++);
            if (c == '"') return b.toString();
            if (c == (char) 92) {
                if (i >= s.length()) throw new JsonException("escape chưa hoàn chỉnh");
                char e = s.charAt(i++);
                if (e == 'n') b.append((char) 10);
                else if (e == 't') b.append((char) 9);
                else if (e == 'r') b.append((char) 13);
                else if (e == 'b') b.append((char) 8);
                else if (e == 'f') b.append((char) 12);
                else if (e == 'u') {
                    if (i + 4 > s.length()) throw new JsonException("unicode escape thiếu");
                    b.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                    i += 4;
                } else b.append(e);
            } else if (c < (char) 32) {
                throw new JsonException("ký tự điều khiển trong chuỗi");
            } else {
                b.append(c);
            }
        }
    }

    private void lit(String w) { if (!s.startsWith(w, i)) throw new JsonException("kỳ vọng " + w + " tại " + i); i += w.length(); }
    private void expect(char c) { ws(); if (peek() != c) throw new JsonException("kỳ vọng " + c + " tại " + i); i++; }
    private char peek() { return i < s.length() ? s.charAt(i) : (char) 0; }
    private void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
    private static boolean isDigit(char c) { return c >= '0' && c <= '9'; }
}

// ===== Code cần sửa =====
class LlmJsonExtractor {
    static final int MAX_ATTEMPTS = 3;
    static final Set<String> CURRENCIES = Set.of("VND", "USD", "EUR");
    private final FakeLlm model;
    LlmJsonExtractor(FakeLlm model) { this.model = model; }

    TransferCommand extract(String instruction) {
        String feedback = "";
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            // Lần đầu gửi yêu cầu gốc; các lần sau gửi kèm lý do lỗi cụ thể để model sửa
            String prompt = attempt == 1 ? instruction
                : instruction + " Lần trước bạn trả về không hợp lệ (" + feedback + "). Chỉ trả về JSON, không thêm chữ.";
            String raw = model.complete(prompt);
            try {
                Map<String, Object> m = findJsonObject(raw);   // tách JSON an toàn
                TransferCommand cmd = toCommand(m);              // validate kiểu
                validate(cmd, m);                                // validate schema/nghiệp vụ
                return cmd;
            } catch (JsonException | ValidationException e) {
                feedback = e.getMessage();   // ngược lại: thử lại với thông báo lỗi
            }
        }
        throw new ExtractionFailedException("model không trả JSON hợp lệ sau " + MAX_ATTEMPTS + " lần: " + feedback);
    }

    // Duyệt từng dấu { trong output; với mỗi vị trí, lấy object cân bằng rồi thử parse.
    // Nhờ vậy bỏ qua được prose/code fence có dấu ngoặc nhọn, và JSON lồng nhau.
    static Map<String, Object> findJsonObject(String raw) {
        JsonException last = null;
        for (int start = 0; start < raw.length(); start++) {
            if (raw.charAt(start) != '{') continue;
            String candidate = balanced(raw, start);
            if (candidate == null) continue;
            try { return Json.parseObject(stripTrailingCommas(candidate)); }
            catch (JsonException e) { last = e; }
        }
        throw new JsonException("không tìm thấy JSON object hợp lệ" + (last != null ? " (" + last.getMessage() + ")" : ""));
    }

    // Cắt object cân bằng tại start: đếm độ sâu ngoặc, có trạng thái trong/ngoài string và escape
    static String balanced(String raw, int start) {
        int depth = 0; boolean inStr = false, esc = false;
        for (int k = start; k < raw.length(); k++) {
            char c = raw.charAt(k);
            if (inStr) {
                if (esc) esc = false;
                else if (c == (char) 92) esc = true;
                else if (c == '"') inStr = false;
                continue;
            }
            if (c == '"') inStr = true;
            else if (c == '{') depth++;
            else if (c == '}') { depth--; if (depth == 0) return raw.substring(start, k + 1); }
        }
        return null;
    }

    // Bỏ dấu phẩy thừa ngay trước } (model hay thêm)
    static String stripTrailingCommas(String json) {
        StringBuilder b = new StringBuilder(json.length());
        boolean inStr = false, esc = false;
        for (int k = 0; k < json.length(); k++) {
            char c = json.charAt(k);
            if (inStr) {
                b.append(c);
                if (esc) esc = false;
                else if (c == (char) 92) esc = true;
                else if (c == '"') inStr = false;
                continue;
            }
            if (c == '"') { inStr = true; b.append(c); continue; }
            if (c == ',') {
                int j = k + 1;
                while (j < json.length() && Character.isWhitespace(json.charAt(j))) j++;
                if (j < json.length() && json.charAt(j) == '}') continue;
            }
            b.append(c);
        }
        return b.toString();
    }

    static TransferCommand toCommand(Map<String, Object> m) {
        Object amountObj = m.get("amount");
        if (!(amountObj instanceof Number)) {
            throw new ValidationException("amount phải là số, nhận " + (amountObj == null ? "null" : amountObj.getClass().getSimpleName()));
        }
        return new TransferCommand(str(m, "from"), str(m, "to"), ((Number) amountObj).longValue(), str(m, "currency"), str(m, "note"));
    }

    static String str(Map<String, Object> m, String k) {
        Object v = m.get(k);
        return v == null ? null : String.valueOf(v);
    }

    static void validate(TransferCommand c, Map<String, Object> m) {
        if (c.fromAccount == null || c.fromAccount.isEmpty()) throw new ValidationException("thiếu from");
        if (c.toAccount == null || c.toAccount.isEmpty()) throw new ValidationException("thiếu to");
        if (!m.containsKey("amount")) throw new ValidationException("thiếu amount");
        if (c.amount <= 0) throw new ValidationException("amount phải > 0, nhận " + c.amount);
        if (c.currency == null || !CURRENCIES.contains(c.currency.toUpperCase())) throw new ValidationException("currency không hỗ trợ: " + c.currency);
    }
}`,
  hints: [
    'Đọc log: có request 500 vì JsonException "có ký tự rác sau JSON", có request 500 vì ClassCastException String sang Number, và có request chỉ log "field currency = null". Ba kiểu lỗi này đến từ ba chỗ khác nhau trong cùng một hàm extract.',
    'Hàm extract đang cắt JSON bằng indexOf dấu mở ngoặc và lastIndexOf dấu đóng ngoặc. Nếu model thêm prose có dấu ngoặc nhọn sau JSON, lastIndexOf sẽ lấy dấu đóng của prose, không phải của JSON. Còn thiếu field và sai kiểu là do không validate gì cả.',
    'Cần: (1) quét chuỗi có trạng thái trong/ngoài string, đếm độ sâu ngoặc để lấy đúng object cân bằng; (2) thử lần lượt từng dấu mở ngoặc cho tới khi parse được; (3) parse rồi kiểm tra đủ field, đúng kiểu, amount > 0, currency hợp lệ; (4) lỗi thì gửi lại prompt kèm lý do, tối đa 3 lần, hết thì ném ExtractionFailedException.',
  ],
  rootCause: `**Tách JSON bằng vị trí dấu ngoặc, không hiểu cấu trúc chuỗi.** Hàm {{extract}} lấy chuỗi con từ dấu mở ngoặc nhọn đầu tiên ({{indexOf}}) tới dấu đóng ngoặc nhọn cuối cùng ({{lastIndexOf}}). Cách này đúng khi output chỉ có đúng một object JSON và không có chữ nào khác. Nhưng LLM sinh văn xuôi: nó hay thêm câu dẫn ("Đây là kết quả"), bọc code fence, hoặc thêm câu chốt có dấu ngoặc nhọn. Khi đó {{lastIndexOf}} trỏ vào dấu đóng của **prose**, không phải của JSON, và chuỗi con không còn là JSON hợp lệ — {{Json.parseObject}} ném {{JsonException}} (log req 8f2a: "có ký tự rác sau JSON tại vị trí 74").

**Không validate nên lỗi im lặng hoặc nổ muộn.** Map được object rồi, code ép kiểu ngay: {{((Number) m.get("amount")).longValue()}}. Khi model trả amount dạng chuỗi "nhiều", JVM ném {{ClassCastException}} (log req 8f2b). Khi model thiếu {{currency}}, {{m.get("currency")}} trả null và command được tạo với currency = null — không ai kiểm tra, nên downstream có thể xử lý sai (log req 8f2d). Thiếu bước kiểm tra "đủ field, đúng kiểu, amount > 0, currency hợp lệ" là lý do 3,1% request chết.

**Không có vòng retry.** Model sinh xác suất: cùng một prompt, lần này đúng lần sau sai. Một lần gọi duy nhất, hỏng là 500, trong khi chỉ cần gửi lại kèm lý do lỗi là phần lớn lần sau đúng.`,
  fix: `### Cách sửa trong bài
1. **Tách JSON an toàn.** Quét từng ký tự, giữ trạng thái "đang trong string" và "ký tự trước là escape", đếm độ sâu ngoặc. Với mỗi dấu mở ngoặc nhọn trong output, lấy object cân bằng tại đó rồi thử parse; vị trí nào parse được thì dùng. Nhờ vậy prose/code fence có dấu ngoặc nhọn không làm hỏng, và JSON lồng nhau vẫn đúng.
2. **Chuẩn hoá nhẹ.** Bỏ dấu phẩy thừa ngay trước dấu đóng ngoặc nhọn (model hay thêm), rồi mới parse.
3. **Validate schema.** {{from}}/{{to}} không rỗng; {{amount}} là số và > 0; {{currency}} nằm trong tập cho phép. Sai thì ném {{ValidationException}} kèm lý do cụ thể.
4. **Retry có giới hạn.** Tối đa 3 lần. Lần sau gửi lại prompt kèm lý do lỗi để model tự sửa. Hết lượt thì ném {{ExtractionFailedException}}, không trả command rỗng.

~~~java
for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    String raw = model.complete(attempt == 1 ? instruction : instruction + " Lỗi: " + feedback);
    try {
        Map<String, Object> m = findJsonObject(raw);   // quét object cân bằng
        TransferCommand cmd = toCommand(m);            // đúng kiểu
        validate(cmd, m);                              // đủ field, amount > 0, currency hợp lệ
        return cmd;
    } catch (JsonException | ValidationException e) {
        feedback = e.getMessage();                     // gửi lại lý do cho model
    }
}
throw new ExtractionFailedException("không parse được sau " + MAX_ATTEMPTS + " lần");
~~~

### Trên production thật
- **Ưu tiên cơ chế ép schema của nhà cung cấp** thay vì tự parse: structured output (chế độ bắt model trả JSON theo một schema cho trước) của OpenAI, tool use với input_schema của Anthropic, hoặc Spring AI {{BeanOutputConverter}} / LangChain4j AiServices. Khi model bị ràng buộc trả JSON theo schema, tỉ lệ lỗi parse giảm mạnh.
- **Vẫn validate lại phía mình.** Không tin 100% vào structured output: dùng Jackson {{ObjectMapper}} cấu hình nghiêm ngặt + Bean Validation (bộ kiểm tra bằng annotation như {{@NotBlank}}, {{@Positive}}, {{@Pattern}}) cho currency. Coi output của model là **input không tin cậy**.
- **Retry có kiểm soát:** chỉ retry lỗi parse/schema, không retry lỗi 400 của API; backoff (chờ lâu dần giữa các lần thử) nhẹ; trần 2–3 lần; ghi metric {{llm_parse_error_total}} và {{llm_retry_total}}.
- **Observability (khả năng quan sát hệ thống):** log raw output (đã che PII — thông tin cá nhân), model, prompt version, số token, lý do lỗi parse. Khi tỉ lệ lỗi tăng, so sánh theo model/version prompt để biết có phải do đổi model không.
- **Idempotency key (khoá chống lặp):** nếu parse thành công nhưng downstream timeout, dùng idempotency key để không tạo hai lệnh chuyển tiền.

### Liên hệ phỏng vấn
Nói theo 4 lớp: tách JSON an toàn (không tin indexOf/lastIndexOf), validate schema + kiểu, retry có giới hạn kèm lý do, hết lượt thì fail rõ ràng. Nhấn mạnh: output của LLM là **untrusted input**, và nên dùng structured output/tool calling của nhà cung cấp thay vì tự viết parser.

> Senior tip: đừng viết parser JSON "tự chế" cho production. Dùng structured output của nhà cung cấp + Jackson, coi mọi output là input bẩn, và đo tỉ lệ {{llm_parse_error_total}} theo model/version prompt. Trong sự cố này, chỉ cần thêm validate + retry 3 lần là 3,1% lỗi 500 giảm còn dưới 0,2%.`,
  related: ['ai-016', 'ai-056'],
  tags: ['LLM', 'JSON', 'structured output', 'validation', 'retry', 'Spring AI']
},
{
  id: 'bug-019',
  title: 'Hội thoại dài làm system prompt bị cắt, agent bỏ qua luật an toàn',
  domain: 'AI / LLM agent',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** chatbot-support (Spring Boot 3.2, LangChain4j) trả lời khách về sản phẩm ngân hàng. Mỗi lượt, service nạp lại toàn bộ lịch sử hội thoại rồi ghép với system prompt (lời dặn nền tảng mà model luôn đọc trước mọi tin nhắn, ở đây chứa luật an toàn: không cung cấp số dư, số thẻ, mã OTP; chỉ trả lời trong phạm vi ngân hàng) và gửi cho model. Cửa sổ ngữ cảnh (context window — giới hạn token mỗi lần gọi) của model là 8.000 token (token là đơn vị đếm chữ của model, xấp xỉ 4 ký tự tiếng Anh); nền tảng tự cắt bớt từ phía **cũ nhất** khi vượt hạn mức.

**Sự cố:** Tuần qua, 2,3% phiên dài (khoảng 460/20.000) bị agent trả lời sai phạm vi: có phiên khách dán cả hợp đồng 40 trang vào chat, sau đó agent bắt đầu tư vấn đầu tư chứng khoán và đọc lại số thẻ trong lịch sử. Log cho thấy nhiều request bị nền tảng cắt context ({{context_length_exceeded}}), và trong các request đó system prompt — vốn nằm ở đầu — bị cắt mất. Vì luật an toàn nằm trong system prompt, mất nó đồng nghĩa agent không còn rào chắn.

**Nhiệm vụ của bạn:** Sửa {{ChatContext.buildMessages}}: đếm token (ước lượng ~4 ký tự/token), luôn giữ system prompt trong ngân sách, cắt phần **cũ nhất** của lịch sử trước, nếu tin nhắn mới nhất quá lớn thì cắt bớt nội dung cho vừa, và nếu system prompt tự nó đã vượt hạn mức thì ném {{ContextTooLongException}} thay vì âm thầm bỏ luật.`,
  artifacts: [
    { name: 'chatbot.log', lang: 'text', content: `2026-11-10 20:14:02.117 INFO  ChatController : turn=41 sessionId=cs-77213 historyMessages=82 promptTokens=8420
2026-11-10 20:14:02.402 WARN  ContextClient : context_length_exceeded limit=8000 sent=8420 -> platform truncated 5 oldest messages
2026-11-10 20:14:03.010 WARN  ChatController : model answer contains "số tài khoản 123456789" (client asked about balance)
2026-11-10 20:31:55.884 WARN  ContextClient : context_length_exceeded limit=8000 sent=9130 -> platform truncated 9 oldest messages
2026-11-10 20:32:00.221 WARN  SafetyGuard : system prompt missing from request; safety rules not applied` },
    { name: 'context-stats.txt', lang: 'text', content: `session cs-77213 turn 41: systemPromptTokens=118 historyTokens=8302 total=8420 limit=8000
  -> platform keeps last 6 messages, drops system + 75 oldest
  -> safety rules lost, model answers out of scope
session cs-77190 turn 12: systemPromptTokens=118 historyTokens=2100 total=2218 limit=8000 (ok)` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Message {
    final String role;      // "system" | "user" | "assistant"
    final String content;
    Message(String role, String content) { this.role = role; this.content = content; }
}

class TokenCounter {
    static final int OVERHEAD = 4;   // token cho role + format của mỗi message
    static int count(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }
    static int count(Message m) { return count(m.content) + OVERHEAD; }
}

class ContextTooLongException extends RuntimeException {
    ContextTooLongException(String m) { super(m); }
}

// ===== Code cần sửa =====
class ChatContext {
    private final String systemPrompt;
    private final int tokenLimit;
    private final List<Message> history = new ArrayList<>();
    ChatContext(String systemPrompt, int tokenLimit) { this.systemPrompt = systemPrompt; this.tokenLimit = tokenLimit; }
    void add(String role, String content) { history.add(new Message(role, content)); }

    List<Message> buildMessages() {
        List<Message> out = new ArrayList<>();
        out.add(new Message("system", systemPrompt));   // system nằm đầu...
        out.addAll(history);                            // ...rồi dồn hết lịch sử, không đếm token
        return out;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        // 1. Hội thoại dài: system prompt phải luôn được giữ, tổng token không vượt limit
        ChatContext ctx1 = new ChatContext("Bạn là trợ lý ngân hàng. TUYỆT ĐỐI không cung cấp số dư, số thẻ, mã OTP.", 120);
        for (int i = 0; i < 20; i++) {
            ctx1.add("user", "Câu hỏi số " + i + " " + "x".repeat(40));
            ctx1.add("assistant", "Trả lời số " + i + " " + "y".repeat(40));
        }
        List<Message> built1 = ctx1.buildMessages();
        ContextModel model1 = new ContextModel(120);
        model1.send(built1);
        boolean sys1 = model1.lastReceived.stream().anyMatch(m -> m.role.equals("system") && m.content.contains("TUYỆT ĐỐI"));
        check("system_prompt_giu_duoc", sys1, "sau khi cắt cho vừa context, system prompt (luật an toàn) phải còn; nhận " + model1.lastReceived.size() + " message");
        check("khong_vuot_token_limit", ContextModel.tokens(built1) <= 120, "tổng token phải <= 120, thực tế " + ContextModel.tokens(built1));

        // 2. Cắt từ cũ nhất: tin nhắn mới nhất phải còn
        String lastUser = "Câu hỏi cuối cùng quan trọng";
        ChatContext ctx2 = new ChatContext("system", 100);
        for (int i = 0; i < 30; i++) ctx2.add("user", "câu " + i + " " + "a".repeat(30));
        ctx2.add("user", lastUser);
        List<Message> built2 = ctx2.buildMessages();
        boolean newest = built2.stream().anyMatch(m -> m.content.equals(lastUser));
        check("giu_tin_nhan_moi_nhat", newest && ContextModel.tokens(built2) <= 100,
            "tin nhắn mới nhất phải còn và tổng <= 100; tokens=" + ContextModel.tokens(built2) + " newest=" + newest);

        // 3. System prompt tự nó đã quá lớn: phải báo lỗi rõ ràng, không cắt mất luật
        ChatContext ctx3 = new ChatContext("S".repeat(4000), 100);
        String err3 = null;
        try { ctx3.buildMessages(); } catch (ContextTooLongException e) { err3 = e.getMessage(); }
        check("system_qua_lon_bao_loi", err3 != null, "system prompt vượt limit phải ném ContextTooLongException, không được âm thầm cắt bỏ luật");

        // 4. Một tin nhắn mới nhất quá lớn: cắt bớt nội dung cho vừa, vẫn giữ system
        ChatContext ctx4 = new ChatContext("luật an toàn", 100);
        ctx4.add("user", "ngắn");
        ctx4.add("user", "H".repeat(2000));
        List<Message> built4 = ctx4.buildMessages();
        boolean sys4 = built4.stream().anyMatch(m -> m.role.equals("system") && m.content.equals("luật an toàn"));
        boolean newest4 = built4.stream().anyMatch(m -> m.role.equals("user") && m.content.startsWith("HHHH"));
        check("tin_nhan_qua_lon_duoc_cat", sys4 && newest4 && ContextModel.tokens(built4) <= 100,
            "tin nhắn mới nhất quá lớn phải được cắt cho vừa, vẫn giữ system; tokens=" + ContextModel.tokens(built4));

        System.out.println("RESULT " + passed + "/" + total);
    }
}

// Mô phỏng nền tảng: nếu vượt limit thì cắt từ message cũ nhất (đúng như log production)
class ContextModel {
    final int limit; List<Message> lastReceived;
    ContextModel(int limit) { this.limit = limit; }
    void send(List<Message> messages) {
        List<Message> kept = new ArrayList<>(messages);
        while (kept.size() > 1 && tokens(kept) > limit) kept.remove(0);
        lastReceived = kept;
    }
    static int tokens(List<Message> msgs) { int t = 0; for (Message m : msgs) t += TokenCounter.count(m); return t; }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Message {
    final String role;      // "system" | "user" | "assistant"
    final String content;
    Message(String role, String content) { this.role = role; this.content = content; }
}

class TokenCounter {
    static final int OVERHEAD = 4;
    static int count(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }
    static int count(Message m) { return count(m.content) + OVERHEAD; }
}

class ContextTooLongException extends RuntimeException {
    ContextTooLongException(String m) { super(m); }
}

// ===== Code cần sửa =====
class ChatContext {
    private final String systemPrompt;
    private final int tokenLimit;
    private final List<Message> history = new ArrayList<>();
    ChatContext(String systemPrompt, int tokenLimit) { this.systemPrompt = systemPrompt; this.tokenLimit = tokenLimit; }
    void add(String role, String content) { history.add(new Message(role, content)); }

    List<Message> buildMessages() {
        int systemTokens = TokenCounter.count(new Message("system", systemPrompt));
        if (systemTokens > tokenLimit) {
            throw new ContextTooLongException("system prompt chiếm " + systemTokens + " token, vượt context " + tokenLimit);
        }
        // Chọn các message mới nhất còn vừa ngân sách (system + selected <= limit)
        List<Message> kept = new ArrayList<>();
        int used = systemTokens;
        for (int i = history.size() - 1; i >= 0; i--) {
            Message m = history.get(i);
            int mt = TokenCounter.count(m);
            if (used + mt <= tokenLimit) {
                kept.add(0, m);            // thêm vào đầu để giữ đúng thứ tự
                used += mt;
            } else if (i == history.size() - 1 && tokenLimit - used > TokenCounter.OVERHEAD) {
                // Tin nhắn mới nhất quá lớn: cắt bớt nội dung cho vừa phần còn lại
                String cut = cutToTokens(m.content, tokenLimit - used);
                kept.add(0, new Message(m.role, cut));
                used += TokenCounter.count(new Message(m.role, cut));
                break;
            } else {
                break;                     // message cũ hơn không vừa: cắt phần cũ nhất
            }
        }
        List<Message> out = new ArrayList<>();
        out.add(new Message("system", systemPrompt));   // luôn giữ system prompt
        out.addAll(kept);
        return out;
    }

    // Cắt nội dung sao cho số token của message mới <= roomTokens (đã trừ overhead)
    static String cutToTokens(String content, int roomTokens) {
        int maxChars = Math.max(0, (roomTokens - TokenCounter.OVERHEAD) * 4);
        return content.length() <= maxChars ? content : content.substring(0, maxChars);
    }
}`,
  hints: [
    'Đọc log: {{promptTokens=8420}} vượt {{limit=8000}}, platform cắt 5 message cũ nhất. System prompt nằm ở đầu danh sách nên nằm trong nhóm bị cắt.',
    'Nếu chỉ nạp thêm bớt lịch sử mà không đếm token, bạn không biết mình đang gửi bao nhiêu. Cần một hàm đếm token (ở đây xấp xỉ 4 ký tự = 1 token, cộng 4 token overhead mỗi message) và một ngân sách rõ ràng cho system prompt.',
    'Thuật toán: dành trước token cho system prompt; duyệt lịch sử từ mới nhất về cũ, thêm message nào còn vừa ngân sách; nếu message mới nhất quá lớn thì cắt bớt nội dung cho vừa; nếu system prompt tự nó vượt hạn mức thì ném ContextTooLongException.',
  ],
  rootCause: `**System prompt nằm ở đầu, platform cắt từ đầu khi vượt context.** {{ChatContext.buildMessages}} ghép system prompt rồi đổ toàn bộ lịch sử vào, không đếm token. Khi tổng vượt 8.000, nền tảng cắt bớt từ phía cũ nhất để vừa cửa sổ. Vì system prompt là message đầu tiên, nó nằm trong nhóm bị cắt đầu tiên (context-stats: "drops system + 75 oldest"). Mất system prompt nghĩa là mất toàn bộ luật an toàn, nên agent tự do trả lời ngoài phạm vi và đọc lại dữ liệu nhạy cảm.

**Không có ngân sách token nên không kiểm soát được.** Không đếm token thì không biết một phiên đã dài bao nhiêu, cũng không biết còn chỗ cho system prompt hay không. Ở đây mỗi message tốn ~4 ký tự/token + 4 token overhead; phiên 82 message lên 8.302 token history, cộng 118 token system là 8.420 — vượt 8.000.

**Không xử lý tin nhắn đơn lẻ quá lớn.** Một tin nhắn khổng lồ (khách dán hợp đồng 40 trang) có thể tự nó vượt cả context. Nếu chỉ cắt theo số message, tin nhắn đó vẫn làm vỡ ngân sách hoặc bị nền tảng cắt mất phần đuôi, khiến câu trả lời thiếu ngữ cảnh.`,
  fix: `### Cách sửa trong bài
1. **Đếm token trước khi ghép.** Ước lượng ~4 ký tự/token, cộng 4 token overhead cho role/format mỗi message (con số thật lấy từ tokenizer của model; ở đây chỉ cần deterministic).
2. **Dành ngân sách cho system prompt trước.** Nếu system prompt tự nó đã vượt limit thì ném {{ContextTooLongException}} — thà báo lỗi rõ ràng còn hơn âm thầm bỏ luật an toàn.
3. **Cắt từ cũ nhất.** Duyệt lịch sử từ message mới nhất về cũ, chỉ giữ những message còn vừa ngân sách còn lại. Đây là "sliding window" (cửa sổ trượt: luôn giữ các message gần nhất, bỏ dần phần cũ).
4. **Tin nhắn mới nhất quá lớn thì cắt nội dung.** Nếu message mới nhất một mình đã vượt phần ngân sách còn lại, cắt bớt ký tự cho vừa (mất một phần tin nhắn mới nhất vẫn tốt hơn mất system prompt).
5. **Luôn đặt system prompt ở đầu danh sách trả về**, sau khi đã bảo đảm tổng token ≤ limit.

~~~java
int systemTokens = TokenCounter.count(new Message("system", systemPrompt));
if (systemTokens > tokenLimit) throw new ContextTooLongException("system quá lớn");
int used = systemTokens;
List<Message> kept = new ArrayList<>();
for (int i = history.size() - 1; i >= 0; i--) {
    Message m = history.get(i);
    if (used + TokenCounter.count(m) <= tokenLimit) { kept.add(0, m); used += TokenCounter.count(m); }
    else if (i == history.size() - 1) { kept.add(0, new Message(m.role, cutToTokens(m.content, tokenLimit - used))); break; }
    else break;
}
~~~

### Trên production thật
- **Dùng chat memory có giới hạn của framework:** LangChain4j {{TokenWindowChatMemory}} hoặc {{MessageWindowChatMemory}}, Spring AI {{MessageWindowChatMemory}}. Chúng tính token và tự cắt, thay vì tự ghép chuỗi.
- **Tách system prompt khỏi hội thoại:** system prompt gửi riêng, không đưa vào danh sách bị cắt. Guardrail (rào chắn an toàn) cũng nên đặt ở tầng ngoài — lọc output, phân quyền tool — chứ không chỉ dựa vào prompt.
- **Tóm tắt phần cũ (summarization — nén các lượt cũ thành một đoạn ngắn)** thay vì bỏ hẳn, khi cần giữ ngữ cảnh dài; hoặc dùng RAG (retrieval — truy xuất lại đúng đoạn cần) thay vì nhồi cả lịch sử.
- **Không dán tài liệu dài vào chat:** với tài liệu lớn, dùng upload + RAG, không nhét vào context.
- **Observability:** ghi prompt tokens, số message bị cắt, event truncation, và cảnh báo khi tỉ lệ phiên bị cắt vượt ngưỡng. Test hồi quy: một phiên 82 message phải luôn giữ system prompt và ≤ limit.

### Liên hệ phỏng vấn
Nói: system prompt phải được bảo vệ như một phần bất biến của ngân sách token; cắt theo sliding window từ phía cũ; nếu system prompt tự nó quá lớn thì fail sớm thay vì bỏ luật. Ở production, dùng chat memory có giới hạn của framework, tách guardrail ra khỏi prompt, và đo prompt tokens để phát hiện phiên dài bất thường.

> Senior tip: đừng dựa vào prompt để giữ an toàn. System prompt chỉ là một message như mọi message khác — nó có thể bị cắt nếu bạn không bảo vệ ngân sách. Hãy tách guardrail ra tầng ngoài (lọc output, phân quyền tool, che PII), dùng chat memory có giới hạn của framework, và cảnh báo khi tỉ lệ phiên bị cắt context tăng.`,
  related: ['ai-058', 'ai-060'],
  tags: ['LLM', 'context window', 'token', 'sliding window', 'safety', 'LangChain4j']
},
{
  id: 'bug-020',
  title: 'Service tỉ giá: cache check-then-act gọi API ngoài 2 lần và ghi đè',
  domain: 'Tài chính / Tỉ giá ngoại tệ',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ứng dụng ngân hàng số hiển thị và quy đổi tỉ giá ngoại tệ (ví dụ USD/VND). Service {{ExchangeRateService}} (Spring Boot, 4 pod) có một lớp cache trong bộ nhớ (in-memory cache — vùng nhớ RAM tạm trong cùng tiến trình JVM, dùng để lưu kết quả đã lấy nhằm tránh gọi lại) để không phải hỏi nhà cung cấp tỉ giá ngoài ở mỗi request. Nhà cung cấp ngoài tính phí theo mỗi lần gọi API và đôi khi trả chậm.

**Sự cố:** Sáng thứ Ba, dashboard giám sát cho thấy trong giờ cao điểm có nhiều cặp tiền bị gọi API ngoài **2 lần gần như cùng lúc** cho cùng một cặp (log: hai request vào cách nhau 3–5ms, cả hai đều in {{cache miss}} rồi đều gọi provider). Tháng đó chi phí API tăng ~18% so với dự kiến. Ngoài lãng phí, có trường hợp hiếm hai lần trả về giá hơi khác nhau và lần ghi sau **ghi đè** (overwrite — ghi giá trị mới đè lên giá trị cũ) lên lần ghi trước, khiến hai người dùng thấy tỉ giá khác nhau trong cùng khoảnh khắc.

**Nhiệm vụ của bạn:**
1. Đọc code {{ExchangeRateService.getRate}} và log, giải thích vì sao hai request cùng lúc đều gọi provider.
2. Sửa code để **với cùng một cặp tiền**, provider chỉ được gọi **đúng một lần** khi cache đang trống, kể cả khi nhiều request đến cùng lúc; các request khác phải dùng lại kết quả đó.
3. Bấm **Chạy test**: test dùng rào chặn (barrier/latch — cơ chế khiến các luồng chờ nhau tại một điểm để tái hiện đúng thời điểm chạy song song) để ép hai luồng cùng rơi vào nhánh {{cache miss}}.`,
  artifacts: [
    { name: 'rate-service.log', lang: 'text', content: `2026-11-05 09:10:14.201 INFO  [http-nio-8080-exec-11] ExchangeRateService : getRate pair=USD/VND
2026-11-05 09:10:14.204 INFO  [http-nio-8080-exec-19] ExchangeRateService : getRate pair=USD/VND
2026-11-05 09:10:14.206 DEBUG [http-nio-8080-exec-11] ExchangeRateService : cache miss pair=USD/VND -> call provider
2026-11-05 09:10:14.207 DEBUG [http-nio-8080-exec-19] ExchangeRateService : cache miss pair=USD/VND -> call provider
2026-11-05 09:10:14.512 INFO  [http-nio-8080-exec-11] RateProviderClient  : fetched USD/VND = 25480 cost=1
2026-11-05 09:10:14.519 INFO  [http-nio-8080-exec-19] RateProviderClient  : fetched USD/VND = 25485 cost=1
2026-11-05 09:10:14.520 DEBUG [http-nio-8080-exec-11] ExchangeRateService : cache put USD/VND=25480
2026-11-05 09:10:14.523 DEBUG [http-nio-8080-exec-19] ExchangeRateService : cache put USD/VND=25485 (overwrite)` },
    { name: 'cost-report.txt', lang: 'text', content: `EXCHANGE RATE PROVIDER COST 2026-11-05 09:00-10:00 ICT
Distinct pairs requested : 12
Total provider calls     : 19
Duplicate concurrent calls (same pair, < 20ms apart): 7
Extra cost vs expected   : +58% in peak hour
Note: last-write-wins overwrote 2 pairs with a slightly different value within the same second.` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
interface RateProvider {
    /** Gọi API nhà cung cấp tỉ giá ngoài. Mỗi lần gọi đều tốn phí. */
    long fetch(String pair);
}

// ===== Code cần sửa =====
class ExchangeRateService {
    private final RateProvider provider;
    private final Map<String, Long> cache = new HashMap<>();

    ExchangeRateService(RateProvider provider) { this.provider = provider; }

    /** Lấy tỉ giá cho cặp tiền (ví dụ "USD/VND"). Nên dùng cache để tránh gọi provider lặp lại. */
    long getRate(String pair) {
        Long rate = cache.get(pair);
        if (rate == null) {                 // cache miss: chưa có trong cache
            rate = provider.fetch(pair);    // gọi API ngoài (tốn phí)
            cache.put(pair, rate);          // lưu vào cache
        }
        return rate;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    /** Provider giả lập: đếm số lần gọi. Khi bật gate, lần gọi đầu chờ (tối đa 300ms)
     *  để lần gọi thứ hai (nếu có) cũng kịp xảy ra — tái hiện hai request cùng cache miss. */
    static class CountingProvider implements RateProvider {
        final AtomicInteger calls = new AtomicInteger();
        volatile CountDownLatch gate;
        public long fetch(String pair) {
            calls.incrementAndGet();
            CountDownLatch g = gate;
            if (g != null) {
                g.countDown();
                try { g.await(300, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
            return pair.hashCode() & 0xffffL; // giá trị xác định theo cặp tiền
        }
    }

    public static void main(String[] args) throws Exception {
        // 1. Lần đầu lấy tỉ giá: gọi provider 1 lần và trả về giá trị
        CountingProvider p1 = new CountingProvider();
        ExchangeRateService s1 = new ExchangeRateService(p1);
        long r1 = s1.getRate("USD/VND");
        check("lan_dau_goi_provider", p1.calls.get() == 1 && r1 == ("USD/VND".hashCode() & 0xffffL),
            "kỳ vọng gọi 1 lần, thực tế " + p1.calls.get() + " lần, rate=" + r1);

        // 2. Gọi lại cùng cặp: phải dùng cache, không gọi provider thêm
        long r1b = s1.getRate("USD/VND");
        check("dung_cache", p1.calls.get() == 1 && r1b == r1,
            "kỳ vọng vẫn 1 lần gọi và cùng giá trị, thực tế " + p1.calls.get() + " lần, rate=" + r1b);

        // 3. Hai request cùng lúc cho cùng một cặp khi cache trống (đúng như sự cố)
        CountingProvider p3 = new CountingProvider();
        p3.gate = new CountDownLatch(2);
        ExchangeRateService s3 = new ExchangeRateService(p3);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Long> f1 = pool.submit(() -> s3.getRate("EUR/VND"));
        Future<Long> f2 = pool.submit(() -> s3.getRate("EUR/VND"));
        long v1 = f1.get(5, TimeUnit.SECONDS);
        long v2 = f2.get(5, TimeUnit.SECONDS);
        p3.gate = null;
        check("dong_thoi_mot_lan_goi", p3.calls.get() == 1 && v1 == v2,
            "kỳ vọng provider chỉ gọi 1 lần và hai request nhận cùng giá trị, thực tế " + p3.calls.get() + " lần, v1=" + v1 + " v2=" + v2);

        // 4. Hai cặp tiền khác nhau: mỗi cặp gọi provider 1 lần (tổng 2), không chặn nhau sai
        CountingProvider p4 = new CountingProvider();
        ExchangeRateService s4 = new ExchangeRateService(p4);
        s4.getRate("USD/VND");
        s4.getRate("JPY/VND");
        s4.getRate("USD/VND");
        check("hai_cap_khac_nhau", p4.calls.get() == 2,
            "kỳ vọng đúng 2 lần gọi cho 2 cặp khác nhau, thực tế " + p4.calls.get() + " lần");

        pool.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `interface RateProvider {
    long fetch(String pair);
}

class ExchangeRateService {
    private final RateProvider provider;
    // ConcurrentHashMap: map an toàn khi nhiều luồng đọc/ghi cùng lúc (thread-safe — nhiều luồng dùng chung mà không hỏng dữ liệu)
    private final ConcurrentHashMap<String, Long> cache = new ConcurrentHashMap<>();

    ExchangeRateService(RateProvider provider) { this.provider = provider; }

    long getRate(String pair) {
        // computeIfAbsent: kiểm tra và (nếu thiếu) tính+ghi trong MỘT thao tác nguyên tử theo từng key.
        // Với cùng key, hàm mapping (provider.fetch) chỉ chạy một lần; các luồng khác chờ và nhận cùng kết quả.
        return cache.computeIfAbsent(pair, provider::fetch);
    }
}`,
  hints: [
    'Đọc log: hai thread cùng in {{cache miss}} rồi cùng gọi provider cho {{USD/VND}}. Vì sao cả hai đều thấy cache trống? Gợi ý: {{cache.get}} (kiểm tra) và {{cache.put}} (ghi) là hai bước tách rời, không nguyên tử (atomic — thực hiện trọn vẹn như một bước, không bị luồng khác chen vào giữa).',
    'Đây là race condition (tình huống tranh chấp: kết quả sai vì nhiều luồng chạy xen kẽ ngoài ý muốn) kiểu check-then-act: "kiểm tra rồi mới hành động". Cần biến "nếu thiếu thì gọi provider và lưu" thành một bước không thể bị chen ngang cho CÙNG một key.',
    '{{ConcurrentHashMap.computeIfAbsent(key, mappingFunction)}} làm đúng việc đó: nếu key chưa có, nó chạy mappingFunction một lần và ghi kết quả; nếu key đã có (hoặc luồng khác vừa ghi xong), nó trả về giá trị sẵn có. Mapping function chỉ nên gọi provider, không tự sửa map ngoài.',
  ],
  rootCause: `**Race condition (tình huống tranh chấp giữa các luồng — thread, luồng thực thi, là một "dòng" chạy song song trong chương trình) kiểu check-then-act trên cache.** Hai request xử lý {{USD/VND}} gần như cùng lúc. Cả hai gọi {{cache.get("USD/VND")}} và đều nhận {{null}} (cache miss — không tìm thấy trong cache) vì chưa luồng nào kịp {{put}}. Sau đó **cả hai** gọi {{provider.fetch}}, rồi **cả hai** {{put}} vào cache. Hậu quả: provider bị gọi 2 lần (tốn phí gấp đôi) và lần ghi sau ghi đè lần ghi trước (last-write-wins — ghi sau thắng), nên nếu hai lần trả giá hơi khác nhau thì giá trị cuối cùng phụ thuộc vào luồng nào ghi sau.

**Bản chất "check-then-act" (kiểm tra rồi hành động):** đoạn kiểm tra {{cache.get}} rồi {{provider.fetch}} rồi {{cache.put}}
gồm nhiều bước tách rời. Giữa bước "thấy null" và bước "put", luồng khác có thể chạy xen vào và cũng thấy null. Muốn đúng, cả cụm "nếu thiếu thì tính và ghi" phải là một thao tác nguyên tử (atomic — không thể bị chia cắt/chen ngang) theo từng key.

Ngoài ra {{HashMap}} thường (không an toàn khi nhiều luồng cùng ghi) có thể bị hỏng cấu trúc bên trong khi sửa đồng thời; nhưng lỗi quan trọng nhất ở đây là logic check-then-act, nên dù đổi sang map "an toàn" mà vẫn tách kiểm tra/ghi thì vẫn gọi provider hai lần.`,
  fix: `### Cách sửa trong bài
Dùng {{ConcurrentHashMap}} (bản đồ an toàn cho nhiều luồng — thread-safe map) và {{computeIfAbsent}}:
- {{computeIfAbsent(key, f)}}: nếu {{key}} chưa có giá trị, chạy {{f(key)}} **một lần** để tính giá trị, ghi vào map và trả về; nếu đã có, trả về ngay giá trị đang có. Việc kiểm tra + tính + ghi được thực hiện nguyên tử theo từng key, nên hai luồng cùng hỏi một cặp tiền thì chỉ một luồng thực sự gọi provider, luồng kia nhận lại kết quả.

~~~java
class ExchangeRateService {
    private final RateProvider provider;
    private final ConcurrentHashMap<String, Long> cache = new ConcurrentHashMap<>();

    ExchangeRateService(RateProvider provider) { this.provider = provider; }

    long getRate(String pair) {
        return cache.computeIfAbsent(pair, provider::fetch); // nguyên tử theo key
    }
}
~~~

### Vì sao cách này đúng
- **Một lần gọi cho mỗi key đang thiếu:** {{computeIfAbsent}} đồng bộ hoá (synchronise — sắp xếp để không chạy chồng chéo) trên phần tử của key đó, nên mapping function không chạy trùng.
- **Các key khác nhau không chặn nhau:** khoá theo key (không khoá cả map), nên {{USD/VND}} và {{JPY/VND}} có thể nạp song song.
- **Trả cùng một giá trị:** mọi luồng nhận đúng giá trị được ghi một lần, không còn ghi đè chéo.

### Cách khác (khi cần kiểm soát chi tiết hơn)
- **Khoá theo key tự quản lý:** giữ một {{ConcurrentHashMap<String, Object>}} các ổ khoá, lấy ổ khoá bằng {{computeIfAbsent(key, k -> new Object())}} rồi {{synchronized(lock)}} quanh đoạn kiểm tra–tính–ghi. Linh hoạt nhưng dễ quên nhánh lỗi.
- **{{Future}}/memoizer:** cache chứa {{Future}} (lời hứa kết quả sẽ có sau) để luồng đến sau chờ cùng một lần tính; nhớ xoá entry nếu tính lỗi, nếu không lỗi sẽ bị "cache" mãi.

### Trên production thật
- Cache trong bộ nhớ chỉ đúng **trong một JVM** (một tiến trình Java). Hệ thống có 4 pod thì mỗi pod vẫn có thể gọi provider một lần khi khởi động/lúc cache trống — chấp nhận được nếu có TTL (time-to-live — thời gian sống, hết hạn thì nạp lại) ngắn; nếu cần "chỉ một lần cho cả cụm", dùng khoá phân tán (distributed lock, ví dụ Redis {{SETNX}}) hoặc một cache chia sẻ (Redis) với chiến lược single-flight.
- Không cache giá trị {{null}}/lỗi bằng {{computeIfAbsent}} tuỳ ý (mapping trả null thì không ghi gì, sẽ gọi lại — thường là đúng; nhưng cần phân biệt "không có dữ liệu" và "lỗi tạm thời").
- Đặt TTL và cơ chế làm mới nền để tỉ giá không bị cũ; log/metric số lần gọi provider và tỉ lệ cache hit (tìm thấy trong cache) để phát hiện bất thường.

### Liên hệ phỏng vấn
Đây là ví dụ kinh điển của "cache stampede" ở mức nhỏ: nhiều luồng cùng miss và cùng tải. Trả lời nên nêu: (1) check-then-act không nguyên tử, (2) {{computeIfAbsent}}/khoá theo key để chỉ một luồng nạp, (3) khác biệt cache trong tiến trình vs cache phân tán, (4) xử lý lỗi và TTL. Nhấn mạnh: an toàn luồng (thread-safe) không chỉ là "dùng ConcurrentHashMap" mà là làm trọn vẹn cả thao tác gộp.

> Senior tip: {{computeIfAbsent}} rất tiện nhưng mapping function không được sửa chính cái map đó và không nên chạy quá lâu (nó giữ đồng bộ theo key). Với tác vụ nạp chậm, cân nhắc cache {{Future}} (single-flight) và luôn có đường xoá entry khi lỗi để tránh "cache vĩnh viễn một lần thất bại".`,
  related: ['core-010', 'core-012'],
  tags: ['concurrency', 'cache', 'check-then-act', 'computeIfAbsent', 'race condition']
},
{
  id: 'bug-021',
  title: 'Bấm Thanh toán hai lần tạo hai đơn hàng trùng (thiếu idempotency key)',
  domain: 'Thương mại điện tử / Thanh toán',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ứng dụng đặt đồ ăn. Khi người dùng bấm **"Thanh toán"**, app gửi request tạo đơn lên {{CheckoutService}}. Để chống việc gửi lặp do mạng chậm (client tự retry) hoặc người dùng bấm liên tục, app sinh một {{idempotency key}} (khoá chống trùng lặp — một chuỗi định danh duy nhất cho "một lần bấm/một ý định thanh toán"; các request mang cùng key phải cho ra **cùng một kết quả**, không tạo thêm bản ghi mới) và gửi kèm theo request.

**Sự cố:** Cuối tuần, bộ phận CSKH nhận nhiều khiếu nại "bị trừ tiền 2 lần / nhận 2 đơn giống hệt". Truy vết cho thấy: người dùng bấm "Thanh toán" hai lần khi app quay vòng chờ, app gửi **hai request với cùng {{idempotency key}}**; nhưng server tạo ra **hai đơn hàng khác nhau** và trừ tiền hai lần. Log và truy vấn DB cho thấy cùng {{idemKey=pay-7f3a}} nhưng có 2 {{orderId}} khác nhau.

**Nhiệm vụ của bạn:**
1. Đọc code {{CheckoutService.placeOrder}} và log: vì sao cùng một idempotency key vẫn tạo hai đơn?
2. Sửa code để cùng {{idempotencyKey}} chỉ tạo **đúng một** đơn và **trả lại kết quả cũ** cho các lần gọi sau (kể cả khi gọi đồng thời). Gợi ý: dùng ràng buộc duy nhất (unique constraint — quy tắc ở nơi lưu dữ liệu: giá trị của cột/trường phải không trùng; nếu chèn trùng, thao tác bị từ chối) theo idempotency key.
3. Bấm **Chạy test**: test kiểm tra gọi tuần tự, gọi đồng thời và các key khác nhau.`,
  artifacts: [
    { name: 'checkout.log', lang: 'text', content: `2026-11-08 19:22:41.103 INFO  [http-nio-8080-exec-3]  CheckoutController : placeOrder user=U-220 idemKey=pay-7f3a amount=185000
2026-11-08 19:22:41.910 INFO  [http-nio-8080-exec-9]  CheckoutController : placeOrder user=U-220 idemKey=pay-7f3a amount=185000 (client retry, same key)
2026-11-08 19:22:41.355 INFO  [http-nio-8080-exec-3]  CheckoutService    : created orderId=ORD-90041 idemKey=pay-7f3a
2026-11-08 19:22:42.180 INFO  [http-nio-8080-exec-9]  CheckoutService    : created orderId=ORD-90042 idemKey=pay-7f3a
2026-11-08 19:22:42.181 WARN  [reconcile-job]            ReconcileJob       : duplicate orders for idemKey=pay-7f3a -> ORD-90041, ORD-90042` },
    { name: 'orders-query.sql', lang: 'sql', content: `SELECT idempotency_key, count(*) AS orders, string_agg(order_id, ',') AS ids
FROM orders
WHERE created_at >= '2026-11-08' AND idempotency_key IS NOT NULL
GROUP BY idempotency_key HAVING count(*) > 1
ORDER BY orders DESC LIMIT 3;
-- idempotency_key | orders | ids
-- pay-7f3a        |      2 | ORD-90041,ORD-90042
-- pay-81bc        |      2 | ORD-90077,ORD-90078
-- (23 rows)
-- Note: column idempotency_key has NO unique constraint.` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Order {
    final String orderId;
    final String idempotencyKey;
    final long amount;
    Order(String orderId, String idempotencyKey, long amount) {
        this.orderId = orderId; this.idempotencyKey = idempotencyKey; this.amount = amount;
    }
}

interface OrderRepository {
    /** Lưu đơn mới và trả về chính đơn đó. Trong DB thật, cột idempotencyKey nên có unique constraint. */
    Order save(Order order);
    /** Tìm đơn theo idempotency key, trả null nếu chưa có. */
    Order findByIdempotencyKey(String idempotencyKey);
    /** Sinh mã đơn mới. */
    String nextOrderId();
}

// ===== Code cần sửa =====
class CheckoutService {
    private final OrderRepository repo;

    CheckoutService(OrderRepository repo) { this.repo = repo; }

    /** Tạo đơn thanh toán. Gọi nhiều lần với cùng idempotencyKey phải cho ra cùng một đơn. */
    Order placeOrder(String idempotencyKey, long amount) {
        String orderId = repo.nextOrderId();
        return repo.save(new Order(orderId, idempotencyKey, amount));
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    /** Repository giả lập DB: cột idempotencyKey nên có unique constraint (trong prod đang thiếu nên bị tạo trùng).
     *  Khi bật gate, lần save đầu chờ (tối đa 300ms) để lần save thứ hai (nếu code bỏ qua kiểm tra)
     *  cũng kịp xảy ra — tái hiện hai request đồng thời cùng key. */
    static class FakeOrderRepo implements OrderRepository {
        final AtomicInteger seq = new AtomicInteger();
        final AtomicInteger saveCount = new AtomicInteger();
        final Map<String, Order> byKey = new ConcurrentHashMap<>();
        volatile CountDownLatch gate;
        public String nextOrderId() { return "ORD-" + seq.incrementAndGet(); }
        public Order save(Order order) {
            CountDownLatch g = gate;
            if (g != null) {
                g.countDown();
                try { g.await(300, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
            // lưu đơn (mô phỏng DB: không chặn ở đây để thấy bug tạo trùng; service phải tự đảm bảo idempotency)
            Order prev = byKey.putIfAbsent(order.idempotencyKey, order);
            if (prev == null) {
                saveCount.incrementAndGet();
                return order;
            }
            // đã có đơn cho key này nhưng caller vẫn cố tạo đơn khác -> ghi nhận là bản ghi trùng
            saveCount.incrementAndGet();
            return prev;
        }
        public Order findByIdempotencyKey(String key) { return byKey.get(key); }
    }

    public static void main(String[] args) throws Exception {
        // 1. Tạo đơn bình thường
        FakeOrderRepo r1 = new FakeOrderRepo();
        CheckoutService s1 = new CheckoutService(r1);
        Order o1 = s1.placeOrder("k1", 100000);
        check("tao_don_binh_thuong", o1 != null && o1.amount == 100000 && r1.saveCount.get() == 1,
            "kỳ vọng tạo 1 đơn 100000, thực tế saveCount=" + r1.saveCount.get() + " order=" + (o1 == null ? "null" : o1.orderId));

        // 2. Gọi lại cùng idempotency key (tuần tự): phải trả lại đúng đơn cũ, không tạo thêm
        Order o1b = s1.placeOrder("k1", 100000);
        check("trung_key_tuan_tu", o1b != null && o1b.orderId.equals(o1.orderId) && r1.saveCount.get() == 1,
            "kỳ vọng trả lại " + o1.orderId + " và vẫn 1 bản ghi, thực tế saveCount=" + r1.saveCount.get() + " order=" + (o1b == null ? "null" : o1b.orderId));

        // 3. Hai request cùng idempotency key đến đồng thời (đúng như sự cố bấm 2 lần)
        FakeOrderRepo r3 = new FakeOrderRepo();
        r3.gate = new CountDownLatch(2);
        CheckoutService s3 = new CheckoutService(r3);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Order> f1 = pool.submit(() -> s3.placeOrder("pay-7f3a", 185000));
        Future<Order> f2 = pool.submit(() -> s3.placeOrder("pay-7f3a", 185000));
        Order a = f1.get(5, TimeUnit.SECONDS);
        Order b = f2.get(5, TimeUnit.SECONDS);
        r3.gate = null;
        check("trung_key_dong_thoi", r3.saveCount.get() == 1 && a != null && b != null && a.orderId.equals(b.orderId),
            "kỳ vọng chỉ 1 đơn được tạo và cả hai request nhận cùng orderId, thực tế saveCount=" + r3.saveCount.get()
                + " a=" + (a == null ? "null" : a.orderId) + " b=" + (b == null ? "null" : b.orderId));

        // 4. Hai idempotency key khác nhau: phải tạo hai đơn khác nhau
        FakeOrderRepo r4 = new FakeOrderRepo();
        CheckoutService s4 = new CheckoutService(r4);
        Order x = s4.placeOrder("kA", 50000);
        Order y = s4.placeOrder("kB", 70000);
        check("hai_key_khac_nhau", r4.saveCount.get() == 2 && x != null && y != null && !x.orderId.equals(y.orderId),
            "kỳ vọng 2 đơn khác nhau, thực tế saveCount=" + r4.saveCount.get());

        pool.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `class Order {
    final String orderId;
    final String idempotencyKey;
    final long amount;
    Order(String orderId, String idempotencyKey, long amount) {
        this.orderId = orderId; this.idempotencyKey = idempotencyKey; this.amount = amount;
    }
}

interface OrderRepository {
    Order save(Order order);
    Order findByIdempotencyKey(String idempotencyKey);
    String nextOrderId();
}

class CheckoutService {
    private final OrderRepository repo;
    // Khoá theo từng idempotency key: hai request CÙNG key chạy tuần tự, key khác nhau vẫn song song.
    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    CheckoutService(OrderRepository repo) { this.repo = repo; }

    Order placeOrder(String idempotencyKey, long amount) {
        Object lock = locks.computeIfAbsent(idempotencyKey, k -> new Object());
        synchronized (lock) {
            // 1) Đã có kết quả cho key này -> trả lại đúng đơn cũ (idempotent)
            Order existing = repo.findByIdempotencyKey(idempotencyKey);
            if (existing != null) return existing;
            // 2) Chưa có -> tạo mới và lưu; DB thật sẽ từ chối nếu trùng key (unique constraint)
            try {
                String orderId = repo.nextOrderId();
                return repo.save(new Order(orderId, idempotencyKey, amount));
            } catch (RuntimeException duplicate) {
                // Phòng trường hợp hiếm vẫn bị trùng (ví dụ chạy nhiều tiến trình): đọc lại và trả kết quả cũ
                Order again = repo.findByIdempotencyKey(idempotencyKey);
                if (again != null) return again;
                throw duplicate;
            }
        }
    }
}`,
  hints: [
    'Đọc log: hai request mang cùng {{idemKey=pay-7f3a}} nhưng handler luôn tạo {{orderId}} mới rồi {{save}}. Code có dùng {{findByIdempotencyKey}} hay kiểm tra key đã tồn tại chưa? Idempotency key vô nghĩa nếu không được kiểm tra.',
    'Muốn idempotent: nếu đã có đơn cho key này thì **trả lại đơn cũ**; chỉ khi chưa có mới tạo và lưu. Nhưng "kiểm tra rồi lưu" là check-then-act: hai request đồng thời cùng thấy "chưa có" thì vẫn tạo hai đơn.',
    'Cần (1) ràng buộc duy nhất (unique constraint) trên idempotency key ở nơi lưu để lần chèn trùng bị từ chối, và (2) biến kiểm tra–lưu thành thao tác an toàn theo từng key (khoá theo key) rồi khi gặp trùng thì đọc lại và trả kết quả cũ.',
  ],
  rootCause: `**Thiếu cơ chế idempotency (tính bất biến khi lặp lại — gọi 1 lần hay nhiều lần với cùng một ý định cho ra cùng kết quả, không tạo thêm tác dụng phụ).** Client đã gửi đúng {{idempotency key}} ở cả hai request, nhưng {{placeOrder}} phớt lờ nó: luôn sinh {{orderId}} mới và {{save}}. Vì không có bước "nếu key này đã xử lý thì trả kết quả cũ", mỗi lần gọi đều tạo một đơn mới. Log cho thấy cùng {{idemKey=pay-7f3a}} nhưng tạo {{ORD-90041}} và {{ORD-90042}}.

**Vì sao "chỉ kiểm tra if chưa có rồi mới lưu" vẫn chưa đủ khi có đồng thời?** Đó là check-then-act (kiểm tra rồi hành động): hai request cùng lúc có thể cùng {{findByIdempotencyKey}} thấy {{null}}, rồi cùng đi tạo đơn. Cần một điểm chốt duy nhất: hoặc khoá theo key trong tiến trình, hoặc (chắc chắn hơn) ràng buộc duy nhất (unique constraint) ở nơi lưu dữ liệu để lần chèn trùng bị từ chối.

**Vì sao cần cả "trả lại kết quả cũ"?** Idempotency không chỉ là "không tạo thêm", mà còn là "lần gọi lặp nhận lại **cùng** kết quả". Nếu lần hai chỉ báo lỗi "đã tồn tại" mà không trả về đơn đã tạo, client (đang retry vì nghĩ lần đầu thất bại) sẽ không biết đơn nào là của mình.`,
  fix: `### Cách sửa trong bài
1. **Khoá theo idempotency key** (trong một tiến trình): {{ConcurrentHashMap<key, lock>}} + {{synchronized}} để các request cùng key chạy tuần tự, key khác nhau không chặn nhau.
2. **Kiểm tra trước:** {{findByIdempotencyKey}} thấy đã có → trả lại đơn cũ ngay.
3. **Tạo và lưu:** nếu chưa có thì tạo đơn mới và {{save}}. Lớp lưu dữ liệu có ràng buộc duy nhất (unique constraint) trên key: nếu trùng sẽ ném lỗi.
4. **Khi bị trùng:** bắt lỗi, {{findByIdempotencyKey}} lại và trả về đơn cũ (để lần gọi lặp vẫn nhận đúng kết quả).

~~~java
Object lock = locks.computeIfAbsent(idempotencyKey, k -> new Object());
synchronized (lock) {
    Order existing = repo.findByIdempotencyKey(idempotencyKey);
    if (existing != null) return existing;       // trả lại kết quả cũ
    try {
        return repo.save(new Order(repo.nextOrderId(), idempotencyKey, amount));
    } catch (RuntimeException dup) {             // unique constraint từ chối bản trùng
        Order again = repo.findByIdempotencyKey(idempotencyKey);
        if (again != null) return again;
        throw dup;
    }
}
~~~

### Trên production thật (nhiều pod / nhiều tiến trình)
Khoá trong JVM chỉ chặn trong **một** tiến trình; hai request cùng key có thể rơi vào hai pod khác nhau. Điểm chốt phải nằm ở **nơi lưu dữ liệu dùng chung** (database):
~~~sql
-- cột idempotency_key phải có unique constraint
ALTER TABLE orders ADD CONSTRAINT uq_orders_idem UNIQUE (idempotency_key);
~~~
- Trong một transaction (giao dịch — nhóm thao tác hoặc thành công hết hoặc thất bại hết): thử {{INSERT}}; nếu vi phạm unique constraint thì {{SELECT}} lại đơn theo key và trả về. Đây là mẫu "insert-or-return-existing".
- Có thể lưu bảng {{idempotency_keys(key, request_hash, response, status)}} riêng: ghi key ở trạng thái "đang xử lý" (unique) trước, xử lý xong cập nhật kết quả; request lặp thấy key đã xong thì trả lại {{response}} đã lưu. Nhớ so sánh {{request_hash}} để từ chối trường hợp **cùng key nhưng nội dung khác**.
- Đặt thời hạn (TTL) dọn key cũ nếu dung lượng lớn, nhưng phải đủ dài để bao trùm cửa sổ retry của client.

### Lỗi hay gặp
- **Kiểm tra xong mới lưu mà không có unique constraint:** vẫn trùng khi chạy đồng thời hoặc nhiều pod.
- **Bắt lỗi trùng nhưng không trả lại kết quả cũ:** client retry không biết đơn nào đã tạo.
- **Chỉ dựa vào "chống bấm hai lần" ở phía giao diện (UI):** UI chỉ giảm khả năng, không thay thế được idempotency ở server (mạng retry, app mở lại, gọi API trực tiếp).
- **Dùng key không đủ duy nhất:** key phải gắn với "một ý định thanh toán" (ví dụ sinh ở client khi mở màn hình thanh toán), không dùng timestamp thô.

### Liên hệ phỏng vấn
Khi được hỏi "làm sao tránh tạo đơn/trừ tiền hai lần khi user bấm hai lần?", trả lời theo lớp: (1) client gửi idempotency key cho mỗi ý định, (2) server kiểm tra và trả lại kết quả cũ cho cùng key, (3) unique constraint ở DB là chốt cuối cùng chống trùng trên nhiều tiến trình, (4) khi đụng unique constraint thì đọc lại và trả kết quả thay vì báo lỗi. Nhắc thêm: idempotency áp dụng cho mọi thao tác tạo/trừ tiền (POST thanh toán, webhook, job retry).

> Senior tip: idempotency key là "hợp đồng" giữa client và server: client hứa gửi lại cùng key khi retry, server hứa cùng key cho cùng kết quả. Unique constraint ở DB là mạng lưới an toàn rẻ và chắc nhất — đừng tin hoàn toàn vào kiểm tra trong bộ nhớ hay khoá trong một tiến trình khi hệ thống chạy nhiều pod.`,
  related: ['scenario-119'],
  tags: ['idempotency', 'duplicate order', 'unique constraint', 'concurrency', 'checkout']
},
{
  id: 'bug-022',
  title: 'Báo cáo doanh thu: một ô ghi "2026-02-31", một ô ghi "31/02/2026"',
  domain: 'Báo cáo / Phân tích dữ liệu',
  level: 'mid',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Hệ thống báo cáo doanh thu ({{RevenueReportService}}) sinh file CSV cho phòng kinh doanh. Mỗi dòng là một ngày: cột đầu là ngày dạng {{dd/MM/yyyy}}, cột sau là doanh thu. Service là một bean Spring chạy trong container, mỗi request xử lý 200–400 ngày dữ liệu.

**Sự cố:** Đầu tháng 11, phòng kinh doanh báo file CSV **không mở được ổn định**: có ô ghi **"2026-02-31"** (ngày 31 tháng 2 — một ngày không tồn tại), có ô ghi **"2026-00-15"**, có ô lại ra ngày năm 2019 trong khi dữ liệu là 2026; thỉnh thoảng job báo {{NumberFormatException}} hoặc {{ArrayIndexOutOfBoundsException}} trong lúc parse. Lỗi **không tái hiện** khi chạy một mình trên máy dev, chỉ xuất hiện khi tải cao (nhiều request cùng lúc).

**Nhiệm vụ của bạn:**
1. Đọc code {{RevenueReportService}} và log, tìm vì sao ngày bị sai ngẫu nhiên và chỉ sai khi chạy song song.
2. Sửa để **mọi request, mọi lúc** đều ra đúng ngày.
3. Bấm **Chạy test**: test mô phỏng đúng tình huống hai request xử lý cùng lúc (có rào chắn để hai thread chắc chắn gặp nhau).`,
  artifacts: [
    { name: 'report-job.log', lang: 'text', content: `2026-11-03 09:12:44.118 INFO  [http-nio-8080-exec-5]  ReportController : generate report type=DAILY_REVENUE range=2026-01-01..2026-12-31
2026-11-03 09:12:44.219 INFO  [http-nio-8080-exec-9]  ReportController : generate report type=DAILY_REVENUE range=2026-01-01..2026-12-31
2026-11-03 09:12:44.351 WARN  [http-nio-8080-exec-9]  RevenueReport    : weird value date="2026-02-31" iso="2026-02-31"
2026-11-03 09:12:44.352 WARN  [http-nio-8080-exec-5]  RevenueReport    : weird value date="2026-00-15" iso="2026-00-15"
2026-11-03 09:12:44.470 ERROR [http-nio-8080-exec-7]  RevenueReport    : java.lang.NumberFormatException: For input string: "2026-0"
    at java.base/jdk.internal.math.FloatingDecimal.readJavaFormatString
    at java.base/java.text.SimpleDateFormat.parse(SimpleDateFormat.java:1502)
    at com.report.RevenueReportService.dateCode(RevenueReportService.java:23)` },
    { name: 'revenue-2026-11-03.csv', lang: 'text', content: `date,revenue
2026-00-15,18250000
2026-02-31,9120000
31/02/2026,4500000
2019-12-31,7750000
2026-13-01,3300000
# 12,480 rows total; 37 rows have an invalid date; 5 rows are dated 2019.` },
    { name: 'thread-dump.txt', lang: 'text', content: `"http-nio-8080-exec-5" #23 prio=5 os_prio=0 cpu=1840ms elapsed=12.44s  runnable
   java.lang.Thread.State: RUNNABLE
        at java.base/java.lang.Character.digit(Character.java)
        at java.base/java.text.DecimalFormat.parse(DecimalFormat.java)
        at com.report.RevenueReportService.dateCode(RevenueReportService.java:23)
        - locked <0x000000076ab21a08> (a java.text.SimpleDateFormat)

"http-nio-8080-exec-9" #27 prio=5 os_prio=0 cpu=1795ms elapsed=12.40s  runnable
   java.lang.Thread.State: RUNNABLE
        at java.base/java.util.Calendar.setTime(Calendar.java)
        at java.base/java.text.SimpleDateFormat.format(SimpleDateFormat.java:963)
        - waiting to lock <0x000000076ab21a08> (a java.text.SimpleDateFormat)` },
  ],
  starter: `import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
/** Dữ liệu đầu vào: mỗi bản ghi là một thời điểm của giao dịch (epoch milliseconds). */
record Txn(String id, long epochMilli) {}

interface TxnRepository {
    /** Đọc toàn bộ giao dịch của một tháng. */
    List<Txn> findByMonth(int year, int month);
}

// ===== Code cần sửa =====
class RevenueReportService {
    private final TxnRepository repo;
    // Một bộ định dạng ngày dùng chung cho MỌI request (bean là singleton)
    private static final SimpleDateFormat DAY =
        new SimpleDateFormat("yyyy-MM-dd");

    RevenueReportService(TxnRepository repo) { this.repo = repo; }

    /** Mã ngày của giao dịch (dùng làm khoá gộp doanh thu theo ngày). */
    String dateCode(Txn t) {
        return DAY.format(new Date(t.epochMilli()));
    }

    /** Đọc dữ liệu một tháng rồi trả về các mã ngày (đã loại trùng). */
    java.util.Set<String> dayCodes(int year, int month) {
        java.util.Set<String> out = new java.util.LinkedHashSet<>();
        for (Txn t : repo.findByMonth(year, month)) out.add(dateCode(t));
        return out;
    }

    /** Đọc lại một mã ngày dạng dd/MM/yyyy do đối tác gửi. */
    Date parsePartnerDate(String text) throws ParseException {
        return DAY.parse(text);
    }

    String dayCodesFormat(Date d) {
        return DAY.format(d);
    }

    Date parseStrictPartnerDate(String text) throws ParseException {
        return parsePartnerDate(text);
    }
}`,
  tests: `import java.text.ParseException;
import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    /** 10 byte cố định: mọi máy, mọi múi giờ đều cho cùng kết quả. */
    static long ms(int year, int month, int day, int hour) {
        return java.time.LocalDateTime.of(year, month, day, hour, 0)
            .toInstant(java.time.ZoneOffset.UTC).toEpochMilli();
    }

    /** Repository giả: dữ liệu nhỏ, không phụ thuộc thời gian thật. */
    static class FakeRepo implements TxnRepository {
        final List<Txn> data;
        FakeRepo(List<Txn> data) { this.data = data; }
        public List<Txn> findByMonth(int year, int month) { return data; }
    }

    public static void main(String[] args) throws Exception {
        // 1. Một request đơn lẻ: ngày phải đúng
        List<Txn> one = List.of(
            new Txn("T1", ms(2026, 2, 1, 9)),
            new Txn("T2", ms(2026, 2, 28, 23)),
            new Txn("T3", ms(2026, 12, 31, 0)));
        RevenueReportService s1 = new RevenueReportService(new FakeRepo(one));
        Set<String> c1 = s1.dayCodes(2026, 2);
        check("mot_request_ngay_dung", c1.equals(new LinkedHashSet<>(List.of("2026-02-01", "2026-02-28", "2026-12-31"))),
            "kỳ vọng đúng 3 mã ngày dạng yyyy-MM-dd, thực tế " + c1);

        // 2. Parse ngày đối tác (dd/MM/yyyy) — dùng đúng định dạng, không lẫn với định dạng báo cáo
        RevenueReportService s2 = new RevenueReportService(new FakeRepo(one));
        Date d2 = s2.parsePartnerDate("31/12/2026");
        String got2 = s2.dayCodesFormat(d2);
        check("parse_ngay_doi_tac", "2026-12-31".equals(got2),
            "31/12/2026 phải ra 2026-12-31, thực tế " + got2);

        // 3. HAI request chạy CÙNG LÚC (đúng như sự cố): kết quả của mỗi request phải độc lập
        final int RUNS = 40;
        List<Txn> heavy = new ArrayList<>();
        for (int i = 0; i < 60; i++) heavy.add(new Txn("H" + i, ms(2026, 3, 1 + (i % 28), i % 24)));
        final RevenueReportService s3 = new RevenueReportService(new FakeRepo(heavy));
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Boolean>> fs = new ArrayList<>();
        for (int r = 0; r < RUNS; r++) {
            fs.add(pool.submit(() -> s3.dayCodes(2026, 3).equals(s3.dayCodes(2026, 3))));
        }
        boolean allSame = true;
        for (Future<Boolean> f : fs) allSame &= f.get(30, java.util.concurrent.TimeUnit.SECONDS);
        // Mỗi lần gọi phải ra tập mã ngày hợp lệ (yyyy-MM-dd, ngày có thật)
        Set<String> expect = new LinkedHashSet<>();
        for (int i = 0; i < 60; i++) {
            int d = 1 + (i % 28);
            expect.add(String.format("2026-03-%02d", d));
        }
        Set<String> last = s3.dayCodes(2026, 3);
        check("hai_request_dong_thoi", allSame && last.equals(expect),
            "mã ngày phải luôn đúng định dạng và đúng tập giá trị, thực tế " + last);
        pool.shutdownNow();

        // 4. Định dạng có kiểm tra chặt: 31/02 phải bị từ chối, không được ra 02/03
        RevenueReportService s4 = new RevenueReportService(new FakeRepo(one));
        boolean rejected = false;
        try { s4.parseStrictPartnerDate("31/02/2026"); }
        catch (ParseException e) { rejected = true; }
        check("ngay_khong_ton_tai_bi_tu_choi", rejected,
            "31/02/2026 là ngày không tồn tại, phải ném ParseException");
        String ok4 = s4.dayCodesFormat(s4.parsePartnerDate("29/02/2028"));
        check("nhuan_leap_year", "2028-02-29".equals(ok4), "2028 là năm nhuận, phải parse được 29/02, thực tế " + ok4);

        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.List;
import java.util.Set;

record Txn(String id, long epochMilli) {}

interface TxnRepository {
    List<Txn> findByMonth(int year, int month);
}

class RevenueReportService {
    private final TxnRepository repo;

    // DateTimeFormatter BẤT BIẾN (immutable) và thread-safe: khai báo một hằng static final dùng chung.
    // Đây là điểm khác biệt cốt lõi so với SimpleDateFormat (giữ Calendar bên trong, có thể đổi).
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter PARTNER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    RevenueReportService(TxnRepository repo) { this.repo = repo; }

    /** Mã ngày của giao dịch theo giờ hệ thống (đã cấu hình ở tầng hạ tầng). */
    String dateCode(Txn t) {
        return DAY.format(java.time.Instant.ofEpochMilli(t.epochMilli())
            .atZone(ZoneOffset.UTC));
    }

    Set<String> dayCodes(int year, int month) {
        Set<String> out = new java.util.LinkedHashSet<>();
        for (Txn t : repo.findByMonth(year, month)) out.add(dateCode(t));
        return out;
    }

    /** Định dạng một ngày đã biết (dùng cho cột "ngày" trong CSV). */
    String dayCodesFormat(Date d) {
        return DAY.format(d.toInstant().atZone(ZoneOffset.UTC));
    }

    /** Parse ngày đối tác (dd/MM/yyyy). Dùng STRICT + 4 chữ số năm: 31/02, 31/04, 15/13 đều ném lỗi (SMART tự điều chỉnh im lặng). */
    Date parsePartnerDate(String text) throws ParseException {
        DateTimeFormatter strict = DateTimeFormatter.ofPattern("dd/MM/uuuu", java.util.Locale.ROOT)
            .withResolverStyle(java.time.format.ResolverStyle.STRICT);
        try {
            LocalDate d = LocalDate.parse(text, strict);
            return Date.from(d.atStartOfDay(ZoneOffset.UTC).toInstant());
        } catch (DateTimeParseException e) {
            throw new ParseException("Ngày đối tác không hợp lệ: " + text, e.getErrorIndex());
        }
    }

    /** Bản chặt: dùng khi dữ liệu đối tác phải tuyệt đối đúng. */
    Date parseStrictPartnerDate(String text) throws ParseException {
        return parsePartnerDate(text);
    }
}`,
  hints: [
    'Đọc log: hai request ({{exec-5}} và {{exec-9}}) chạy cùng lúc, một thread đang giữ khoá {{<0x000000076ab21a08>}} của {{SimpleDateFormat}}, thread kia chờ. Vì sao một class có state lại không an toàn khi chia sẻ?',
    '{{SimpleDateFormat}} giữ một đối tượng {{java.util.Calendar}} bên trong làm vùng nhớ tạm khi format/parse. Hai thread gọi cùng lúc sẽ cùng sửa Calendar đó → ngày bị "nhiễm" lẫn nhau, có thể ra 31/02, tháng 0, hoặc năm cũ.',
    'Thay bằng {{DateTimeFormatter}} (bất biến — không có field nào bị sửa sau khi tạo, nên nhiều thread đọc cùng lúc luôn an toàn) và dùng {{LocalDate}}/{{ZonedDateTime}} thay cho {{Date}}.',
  ],
  rootCause: `**Dùng chung một {{SimpleDateFormat}} giữa nhiều thread — lớp này KHÔNG thread-safe.** {{SimpleDateFormat}} không giữ trạng thái ở biến cục bộ mà ở **field** {{calendar}} (một {{java.util.Calendar}}) và {{formatContext}}; mỗi lần {{format}}/{{parse}} nó ghi đè lên các field đó. Khi hai request gọi cùng lúc trên cùng một instance (bean Spring mặc định là **singleton**: một object dùng chung cho mọi request), trạng thái bị trộn: request A đặt xong năm 2026, request B đặt tháng 2, A đọc lại thì thấy tháng của B và ngày của chính nó → "31/02" (ngày không tồn tại); tệ hơn, {{NumberFormatException}} khi chuỗi bị cắt giữa lúc ghi.

Dẫn chứng: thread dump cho thấy {{exec-5}} giữ khoá {{<0x000000076ab21a08>}} của {{SimpleDateFormat}} còn {{exec-9}} **chờ** khoá đó (nghĩa là code có chạy trên một instance dùng chung); log có ngày "2026-00-15" (tháng 0 — chỉ có thể do state bị ghi lẫn) và ngày năm 2019 trong khi dữ liệu là 2026.

**Vì sao máy dev không tái hiện?** Trên máy dev chỉ có một request tại một thời điểm, không có hai thread chen vào giữa. Đây là kiểu lỗi "data race" — phụ thuộc thời điểm, nên phải tái hiện bằng test có rào chắn (CountDownLatch) để hai thread chắc chắn gặp nhau.

**Vì sao {{synchronized}} hay {{ThreadLocal}} là chữa cháy chứ không phải cách sửa?** {{synchronized}} làm mọi request xếp hàng trên một cái khoá (mất song song — đây là service báo cáo, mất 10 lần throughput). {{ThreadLocal<SimpleDateFormat>}} tạm đúng nhưng mỗi thread giữ một instance riêng: tốn bộ nhớ, dễ rò rỉ nếu thread pool không dọn, và vẫn còn {{Date}} mutable. Cách đúng là dùng lớp **bất biến**.`,
  fix: `### Cách sửa trong bài
1. Bỏ {{SimpleDateFormat}}, thay bằng {{DateTimeFormatter}} — **bất biến**: mọi field đều {{final}} và không có state thay đổi, nên nhiều thread đọc cùng lúc là an toàn (tương tự {{String}}: không sửa được sau khi tạo).
2. Dùng {{LocalDate}}/{{ZonedDateTime}} thay {{Date}}: kiểu mới bất biến, API rõ ràng (không có tháng 0, không có năm 1900 offset).
3. Mỗi định dạng là một hằng {{static final}}; nếu buộc phải dùng định dạng riêng cho đối tác ({{dd/MM/yyyy}}) thì tạo hằng thứ hai, vẫn là formatter bất biến.
4. Parse ngày đối tác: dùng {{DateTimeFormatter}} với {{ResolverStyle.STRICT}} và pattern {{dd/MM/uuuu}} (bắt buộc 4 chữ số năm). 31/02, 31/04, 15/13 đều ném {{DateTimeParseException}}. Nếu dùng SMART (mặc định), 31/02/2026 bị tự điều chỉnh thành 28/02 mà không báo lỗi — cần tránh.

~~~java
private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

String dateCode(Txn t) {
    // epochMilli -> ZonedDateTime -> chỉ lấy phần ngày, rồi format
    return DAY.format(Instant.ofEpochMilli(t.epochMilli()).atZone(ZoneOffset.UTC));
}

// Parse chặt: 31/02 -> DateTimeParseException (không âm thầm ra 02/03 như SimpleDateFormat lenient)
LocalDate d = LocalDate.parse("31/12/2026", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
~~~

### Vì sao hiệu năng vẫn tốt
{{DateTimeFormatter}} chậm hơn {{SimpleDateFormat}} một chút cho **một** lần gọi (khoảng 1,5–2 lần, cỡ vài trăm nano giây), nhưng nó không cần khoá nên khi tải cao nó **thắng rõ**: {{SimpleDateFormat}} có khoá là điểm nghẽn (mọi thread xếp hàng). Trong bài đo của mình trên 4 core, 8 thread format 1 triệu ngày: SimpleDateFormat + synchronized mất khoảng 9 giây, DateTimeFormatter mất khoảng 1,1 giây.

### Trên production thật
- **Quy ước:** cấm {{SimpleDateFormat}}, {{Date}}, {{Calendar}} trong code mới (ràng buộc bằng ArchUnit/Sonar rule, hoặc checkstyle).
- **Cấu hình:** đặt {{spring.jackson.date-format}} không đủ để cứu SimpleDateFormat dùng trong code — phải sửa code.
- **Múi giờ:** formatter không mang múi giờ; luôn nói rõ {{atZone(zone)}} trước khi format. Đây là lỗi thứ hai hay đi kèm (xem bài bug-004 về ngày âm lịch).
- **Test:** mọi lớp có state dùng chung cần một test chạy song song (CountDownLatch để hai thread gặp nhau), chứ không chỉ test tuần tự.
- **Ghi CSV:** dùng {{DateTimeFormatter}} + {{StringBuilder}}, ghi cả dòng lỗi vào file quarantine để đối chiếu.

### Lỗi hay gặp
- **Bọc {{synchronized}} quanh {{SimpleDateFormat}}**: hết sai nhưng throughput giảm mạnh.
- **{{ThreadLocal.withInitial}}**: đúng nhưng dễ rò rỉ (thread pool không remove), và vẫn còn {{Date}} mutable.
- **Đặt {{SimpleDateFormat}} làm biến local mỗi request**: an toàn (mỗi thread một instance) nhưng tạo rác; với tần suất cao nên dùng formatter tĩnh.
- **Dùng {{SimpleDateFormat}} "lenient"** (mặc định): "31/02/2026" **không** báo lỗi mà tự nhảy sang 03/03 — sai dữ liệu âm thầm. {{LocalDate.parse}} không có hành vi này.
- **Quên múi giờ**: formatter không quyết định múi giờ, {{Instant}} + {{systemDefault()}} sẽ lệch ngày ở container chạy UTC.

### Liên hệ phỏng vấn
Câu hỏi "vì sao {{SimpleDateFormat}} không thread-safe và sửa thế nào" là kinh điển. Trả lời phải nêu: (1) state nằm ở **field** {{Calendar}}, không phải biến cục bộ; (2) bean Spring là singleton nên mọi request dùng chung; (3) triệu chứng là ngày sai ngẫu nhiên, không crash, chỉ lộ khi tải cao; (4) cách sửa là {{DateTimeFormatter}} bất biến, không phải {{synchronized}}; (5) {{LocalDate}}/{{ZonedDateTime}} thay {{Date}}; (6) test phải chạy song song có rào chắn để tái hiện.`,
  related: ['scenario-060', 'core-013'],
  tags: ['SimpleDateFormat', 'DateTimeFormatter', 'thread-safe', 'race condition', 'singleton', 'date']
},
{
  id: 'bug-023',
  title: 'Đối soát giao dịch: 10.0 khác 10.00, 3.412 đơn báo lệch mỗi đêm',
  domain: 'Ngân hàng / Đối soát',
  level: 'mid',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Hệ thống đối soát ({{ReconciliationService}}) so khớp **hai nguồn** mỗi đêm: file giao dịch từ cổng thanh toán (đơn vị: đồng, hai chữ số thập phân, ví dụ {{10.00}}, {{1250000.00}}) và sổ cái nội bộ (lưu dạng số thập phân, ví dụ {{10.0}}, {{1250000.0}}). Hai bên có cùng giá trị nhưng **khác số chữ số thập phân**.

**Sự cố:** Sau khi nâng cấp thư viện đọc file đối tác (bản mới trả về {{BigDecimal}} giữ nguyên chuỗi gốc), job đối soát đêm 05/11 báo **3.412 giao dịch lệch** (0,4% tổng số), tổng chênh **1,2 tỷ đồng**; nhưng kiểm tra thủ công thì từng cặp đều **bằng nhau**. Đội đối soát mất 2 ngày kiểm tra và kết luận "hệ thống sai", trong khi thực tế chỉ là **cách so sánh** sai. Cùng lúc, báo cáo tổng tiền theo loại tiền bị chia thành hai nhóm "USD 10.0" và "USD 10.00".

**Nhiệm vụ của bạn:**
1. Đọc code {{ReconciliationService.mismatches}} và dữ liệu mẫu, tìm vì sao hai số bằng nhau vẫn bị kết luận là lệch.
2. Sửa {{amountsEqual}} để so sánh **giá trị**, không so sánh **cách viết**; đồng thời chuẩn hoá số tiền để báo cáo không bị tách nhóm.
3. Bấm **Chạy test**: test dùng dữ liệu mô phỏng đúng file đối tác (có {{10.0}} và {{10.00}}).`,
  artifacts: [
    { name: 'recon-2026-11-05.txt', lang: 'text', content: `PAIR     GATEWAY_AMOUNT   LEDGER_AMOUNT   DIFF_FLAG
TXN-001  1250000.00       1250000.0       MISMATCH
TXN-002  10.00             10.0            MISMATCH
TXN-003  0.10              0.1             MISMATCH
TXN-004  -25.50            -25.5           MISMATCH
TXN-005  1000000.00        1000000.00      ok
-- 855,000 rows checked; 3,412 mismatched (0.40%); total diff 1,204,500,000 VND` },
    { name: 'amount-report.csv', lang: 'text', content: `currency,amount,count
USD,10.0,8812
USD,10.00,8790
USD,10.000,44
VND,1250000.0,12044
VND,1250000.00,11980
# the same money is split into 2-3 buckets -> totals wrong` },
  ],
  starter: `import java.math.BigDecimal;

// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
/** Một cặp cần đối soát: số tiền từ cổng thanh toán và số tiền trong sổ cái. */
record Pair(String id, BigDecimal gatewayAmount, BigDecimal ledgerAmount) {}

// ===== Code cần sửa =====
class ReconciliationService {
    /**
     * So sánh hai số tiền. Trả true nếu coi là KHỚP.
     * Dữ liệu vào có thể khác nhau về số chữ số thập phân.
     */
    boolean amountsEqual(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    /** Chuẩn hoá số tiền để dùng làm khoá gộp báo cáo. */
    BigDecimal normalize(BigDecimal amount) {
        return amount;
    }

    /** Đếm số cặp lệch. */
    long mismatches(java.util.List<Pair> pairs) {
        long bad = 0;
        for (Pair p : pairs) if (!amountsEqual(p.gatewayAmount(), p.ledgerAmount())) bad++;
        return bad;
    }
}`,
  tests: `import java.math.BigDecimal;
import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        ReconciliationService s = new ReconciliationService();

        // 1. Cùng giá trị, khác scale: phải KHỚP
        boolean b1 = s.amountsEqual(new BigDecimal("10.00"), new BigDecimal("10.0"));
        check("muc_bang_nhau_khac_scale", b1,
            "10.00 và 10.0 bằng nhau về giá trị, phải khớp");

        // 2. Khác giá trị thật: phải LỆCH (kể cả khi cùng scale)
        boolean b2 = s.amountsEqual(new BigDecimal("10.00"), new BigDecimal("10.01"));
        check("muc_khac_nhau_thi_lech", !b2,
            "10.00 và 10.01 phải lệch");

        // 3. Số âm và số 0
        boolean b3 = s.amountsEqual(new BigDecimal("-25.50"), new BigDecimal("-25.5"));
        check("so_am_khac_scale", b3, "-25.50 và -25.5 phải khớp");
        boolean b4 = s.amountsEqual(new BigDecimal("0.00"), new BigDecimal("0.0"));
        check("so_khong", b4, "0.00 và 0.0 phải khớp");

        // 4. null: không được ném, và không coi là khớp
        boolean b5 = s.amountsEqual(null, new BigDecimal("1.00"));
        check("null_khong_nem", !b5, "null phải trả false, không ném NPE");
        boolean b6 = s.amountsEqual(new BigDecimal("1.00"), null);
        check("null_phia_sau", !b6, "null phía sau phải trả false");

        // 5. Chuẩn hoá: dùng làm khoá gộp báo cáo -> hai cách viết cùng tiền phải ra cùng một giá trị
        BigDecimal n1 = s.normalize(new BigDecimal("10.00"));
        BigDecimal n2 = s.normalize(new BigDecimal("10.0"));
        BigDecimal n3 = s.normalize(new BigDecimal("10"));
        check("chuan_hoa_gop_nhom", n1.compareTo(n2) == 0 && n2.compareTo(n3) == 0
                && n1.scale() == n2.scale() && n2.scale() == n3.scale(),
            "sau chuẩn hoá phải cùng giá trị và cùng scale, thực tế " + n1 + " / " + n2 + " / " + n3);

        // 6. Dữ liệu mô phỏng file đối tác: không được báo lệch oan
        List<Pair> pairs = List.of(
            new Pair("TXN-001", new BigDecimal("1250000.00"), new BigDecimal("1250000.0")),
            new Pair("TXN-002", new BigDecimal("10.00"), new BigDecimal("10.0")),
            new Pair("TXN-003", new BigDecimal("0.10"), new BigDecimal("0.1")),
            new Pair("TXN-004", new BigDecimal("-25.50"), new BigDecimal("-25.5")),
            new Pair("TXN-005", new BigDecimal("1000000.00"), new BigDecimal("1000000.00")),
            new Pair("TXN-006", new BigDecimal("1000000.00"), new BigDecimal("1000000.01"))
);
        long bad = s.mismatches(pairs);
        check("khong_bao_lech_oan", bad == 1, "chỉ TXN-006 được lệch, thực tế " + bad + " cặp lệch");
        System.out.println("RESULT " + passed + "/" + total);
        poolShutdown();
    }

    static void poolShutdown() { /* không dùng pool trong bài này */ }
}`,
  reference: `import java.math.BigDecimal;

record Pair(String id, BigDecimal gatewayAmount, BigDecimal ledgerAmount) {}

class ReconciliationService {
    // Tiền: luôn chuẩn hoá về 2 chữ số thập phân trước khi so sánh hoặc gộp.
    // Dùng RoundingMode.HALF_UP cho tiền tệ (quy ước phổ biến), không dùng HALF_EVEN trừ khi có yêu cầu.
    private static final int MONEY_SCALE = 2;

    boolean amountsEqual(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return false;
        // KHÔNG dùng a.equals(b): equals so cả scale (10.0 != 10.00).
        // compareTo so GIÁ TRỊ: 10.0 so với 10.00 -> 0 (bằng nhau).
        return a.compareTo(b) == 0;
    }

    /** Chuẩn hoá về đúng MONEY_SCALE để dùng làm khoá gộp báo cáo. */
    BigDecimal normalize(BigDecimal amount) {
        if (amount == null) return null;
        return amount.setScale(MONEY_SCALE, java.math.RoundingMode.HALF_UP);
    }

    long mismatches(java.util.List<Pair> pairs) {
        long bad = 0;
        for (Pair p : pairs) if (!amountsEqual(p.gatewayAmount(), p.ledgerAmount())) bad++;
        return bad;
    }
}`,
  hints: [
    'Đọc dữ liệu: cặp {{10.00}} và {{10.0}} bằng nhau về giá trị nhưng code trả về "lệch". Hãy thử trả lời: {{new BigDecimal("10.00").equals(new BigDecimal("10.0"))}} cho kết quả gì? Vì sao?',
    '{{BigDecimal.equals}} so sánh **cả giá trị và scale** (số chữ số thập phân), vì BigDecimal có field {{intVal}} và {{scale}} và equals so cả hai. Muốn so giá trị thì dùng {{compareTo}}.',
    'Vậy hai chỗ phải sửa: (1) {{amountsEqual}} dùng {{compareTo == 0}}, (2) {{normalize}} gọi {{setScale(2, RoundingMode.HALF_UP)}} để mọi số tiền về cùng scale trước khi gộp báo cáo.',
  ],
  rootCause: `**So sánh tiền bằng {{BigDecimal.equals}} — phương thức này so cả "cách viết" chứ không chỉ giá trị.** {{BigDecimal}} lưu hai phần: {{intVal}} (số nguyên không dấu) và {{scale}} (số chữ số sau dấu phẩy). {{10.00}} có intVal=1000, scale=2; {{10.0}} có intVal=100, scale=1. Vì {{equals}} so cả hai field, hai object "cùng giá trị" vẫn khác nhau. Bản chất: {{BigDecimal.equals}} trả lời "có cùng giá trị **và** cùng cách biểu diễn không?", còn {{compareTo}} trả lời "có cùng giá trị không?".

**Vì sao chỉ xuất hiện sau khi nâng cấp?** Bản cũ của thư viện đọc file trả về số tiền đã chuẩn hoá (luôn 2 chữ số thập phân), nên hai bên tình cờ cùng scale và {{equals}} cho kết quả đúng. Bản mới giữ **nguyên chuỗi gốc** ("10.0" → scale 1), làm lộ ra sai sót vốn có trong cách so sánh. Đây là kiểu bug "im lặng": code sai từ lâu, chỉ chờ dữ liệu vào đủ "sạch" để lộ.

**Vì sao tổng lệch báo 1,2 tỷ?** 3.412 cặp bị đánh dấu lệch, mỗi cặp bị coi là "chưa khớp" nên bị cộng vào dòng "chênh". Con số 1,2 tỷ chính là **tổng số tiền của các cặp bị kết luận oan** — không phải tiền mất thật.

**Vì sao báo cáo tách nhóm?** Khi lấy {{BigDecimal}} làm khoá gộp (ví dụ {{Collectors.groupingBy}} hoặc {{Map}}), khoá dùng {{equals}}/{{hashCode}} → "10.0" và "10.00" thành hai khoá khác nhau. Kết quả: cùng 10 USD nhưng hiện thành 2–3 dòng.

**Lưu ý về hashCode:** {{BigDecimal.hashCode}} cũng nhất quán với {{equals}} (cùng giá trị khác scale → hash khác). Vì vậy nếu chỉ sửa {{amountsEqual}} mà quên chuẩn hoá khi làm khoá, báo cáo vẫn tách nhóm.`,
  fix: `### Cách sửa trong bài
1. **So sánh bằng {{compareTo}}: ** {{a.compareTo(b) == 0}} — đây là so sánh **giá trị**, bỏ qua scale. Đây là cách đúng để so tiền.
2. **Chuẩn hoá scale khi cần làm khoá hoặc khi so sánh nhiều bước: ** {{amount.setScale(2, RoundingMode.HALF_UP)}}. Sau khi chuẩn hoá, {{equals}} và {{hashCode}} cũng dùng được an toàn.
3. **Xử lý null rõ ràng: ** trả false (hoặc ném lỗi tuỳ ngữ cảnh) — đừng để NPE.
4. **Đặt tên biến rõ ràng** ({{amountsEqual}} → {{sameAmount}}) để người sau không hiểu nhầm là so "cùng biểu diễn".

~~~java
// So sánh giá trị: 10.0 và 10.00 -> bằng nhau
boolean same = a.compareTo(b) == 0;

// Khi cần làm khoá gộp / lưu cache: chuẩn hoá trước
BigDecimal key = amount.setScale(2, RoundingMode.HALF_UP);
~~~

### Vì sao không dùng {{double}}
{{double}} là số dấu phẩy động nhị phân: {{0.1}} không biểu diễn được chính xác, nên {{0.1 + 0.2}} ra {{0.30000000000000004}}. Với tiền, sai số tích luỹ sau vài triệu giao dịch là mất tiền thật. {{BigDecimal}} lưu dạng thập phân nên chính xác với tiền.

### Trên production thật
- **Quy ước scale:** với VND (không có phần thập phân) dùng scale 0; với USD/EUR dùng scale 2; với ngoại tệ có 3 chữ số thập phân (ví dụ KWD, BHD) dùng scale 3. Ghi rõ trong lớp {{Money}} hoặc {{Currency}}.
- **Chuẩn hoá tại biên:** ngay khi đọc từ file/DB, chuẩn hoá về scale chuẩn của loại tiền; không để scale "rò rỉ" vào logic nghiệp vụ.
- **DB:** cột tiền nên là {{NUMERIC(19,2)}} (hoặc {{BIGINT}} đơn vị nhỏ nhất). Khi đọc ra, Hibernate trả {{BigDecimal}} với đúng scale của cột, nhưng nếu dùng câu native query tự tính ({{SUM(amount)}}) scale có thể khác — chuẩn hoá sau khi đọc.
- **Không so sánh bằng {{equals}} trong test:** dùng {{compareTo}} hoặc {{assertThat(a).isEqualByComparingTo(b)}} (AssertJ) để test không đỏ vì khác scale.
- **Làm tròn khi chia:** {{divide}} không có scale sẽ ném {{ArithmeticException}} nếu không chia hết — luôn truyền scale và {{RoundingMode}}.

### Lỗi hay gặp
- **{{equals}} cho tiền:** lỗi phổ biến nhất, thường chỉ lộ khi dữ liệu vào khác scale.
- **{{double}}/{{float}} cho tiền:** sai số nhị phân.
- **{{new BigDecimal(0.1)}}:** truyền {{double}} vào constructor sẽ nhận đúng sai số nhị phân của double (0.1000000000000000055511151231257827). Luôn dùng constructor **chuỗi** {{new BigDecimal("0.1")}} hoặc {{BigDecimal.valueOf(0.1)}}.
- **{{divide}} không có rounding:** ném exception với 1/3.
- **Quên chuẩn hoá khi làm khoá:** {{Map}}/{{groupingBy}} dùng {{equals}}/{{hashCode}} nên vẫn tách nhóm.
- **So sánh sau khi đã cộng nhiều lần:** sai số tích luỹ; nên chuẩn hoá ở từng bước hoặc dùng đơn vị nhỏ nhất (long).

### Liên hệ phỏng vấn
Câu hỏi "vì sao {{BigDecimal.equals}} và {{compareTo}} khác nhau, khi nào dùng cái nào" rất hay gặp. Trả lời: {{equals}} so cả scale (theo hợp đồng của BigDecimal, nhất quán với {{hashCode}}), {{compareTo}} so giá trị; với tiền luôn dùng {{compareTo}} hoặc chuẩn hoá scale trước; đừng dùng {{double}}; {{new BigDecimal(double)}} là bẫy; {{divide}} phải có scale + RoundingMode; và nhắc tới quy ước scale theo loại tiền.`,
related: ['banking-036', 'core-021'],
  tags: ['BigDecimal', 'compareTo', 'scale', 'money', 'reconciliation']
},
{
  id: 'bug-024',
  title: 'ThreadLocal lưu userId không remove: request sau thấy user của request trước',
  domain: 'Ngân hàng số / Mobile banking',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** API mobile banking chạy trên Tomcat (thread pool 200 thread). Một filter tự viết đọc token, tra ra userId rồi lưu vào {{UserContext}} (một {{ThreadLocal}}) để các tầng dưới lấy user hiện tại mà không phải truyền tham số. Endpoint {{/history}} trả lịch sử giao dịch của user trong context; nếu không có user thì trả 401.

**Sự cố:** Một khách hàng báo cáo: mở app khi **phiên đăng nhập đã hết hạn**, màn hình vẫn hiện lịch sử giao dịch, nhưng là của **một người khác**. Đội bảo mật tái hiện được khoảng 1 lần mỗi 150 request ẩn danh vào giờ cao điểm. Đây là sự cố lộ dữ liệu cá nhân, phải báo cáo cho bộ phận tuân thủ trong 24 giờ.

**Nhiệm vụ của bạn:** Tìm vì sao user của request trước "chảy" sang request sau và sửa {{AuthFilter}}. Test chạy các request trên **một** worker thread được tái sử dụng, giống Tomcat.`,
  artifacts: [
    { name: 'access.log', lang: 'text', content: `09:41:07.212 [http-nio-8080-exec-17] INFO  AuthFilter : token ok user=U-0451907 path=/history
09:41:07.240 [http-nio-8080-exec-17] INFO  HistoryController : history user=U-0451907 rows=20 status=200
09:41:09.003 [http-nio-8080-exec-17] WARN  AuthFilter : no/expired token path=/history ip=113.161.x.x
09:41:09.031 [http-nio-8080-exec-17] INFO  HistoryController : history user=U-0451907 rows=20 status=200
09:41:11.554 [http-nio-8080-exec-42] INFO  AuthFilter : token ok user=U-0388102 path=/history
09:41:11.570 [http-nio-8080-exec-42] ERROR HistoryController : history failed user=U-0388102 : QueryTimeoutException
09:41:12.118 [http-nio-8080-exec-42] WARN  AuthFilter : no/expired token path=/history ip=27.72.x.x
09:41:12.140 [http-nio-8080-exec-42] INFO  HistoryController : history user=U-0388102 rows=20 status=200` },
    { name: 'AuthFilter.java (bản chạy trên production)', lang: 'java', content: `@Override
protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {
    String token = req.getHeader("Authorization");
    if (token != null && tokenService.isValid(token)) {
        UserContext.set(tokenService.userOf(token));
    } else {
        log.warn("no/expired token path={}", req.getRequestURI());
    }
    chain.doFilter(req, res);
}` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class Request {
    final String token, path;
    Request(String token, String path) { this.token = token; this.path = path; }
}

class UserContext {   // giống SecurityContextHolder / MDC: dữ liệu gắn với THREAD đang chạy
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();
    static void set(String userId) { CURRENT.set(userId); }
    static String get() { return CURRENT.get(); }
    static void clear() { CURRENT.remove(); }
}

class TokenService {
    static String userOf(String token) { return "U-" + token.toUpperCase(); }
}

class HistoryController {
    String handle(Request req) {
        String user = UserContext.get();
        if (user == null) return "401";
        if (req.path.equals("/history-slow")) throw new IllegalStateException("QueryTimeoutException user=" + user);
        return "history:" + user;
    }
}

// ===== Code cần sửa =====
class AuthFilter {
    private final HistoryController controller = new HistoryController();

    String doFilter(Request req) {
        if (req.token != null) {
            UserContext.set(TokenService.userOf(req.token));
        }
        return controller.handle(req);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    // Tomcat tái sử dụng thread: mọi request trong test chạy trên CÙNG một worker thread
    static final ExecutorService worker = Executors.newSingleThreadExecutor();
    static AuthFilter filter = new AuthFilter();

    static String call(String token, String path) throws Exception {
        return worker.submit(() -> {
            try { return filter.doFilter(new Request(token, path)); }
            catch (RuntimeException e) { return "500"; }
        }).get(5, TimeUnit.SECONDS);
    }

    public static void main(String[] args) throws Exception {
        String a = call("alice", "/history");
        check("co_token_thay_lich_su_cua_minh", "history:U-ALICE".equals(a), "user có token phải thấy lịch sử của mình, thực tế " + a);

        String anon = call(null, "/history");
        check("an_danh_khong_thay_du_lieu_nguoi_truoc", "401".equals(anon),
            "request không token phải nhận 401, thực tế " + anon + " (lộ dữ liệu người trước)");

        String err = call("bob", "/history-slow");
        String anon2 = call(null, "/history");
        check("sau_exception_context_van_duoc_don", "500".equals(err) && "401".equals(anon2),
            "request lỗi của bob không được để lại user cho request sau, thực tế " + err + " rồi " + anon2);

        String left = worker.submit(() -> String.valueOf(UserContext.get())).get(5, TimeUnit.SECONDS);
        check("thread_tra_ve_pool_sach_se", "null".equals(left), "sau mỗi request ThreadLocal phải trống, thực tế " + left);

        worker.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `class Request {
    final String token, path;
    Request(String token, String path) { this.token = token; this.path = path; }
}

class UserContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();
    static void set(String userId) { CURRENT.set(userId); }
    static String get() { return CURRENT.get(); }
    static void clear() { CURRENT.remove(); }
}

class TokenService {
    static String userOf(String token) { return "U-" + token.toUpperCase(); }
}

class HistoryController {
    String handle(Request req) {
        String user = UserContext.get();
        if (user == null) return "401";
        if (req.path.equals("/history-slow")) throw new IllegalStateException("QueryTimeoutException user=" + user);
        return "history:" + user;
    }
}

class AuthFilter {
    private final HistoryController controller = new HistoryController();

    String doFilter(Request req) {
        try {
            if (req.token != null) {
                UserContext.set(TokenService.userOf(req.token));
            }
            return controller.handle(req);
        } finally {
            UserContext.clear();   // luôn dọn, kể cả khi controller ném exception: thread sắp quay về pool
        }
    }
}`,
  hints: [
    'Log: cùng thread http-nio-8080-exec-17, request không token ngay sau request của U-0451907 lại trả lịch sử của U-0451907. Giá trị trong ThreadLocal sống bao lâu?',
    'ThreadLocal gắn với thread, không gắn với request. Thread của Tomcat được tái sử dụng, nên nếu không xoá thì giá trị của request trước vẫn còn ở request sau.',
    'Bọc phần xử lý trong try/finally và gọi UserContext.clear() (ThreadLocal.remove()) trong finally, để cả nhánh exception cũng được dọn.',
  ],
  rootCause: `**ThreadLocal không được dọn khi thread quay về pool.** {{UserContext}} lưu user trong {{ThreadLocal}}, tức là gắn với **thread** chứ không phải với request. Tomcat tái sử dụng 200 worker thread cho mọi request. Filter chỉ {{set}} khi có token hợp lệ và **không bao giờ gọi** {{remove()}}, nên:
- Request ẩn danh rơi vào thread vừa phục vụ U-0451907 vẫn đọc được {{U-0451907}} (log: cùng thread {{exec-17}}, dòng {{no/expired token}} rồi {{history user=U-0451907 status=200}}).
- Nhánh exception cũng để lại user ({{exec-42}}: request của U-0388102 lỗi {{QueryTimeoutException}}, request ẩn danh sau đó nhận dữ liệu của U-0388102).

Tỉ lệ "khoảng 1/150 request" phản ánh xác suất một request ẩn danh rơi vào thread đã từng phục vụ user khác mà chưa bị ghi đè.`,
  fix: `### Cách sửa
Bọc toàn bộ xử lý trong {{try/finally}} và gọi {{UserContext.clear()}} (bên trong là {{ThreadLocal.remove()}}) ở {{finally}}. Quy tắc: **ai set thì người đó remove, trong finally**. Không dùng {{set(null)}}: nó vẫn giữ entry trong map của thread.

### Trên production thật
- Dùng cơ chế có sẵn của framework thay vì tự viết: Spring Security tự dọn {{SecurityContextHolder}} sau mỗi request (qua {{SecurityContextHolderFilter}}); với log, dùng {{MDC.clear()}} hoặc {{MDC.putCloseable}} trong filter.
- Thread pool tự quản ({{ExecutorService}}, {{@Async}}) cũng có vấn đề này: context không tự truyền sang thread mới và không tự dọn. Dùng {{TaskDecorator}} để copy context vào và dọn sau khi task chạy xong.
- Ngoài lộ dữ liệu, ThreadLocal không dọn còn gây **memory leak**: object lớn (hoặc ClassLoader khi redeploy) bị giữ bởi thread sống mãi.
- Java 21: virtual thread không được pool nên ít gặp lỗi "chảy" context, nhưng hàng triệu virtual thread mỗi cái giữ một bản sao ThreadLocal thì tốn bộ nhớ. {{ScopedValue}} (preview trong 21, final trong 25) là cách thay thế có phạm vi rõ ràng.

### Phòng ngừa
- Test chạy nhiều request trên **cùng một** thread (single-thread executor) như bài này; test mỗi request một thread mới sẽ không bao giờ thấy lỗi.
- Review: mỗi {{ThreadLocal.set}} phải có {{remove}} trong {{finally}} tương ứng.

### Liên hệ phỏng vấn
Câu "ThreadLocal dùng khi nào và rủi ro gì trong thread pool?" rất hay gặp. Trả lời đủ 2 rủi ro: lộ dữ liệu giữa request (bảo mật) và memory leak, kèm cách dọn bằng try/finally và TaskDecorator.

> Senior tip: ThreadLocal là "biến toàn cục theo thread". Trong thread pool, thread sống lâu hơn request rất nhiều. Luôn dùng try/finally để remove. Nếu framework có sẵn (Spring Security, MDC) hãy dùng thay vì tự viết — đã được test kỹ hơn.`,
  related: ['concurrency-008', 'concurrency-007'],
  tags: ['ThreadLocal', 'thread pool', 'security', 'data leak', 'context propagation']
},
{
  id: 'bug-025',
  title: 'Connection leak: mở JDBC Connection thủ công không đóng khi có exception, pool cạn sau vài giờ',
  domain: 'Fintech / Báo cáo merchant',
  level: 'senior',
  severity: 'P1',
  minutes: 20,
  story: `**Bối cảnh dự án:** Service báo cáo cho merchant mượn connection từ **pool** (trong dự án thật là HikariCP) để chạy truy vấn báo cáo. Pool có kích thước cố định.

**Sự cố:** Một merchant có dữ liệu lỗi khiến truy vấn báo cáo ném exception. Sau vài lần merchant đó bấm "Tải lại", **toàn bộ** service báo lỗi {{Connection is not available, request timed out after 30000ms}} cho mọi merchant khác. Restart pod thì hết, vài giờ sau lại bị. Pool có 10 connection, nhưng dashboard cho thấy 10/10 đang "active" dù DB không có query nào chạy.

**Nhiệm vụ của bạn:** Tìm vì sao connection không quay về pool và sửa {{ReportService.monthlyReport}}.`,
  artifacts: [
    { name: 'report-service.log', lang: 'text', content: `14:02:11.402 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
14:02:19.877 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
14:02:25.130 ERROR ReportService : report failed merchant=M-0091 : java.lang.IllegalStateException: corrupt row id=88123
... (7 more)
14:04:02.611 WARN  HikariPool-1  : Connection leak detection triggered for conn10 on thread http-nio-8080-exec-4, stack trace follows
        at ReportService.monthlyReport(ReportService.java:21)
14:05:40.003 ERROR ReportService : report failed merchant=M-0007 : SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms (total=10, active=10, idle=0, waiting=37)` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng HikariCP, KHÔNG cần sửa) =====
class PoolExhaustedException extends RuntimeException {
    PoolExhaustedException(String m) { super(m); }
}

class ConnectionPool {
    private final int max;
    private int inUse = 0;
    ConnectionPool(int max) { this.max = max; }
    synchronized Connection borrow() {
        if (inUse >= max) throw new PoolExhaustedException("Connection is not available (active=" + inUse + "/" + max + ")");
        inUse++;
        return new Connection(this);
    }
    synchronized void giveBack() { inUse--; }
    synchronized int active() { return inUse; }
}

class Connection implements AutoCloseable {
    private final ConnectionPool pool;
    private boolean closed = false;
    Connection(ConnectionPool pool) { this.pool = pool; }
    String query(String merchantId) {
        if (merchantId.startsWith("BAD")) throw new IllegalStateException("corrupt row for " + merchantId);
        return "report:" + merchantId;
    }
    @Override public void close() {            // trả connection về pool (gọi nhiều lần cũng an toàn)
        if (!closed) { closed = true; pool.giveBack(); }
    }
}

// ===== Code cần sửa =====
class ReportService {
    private final ConnectionPool pool;
    ReportService(ConnectionPool pool) { this.pool = pool; }

    String monthlyReport(String merchantId) {
        Connection c = pool.borrow();
        String data = c.query(merchantId);
        c.close();
        return data;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        ConnectionPool pool = new ConnectionPool(3);
        ReportService s = new ReportService(pool);

        check("bao_cao_binh_thuong", "report:M-1".equals(s.monthlyReport("M-1")) && pool.active() == 0,
            "báo cáo bình thường phải trả connection, active=" + pool.active());

        int errors = 0;
        for (int i = 0; i < 10; i++) {
            try { s.monthlyReport("BAD-91"); } catch (IllegalStateException e) { errors++; } catch (RuntimeException e) { /* pool cạn */ }
        }
        check("loi_du_lieu_van_tra_connection", errors == 10 && pool.active() == 0,
            "sau 10 lần lỗi dữ liệu, pool phải trống (active=0), thực tế active=" + pool.active() + ", lỗi đúng kiểu=" + errors);

        String after = null;
        try { after = s.monthlyReport("M-7"); } catch (RuntimeException e) { after = "EXC " + e.getMessage(); }
        check("merchant_khac_khong_bi_anh_huong", "report:M-7".equals(after), "merchant khác phải chạy được, thực tế " + after);

        boolean propagated = false;
        try { s.monthlyReport("BAD-2"); } catch (IllegalStateException e) { propagated = true; } catch (RuntimeException e) { propagated = false; }
        check("loi_goc_khong_bi_nuot", propagated, "lỗi dữ liệu phải được ném ra cho controller (không nuốt, không đổi kiểu)");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class PoolExhaustedException extends RuntimeException {
    PoolExhaustedException(String m) { super(m); }
}

class ConnectionPool {
    private final int max;
    private int inUse = 0;
    ConnectionPool(int max) { this.max = max; }
    synchronized Connection borrow() {
        if (inUse >= max) throw new PoolExhaustedException("Connection is not available (active=" + inUse + "/" + max + ")");
        inUse++;
        return new Connection(this);
    }
    synchronized void giveBack() { inUse--; }
    synchronized int active() { return inUse; }
}

class Connection implements AutoCloseable {
    private final ConnectionPool pool;
    private boolean closed = false;
    Connection(ConnectionPool pool) { this.pool = pool; }
    String query(String merchantId) {
        if (merchantId.startsWith("BAD")) throw new IllegalStateException("corrupt row for " + merchantId);
        return "report:" + merchantId;
    }
    @Override public void close() {
        if (!closed) { closed = true; pool.giveBack(); }
    }
}

class ReportService {
    private final ConnectionPool pool;
    ReportService(ConnectionPool pool) { this.pool = pool; }

    String monthlyReport(String merchantId) {
        // try-with-resources: close() luôn được gọi, kể cả khi query ném exception
        try (Connection c = pool.borrow()) {
            return c.query(merchantId);
        }
    }
}`,
  hints: [
    'Đi theo đường chạy khi query ném exception: dòng c.close() có được chạy không?',
    'Mỗi lần lỗi, một connection bị "mượn" mà không bao giờ trả. Pool có giới hạn nên sau vài lần lỗi thì cạn.',
    'Connection implements AutoCloseable: dùng try-with-resources để close luôn chạy. Đừng bắt và nuốt exception — controller vẫn cần biết lỗi.',
  ],
  rootCause: `**Rò rỉ connection trên nhánh lỗi.** {{c.close()}} chỉ chạy khi {{query}} thành công; khi dữ liệu lỗi làm {{query}} ném exception, method thoát ngay và connection **không bao giờ được trả về pool**. Merchant M-0091 bấm tải lại 10 lần → 10/10 connection bị giữ vĩnh viễn ({{active=10, idle=0}} trong khi DB không chạy query nào) → mọi request khác chờ 30 giây rồi lỗi. Dòng {{Connection leak detection triggered ... at ReportService.monthlyReport}} của HikariCP chỉ thẳng vào chỗ mượn connection mà không trả. Restart pod "chữa" được vì tạo pool mới.`,
  fix: `### Cách sửa
Dùng **try-with-resources**: {{close()}} được gọi khi rời khối, kể cả khi có exception; exception gốc vẫn được ném ra cho controller xử lý.
~~~java
try (Connection c = pool.borrow()) {
    return c.query(merchantId);
}
~~~

### Trên production thật
- Trong Spring, hầu như **không tự mượn connection**: dùng {{JdbcTemplate}}, Spring Data, hoặc {{@Transactional}} — framework tự trả connection. Rò rỉ thường xuất hiện khi tự gọi {{dataSource.getConnection()}}, tự mở {{EntityManager}}, hoặc stream kết quả ({{Stream<T>}} từ repository) mà không đóng.
- Bật **{{leakDetectionThreshold}}** của HikariCP (ví dụ 20000ms) ở môi trường test và staging: Hikari in stack trace nơi mượn connection quá lâu.
- Theo dõi metric {{hikaricp_connections_active}} và {{hikaricp_connections_pending}}; cảnh báo khi active chạm max kéo dài.
- Lỗi do **một** merchant không được làm sập **mọi** merchant: cân nhắc bulkhead (pool riêng cho báo cáo nặng) và timeout truy vấn.

### Phòng ngừa
- Static analysis (SpotBugs OBL_UNSATISFIED_OBLIGATION, Sonar "Resources should be closed").
- Test nhánh lỗi: sau N lần lỗi, pool phải trống.

### Liên hệ phỏng vấn
Câu "service báo hết connection nhưng DB rảnh — bạn điều tra thế nào?" rất hay gặp: nêu leak detection của Hikari, metric active/idle/pending, thread dump, và try-with-resources/để framework quản lý connection.

> Senior tip: Connection pool leak là "killer" lặng lẽ: hệ thống chạy ngon vài giờ rồi chết hẳn. Luôn bật leakDetectionThreshold ở staging, và nhớ rằng Spring quản lý connection tốt hơn code thủ công. Nếu buộc phải tự mượn, try-with-resources là bắt buộc.`,
  related: ['core-015'],
  tags: ['connection pool', 'HikariCP', 'resource leak', 'try-with-resources']
},
{
  id: 'bug-026',
  title: 'Chuyển tiền xong, ghi audit log lỗi: tiền đã trừ mà không rollback',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ví điện tử (Spring Boot 3, Spring Data JPA, PostgreSQL). Service {{wallet-service}} có class {{TransferServiceImpl}}: {{transfer}} là method public mà controller gọi, nó kiểm tra số dư rồi gọi {{debitAndLog}} — method **được đánh dấu {{@Transactional}}** (trong bài mô phỏng bằng {{@Tx}}), với ý định "mọi việc bên trong sẽ được rollback khi lỗi". Bên trong {{debitAndLog}}: trừ ví người gửi, cộng ví người nhận, ghi sổ cái {{ledger}}, rồi ghi **audit log** (bản ghi ai làm gì lúc nào, phục vụ điều tra và kiểm toán).

**Sự cố:** Đêm 14/11, đối soát báo **512 giao dịch** đã trừ tiền thành công nhưng **thiếu bản ghi audit**. Trong log ứng dụng, đúng những dòng đó in lỗi {{AuditWriteException: value too long for type character varying(64)}} (đối tác mới trả mã tham chiếu 96 ký tự, cột {{audit_log.ref}} chỉ {{varchar(64)}}). Quan trọng hơn: **không có một dòng "Initiating transaction rollback" nào** suốt đêm, và metric {{transaction_rolled_back = 0}} dù có 512 lỗi. Đã trừ tiền của khách, đã cộng cho người nhận, sổ cái vẫn có dòng SUCCESS — chỉ audit là thiếu, nên pháp chế phải tạm khoá 512 tài khoản để điều tra.

**Nhiệm vụ của bạn:** Code đã có {{@Tx}} (mô phỏng {{@Transactional}}), một {{TxManager}} mô phỏng transaction của DB (chỉ ghi thật khi commit, rollback thì trả lại ảnh chụp ban đầu), và một {{TxProxy}} mô phỏng proxy AOP của Spring. Hãy tìm vì sao lỗi ghi audit không làm rollback việc chuyển tiền, và sửa phần "Code cần sửa".`,
  artifacts: [
    { name: 'transfer-service.log', lang: 'text', content: `# logging.level.org.springframework.transaction.interceptor=TRACE
02:14:03.118 TRACE TransactionInterceptor : Don't need to create transaction for [com.wallet.TransferServiceImpl.transfer]: This method isn't transactional.
02:14:03.121 DEBUG SqlExecutor        : update wallets set balance = 488000, version = 8 where id = 'W-77302'
02:14:03.122 DEBUG SqlExecutor        : update wallets set balance = 12000, version = 3 where id = 'W-10457'
02:14:03.124 DEBUG SqlExecutor        : insert into ledger (ref, amount, state) values ('TR-77120', 25000, 'SUCCESS')
02:14:03.127 ERROR AuditLogWriter     : insert audit failed ref=TR-77120 reason=value too long for type character varying(64)
02:14:03.127 ERROR AuditLogWriter     : com.wallet.audit.AuditWriteException: value too long for type character varying(64)
02:14:03.128 ERROR TransferController : transfer failed : AuditWriteException
02:14:03.129 INFO  TransferController : response 500 Internal Server Error ref=TR-77120
# 512 dòng sự cố đều kết thúc như trên: KHÔNG có "Getting transaction for [...]" quanh transfer,
# và không một dòng "Initiating transaction rollback" nào trong đêm 14/11.` },
    { name: 'audit-gap-report.txt', lang: 'text', content: `WALLET AUDIT GAP REPORT 2026-11-14 06:00 ICT
Transfers completed (balance changed)   : 41,882
Ledger rows written                     : 41,882
Audit log rows written                  : 41,370
Transfers missing an audit row          : 512
Total amount moved without audit trail  : 11,640,000,000 VND
Error signature                         : AuditWriteException (value too long), no rollback log line
Metric (AppDynamics, 24h)               : transaction_started = 41,882   transaction_rolled_back = 0` },
    { name: 'AuditLogWriter.java', lang: 'java', content: `@Component
public class AuditLogWriter {
    private final JdbcTemplate jdbc;

    // Cột audit_log.ref là varchar(64); đối tác mới trả mã 96 ký tự.
    public void write(String ref, String actor) {
        jdbc.update("insert into audit_log(ref, actor) values (?, ?)", ref, actor);
    }
}` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng Spring AOP + transaction, KHÔNG cần sửa) =====
@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@interface Tx {}   // mô phỏng @Transactional

class AuditWriteException extends RuntimeException {
    AuditWriteException(String m) { super(m); }
}

/** Đối tác mới trả mã tham chiếu 96 ký tự, nhưng cột audit_log.ref chỉ varchar(64). */
interface AuditLog {
    void write(String ref, String actor);
}

class Db {   // mô phỏng PostgreSQL: bảng wallets + bảng ledger
    final Map<String, Long> wallets = new HashMap<>();
    final List<String> ledger = new ArrayList<>();
}

class TxManager {   // REQUIRED: đang có transaction thì tham gia, chưa có thì mở mới
    private final Db db;
    private Map<String, Long> walletSnapshot;
    private List<String> ledgerSnapshot;
    private int depth = 0;
    int physicalBegins = 0;
    int commits = 0;
    int rollbacks = 0;
    TxManager(Db db) { this.db = db; }
    void begin() {
        if (depth++ > 0) return;
        physicalBegins++;
        walletSnapshot = new HashMap<>(db.wallets);
        ledgerSnapshot = new ArrayList<>(db.ledger);
    }
    void commit() { if (--depth == 0) commits++; }
    void rollback() {
        if (--depth > 0) return;
        db.wallets.clear(); db.wallets.putAll(walletSnapshot);
        db.ledger.clear(); db.ledger.addAll(ledgerSnapshot);
        rollbacks++;
    }
}

class TxProxy {   // giống proxy Spring tạo cho bean có @Transactional
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface, TxManager tx) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (p, m, args) -> {
            boolean transactional = target.getClass().getMethod(m.getName(), m.getParameterTypes()).isAnnotationPresent(Tx.class);
            if (!transactional) return invoke(m, target, args);
            tx.begin();
            try {
                Object r = invoke(m, target, args);
                tx.commit();
                return r;
            } catch (RuntimeException e) {
                tx.rollback();
                throw e;
            }
        });
    }
    private static Object invoke(java.lang.reflect.Method m, Object target, Object[] args) {
        try { return m.invoke(target, args); }
        catch (java.lang.reflect.InvocationTargetException e) { throw (RuntimeException) e.getCause(); }
        catch (IllegalAccessException e) { throw new IllegalStateException(e); }
    }
}

// ===== Code cần sửa =====
interface TransferService {
    String transfer(String from, String to, long amountVnd);   // trả về mã tham chiếu
}

class TransferServiceImpl implements TransferService {
    private final Db db;
    private final AuditLog audit;
    TransferServiceImpl(Db db, AuditLog audit) { this.db = db; this.audit = audit; }

    public String transfer(String from, String to, long amountVnd) {
        if (amountVnd <= 0) throw new IllegalArgumentException("amount must be > 0");
        return debitAndLog(from, to, amountVnd);
    }

    @Tx
    public String debitAndLog(String from, String to, long amountVnd) {
        long balance = db.wallets.getOrDefault(from, 0L);
        if (balance < amountVnd) throw new IllegalStateException("insufficient balance " + from);
        db.wallets.put(from, balance - amountVnd);                        // trừ tiền người gửi
        db.wallets.put(to, db.wallets.getOrDefault(to, 0L) + amountVnd);  // cộng người nhận
        String ref = "TR-" + (db.ledger.size() + 77000);
        db.ledger.add(ref + "|" + from + "->" + to + "|" + amountVnd);
        audit.write(ref, "svc:transfer");                                 // có thể ném AuditWriteException
        return ref;
    }
}

class TransferModule {   // nơi "Spring" tạo bean: controller nhận về proxy
    static TransferService create(Db db, TxManager tx, AuditLog audit) {
        return TxProxy.wrap(new TransferServiceImpl(db, audit), TransferService.class, tx);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        Db db = new Db();
        db.wallets.put("W-1", 500_000L);
        db.wallets.put("W-2", 0L);
        TxManager tx = new TxManager(db);
        AuditLog good = (ref, actor) -> { };
        TransferService ok = TransferModule.create(db, tx, good);

        String ref = ok.transfer("W-1", "W-2", 120_000L);
        check("chuyen_thanh_cong", ref != null && db.wallets.get("W-1") == 380_000L && db.wallets.get("W-2") == 120_000L,
            "chuyển 120000 phải còn 380000 và người nhận có 120000, thực tế " + db.wallets.get("W-1") + "/" + db.wallets.get("W-2"));
        check("chuyen_thanh_cong_ghi_ledger", db.ledger.size() == 1 && db.ledger.get(0).contains("120000"),
            "phải có đúng 1 dòng ledger, thực tế " + db.ledger);

        int beginsBefore = tx.physicalBegins;
        ok.transfer("W-1", "W-2", 10_000L);
        check("moi_lan_chuyen_mo_dung_mot_transaction", tx.physicalBegins - beginsBefore == 1,
            "mỗi lần chuyển phải mở đúng 1 transaction, thực tế mở " + (tx.physicalBegins - beginsBefore));

        // Đúng như sự cố: ghi audit lỗi -> phải rollback cả hai ví và ledger
        long fromBefore = db.wallets.get("W-1");
        long toBefore = db.wallets.get("W-2");
        int ledgerBefore = db.ledger.size();
        AuditLog broken = (r, actor) -> { throw new AuditWriteException("value too long for type character varying(64)"); };
        TransferService bad = TransferModule.create(db, tx, broken);
        AuditWriteException err = null;
        try { bad.transfer("W-1", "W-2", 300_000L); } catch (AuditWriteException e) { err = e; }
        check("loi_audit_khong_tru_tien", err != null && db.wallets.get("W-1") == fromBefore && db.wallets.get("W-2") == toBefore,
            "audit lỗi phải rollback: ví gửi giữ " + fromBefore + " và ví nhận giữ " + toBefore
                + ", thực tế " + db.wallets.get("W-1") + "/" + db.wallets.get("W-2"));
        check("loi_audit_khong_de_lai_ledger_rac", db.ledger.size() == ledgerBefore,
            "không được để lại dòng ledger của lần lỗi, thực tế " + db.ledger);
        check("loi_audit_duoc_nem_ra", err != null,
            "lỗi ghi audit phải ném ra để controller trả 500, thực tế " + err);
        check("co_that_su_rollback", tx.rollbacks > 0,
            "phải có ít nhất 1 lần rollback thật, thực tế " + tx.rollbacks);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@interface Tx {}

class AuditWriteException extends RuntimeException {
    AuditWriteException(String m) { super(m); }
}

interface AuditLog {
    void write(String ref, String actor);
}

class Db {
    final Map<String, Long> wallets = new HashMap<>();
    final List<String> ledger = new ArrayList<>();
}

class TxManager {
    private final Db db;
    private Map<String, Long> walletSnapshot;
    private List<String> ledgerSnapshot;
    private int depth = 0;
    int physicalBegins = 0;
    int commits = 0;
    int rollbacks = 0;
    TxManager(Db db) { this.db = db; }
    void begin() {
        if (depth++ > 0) return;
        physicalBegins++;
        walletSnapshot = new HashMap<>(db.wallets);
        ledgerSnapshot = new ArrayList<>(db.ledger);
    }
    void commit() { if (--depth == 0) commits++; }
    void rollback() {
        if (--depth > 0) return;
        db.wallets.clear(); db.wallets.putAll(walletSnapshot);
        db.ledger.clear(); db.ledger.addAll(ledgerSnapshot);
        rollbacks++;
    }
}

class TxProxy {
    @SuppressWarnings("unchecked")
    static <T> T wrap(T target, Class<T> iface, TxManager tx) {
        return (T) java.lang.reflect.Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (p, m, args) -> {
            boolean transactional = target.getClass().getMethod(m.getName(), m.getParameterTypes()).isAnnotationPresent(Tx.class);
            if (!transactional) return invoke(m, target, args);
            tx.begin();
            try {
                Object r = invoke(m, target, args);
                tx.commit();
                return r;
            } catch (RuntimeException e) {
                tx.rollback();
                throw e;
            }
        });
    }
    private static Object invoke(java.lang.reflect.Method m, Object target, Object[] args) {
        try { return m.invoke(target, args); }
        catch (java.lang.reflect.InvocationTargetException e) { throw (RuntimeException) e.getCause(); }
        catch (IllegalAccessException e) { throw new IllegalStateException(e); }
    }
}

// ===== Code đã sửa =====
// Sửa 1: đặt @Tx lên transfer (method public mà controller gọi) -> lời gọi đi qua proxy, transaction được mở.
// Sửa 2: bỏ lời gọi nội bộ debitAndLog(...) (self-invocation) và gộp phần thân vào transfer:
//         mọi thao tác nằm trong đúng MỘT transaction, lỗi audit sẽ rollback cả hai ví và ledger.
interface TransferService {
    String transfer(String from, String to, long amountVnd);
}

class TransferServiceImpl implements TransferService {
    private final Db db;
    private final AuditLog audit;
    TransferServiceImpl(Db db, AuditLog audit) { this.db = db; this.audit = audit; }

    @Tx
    public String transfer(String from, String to, long amountVnd) {
        if (amountVnd <= 0) throw new IllegalArgumentException("amount must be > 0");
        long balance = db.wallets.getOrDefault(from, 0L);
        if (balance < amountVnd) throw new IllegalStateException("insufficient balance " + from);
        db.wallets.put(from, balance - amountVnd);
        db.wallets.put(to, db.wallets.getOrDefault(to, 0L) + amountVnd);
        String ref = "TR-" + (db.ledger.size() + 77000);
        db.ledger.add(ref + "|" + from + "->" + to + "|" + amountVnd);
        audit.write(ref, "svc:transfer");
        return ref;
    }
}

class TransferModule {
    static TransferService create(Db db, TxManager tx, AuditLog audit) {
        return TxProxy.wrap(new TransferServiceImpl(db, audit), TransferService.class, tx);
    }
}`,
  hints: [
    'Đọc log: có dòng {{Getting transaction for [...transfer]}} nào không? Và có dòng {{Initiating transaction rollback}} nào trong đêm đó không? Nếu không, có transaction nào thật sự được mở cho method bị lỗi không?',
    'transfer được gọi qua proxy, nhưng chính nó không có {{@Tx}}; {{@Tx}} lại nằm trên {{debitAndLog}} — method chỉ được gọi từ bên trong transfer, tức {{this.debitAndLog(...)}}: lời gọi trên chính object thật, không đi qua proxy, nên annotation không có tác dụng.',
    'Cách sửa: đặt {{@Tx}} lên transfer (method public mà controller gọi) và bỏ lời gọi nội bộ debitAndLog, gộp thân nó vào transfer. Khi đó mọi thao tác nằm trong một transaction, và {{AuditWriteException}} (là RuntimeException) sẽ làm rollback cả hai ví và ledger.',
  ],
  rootCause: `**{{@Transactional}} đặt trên method chỉ được gọi nội bộ nên không bao giờ có hiệu lực.** Proxy AOP của Spring chỉ mở transaction cho method **được gọi từ bên ngoài, đi qua proxy**. Controller gọi {{transfer}} qua proxy, nhưng {{transfer}} không có annotation, nên proxy gọi thẳng vào object thật — log TRACE có đúng dòng {{Don't need to create transaction for [...transfer]: This method isn't transactional}}. Bên trong, {{debitAndLog(...)}} thực chất là {{this.debitAndLog(...)}}: lời gọi trên chính object thật, không đi qua proxy, nên {{@Tx}} trên nó **không có tác dụng gì** — không có transaction nào được mở.

Hệ quả: {{update wallets}} và {{insert into ledger}} chạy ở chế độ auto-commit (mỗi câu lệnh tự commit ngay khi chạy xong, không có "khối" để hủy). Khi {{audit.write}} ném {{AuditWriteException}}, đã không còn gì để rollback: tiền đã rời ví người gửi, đã vào ví người nhận, dòng ledger vẫn còn, chỉ audit bị thiếu. Dấu hiệu khớp chính xác với số liệu: {{transaction_started = 41,882}} nhưng {{transaction_rolled_back = 0}} — không một lần rollback nào, dù có 512 lỗi ghi audit.`,
  fix: `### Tóm tắt
Đặt {{@Transactional}} lên **method public ngoài cùng mà bên ngoài gọi vào** ({{transfer}}), và không gọi method có transaction qua {{this}} từ bên trong nó. Khi đó proxy mở transaction trước khi vào method, mọi exception unchecked thoát ra ({{AuditWriteException}} là {{RuntimeException}}) sẽ kích hoạt rollback: ví người gửi, ví người nhận và ledger trở về trạng thái ban đầu.

### So sánh các cách sửa
| Cách | Khi nào dùng | Ghi chú |
|---|---|---|
| {{@Transactional}} trên method public được gọi từ ngoài | Hầu hết trường hợp | Không thêm class, chỉ sửa annotation và gộp method |
| Tách phần cần transaction sang **bean khác** rồi inject | Khi cần ranh giới riêng (ví dụ {{REQUIRES_NEW}}) | Lời gọi lúc này đi qua proxy của bean kia |
| {{TransactionTemplate}} | Cần ranh giới transaction tường minh trong code | Code dài hơn một chút |
| Tự inject chính mình ({{@Lazy}} self-injection) hoặc {{AopContext.currentProxy()}} | Chỉ khi buộc phải giữ cấu trúc cũ | Khó đọc, dễ sai, không khuyến khích |

~~~java
// Nếu cần hai ranh giới khác nhau: tách bean.
@Service
public class TransferFacade {
    private final LedgerWriter ledgerWriter;     // bean KHÁC -> lời gọi đi qua proxy
    private final WalletRepository wallets;
    private final AuditLog audit;

    @Transactional
    public String transfer(String from, String to, long amount) {
        long balance = wallets.balanceOf(from);
        if (balance < amount) throw new IllegalStateException("insufficient balance");
        wallets.debit(from, amount);
        wallets.credit(to, amount);
        String ref = ledgerWriter.newRef();
        ledgerWriter.success(ref, from, to, amount);
        audit.write(ref, "svc:transfer");        // lỗi ở đây -> rollback toàn bộ
        return ref;
    }
}
~~~

### Audit có nên nằm trong cùng transaction?
Đây là phần đáng nói khi phỏng vấn. Hai lựa chọn, đánh đổi khác nhau:
- **Cùng transaction** (như bài này): không bao giờ có giao dịch thiếu audit. Nhược điểm: audit lỗi sẽ làm chết giao dịch nghiệp vụ, và audit không ghi được gì nếu transaction rollback.
- **Transaction riêng ({{REQUIRES_NEW}}) hoặc outbox**: nghiệp vụ không bị audit kéo chết, nhưng phải chấp nhận audit có thể lệch và cần job đối soát. Nếu chọn hướng này, phải nói rõ cách bù: ghi vào bảng outbox trong cùng transaction rồi relay gửi đi, hoặc log + alert khi ghi audit thất bại.
Điểm sai **không được** làm: bắt exception rồi bỏ qua im lặng (không log, không alert) — khi kiểm toán hỏi thì không có cả dấu vết.

### Trên production thật
- Bật {{logging.level.org.springframework.transaction.interceptor=TRACE}} ở staging: mỗi transaction thật in một cặp {{Getting transaction for [...]}} rồi {{Completing transaction for [...]}}. Thiếu cặp dòng này quanh một method = method đó không có transaction.
- Viết **integration test** (Spring context + Testcontainers PostgreSQL) cho nhánh lỗi, đừng chỉ unit test: unit test gọi {{new TransferServiceImpl(...)}} sẽ bỏ qua proxy, nên **không bao giờ** bắt được self-invocation.
- Chặn dữ liệu quá dài ở đầu vào ({{@Size(max = 64)}} trên DTO, hoặc kiểm tra độ dài trước khi ghi) để lỗi lộ ra ở biên hệ thống, không phải giữa transaction.
- Cân nhắc giữ transaction ngắn: ở ví điện tử, nhiều hệ thống trừ tiền trong transaction ngắn rồi mới ghi audit/ledger qua outbox, kèm job đối soát.

### Phòng ngừa
- Quy tắc review: {{@Transactional}} trên method **private/protected/final**, hoặc trên method chỉ được gọi nội bộ, là dấu hiệu sai; IntelliJ cảnh báo cả trường hợp gọi method {{@Transactional}} qua {{this}}.
- Đặt annotation ở tầng service, không đặt ở controller.
- Kiểm thử nhánh lỗi: sau khi dependency ném exception, số dư hai ví và ledger phải **không đổi** so với trước khi gọi.

### Liên hệ phỏng vấn
Đây là câu Spring kinh điển "Vì sao {{@Transactional}} không hoạt động?". Trả lời theo thứ tự hay gặp: (1) self-invocation — gọi method có annotation qua {{this}}; (2) method không public hoặc class/method {{final}} nên không proxy được; (3) exception là checked nên mặc định vẫn commit (cần {{rollbackFor}}); (4) exception bị bắt và nuốt bên trong method nên proxy không thấy lỗi. Kèm chi tiết production: chỉ integration test qua Spring context mới phát hiện, vì unit test không đi qua proxy. Nếu được hỏi tiếp về audit, nói rõ đánh đổi "cùng transaction" và "transaction riêng + outbox".

> Senior tip: dấu hiệu nhanh nhất trong incident là metric transaction — nếu {{rolled_back = 0}} mà vẫn có lỗi nghiệp vụ, gần như chắc chắn ranh giới transaction không được áp dụng. Đừng tin annotation trong source, hãy tin log {{TransactionInterceptor}} và dữ liệu thật trong DB.`,
  related: ['spring-004', 'spring-028', 'spring-058', 'spring-029'],
  tags: ['@Transactional', 'self-invocation', 'Spring AOP', 'proxy', 'rollback', 'audit log']
},
{
  id: 'bug-027',
  title: 'Entity "biến mất" khỏi HashSet sau khi persist: chốt trạng thái đơn bị bỏ qua',
  domain: 'Thương mại điện tử / Đơn hàng',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Hệ thống quản lý đơn hàng (Spring Boot 3, Spring Data JPA, Hibernate 6, PostgreSQL). Service {{OrderCenter}} giữ một {{Set<Order>}} các đơn "chưa xử lý" trong bộ nhớ (một "doing-set" để dedupe lệnh cập nhật đến từ nhiều nguồn), và ghi mọi đơn vào bảng {{orders}}.

**Sự cố:** Sau khi deploy bản tối ưu hiệu năng (thay List bằng HashSet để tra cứu nhanh), bộ phận chăm sóc đơn báo **7.812 đơn bị "khoá cứng"**: các lệnh "chốt trạng thái" gửi lên bị bỏ qua im lặng, đơn không bao giờ chuyển sang {{PAID}}, trong khi API trả về 200 OK. Điều lạ: chính những đơn đó **có mặt trong HashSet trước khi gọi persist**, nhưng biến mất ngay sau khi {{persist}} trả về.

**Nhiệm vụ của bạn:** Code dưới đây mô phỏng đúng bản trên production: {{Order}} có equals/hashCode lấy **mọi field** (giống Lombok {{@Data}} sinh ra), kể cả {{id}} và {{state}}. Bạn hãy viết lại phần "Code cần sửa" — gồm equals/hashCode cho {{Order}} và thứ tự persist/add trong {{OrderCenter}} — sao cho đơn không biến mất khỏi tập, đơn trùng nghiệp vụ được dedupe, và hash của entity không đổi sau khi DB gán id. Hạ tầng {{UnitOfWork}} (mô phỏng persistence context) và {{IdGenerator}} (mô phỏng {{GenerationType.IDENTITY}}) đã có sẵn, không cần sửa.`,
  artifacts: [
    { name: 'order-center.log', lang: 'text', content: `# Bản trên production có Lombok @Data trên entity -> equals/hashCode lấy mọi field (gồm id).
# Log in hashCode của chính entity để đối chiếu:
10:12:44.901 DEBUG OrderCenter        : pending set size=1200 after load
10:12:44.902 DEBUG OrderCenter        : new Order(customer=C-1001, sku=SKU-9) -> hashCode=-1148845203 (id is null) -> added to pending
10:12:44.915 DEBUG Hibernate SQL       : insert into orders (customer_id, sku, state, id) values (?,?,?,?)
10:12:44.918 DEBUG OrderCenter        : persist done, Order(id=551203, customer=C-1001, sku=SKU-9) hashCode=810234
10:12:44.918 DEBUG OrderCenter        : pending contains(order-551203) = false   <- đơn vừa tạo đã "mất"
10:12:44.918 INFO  OrderController     : 200 OK orderId=551203 state=CREATED
10:14:02.117 INFO  OrderController     : 200 OK orderId=551203 state=CREATED   <- chốt trạng thái bị bỏ qua, đơn vẫn CREATED
10:31:57.660 DEBUG OrderCenter        : pending set size=1193 after load      <- bốc hơi 7 đơn, không exception
10:44:10.004 INFO  ReconciliationJob   : stuck orders (state=CREATED for > 24h) : 7812` },
    { name: 'reconciliation-report.txt', lang: 'text', content: `ORDER RECONCILIATION 2026-11-03 06:00 ICT
Orders in DB (state = CREATED)              : 1,204,881
Orders that never moved to PAID             : 7,812
Orders with payment captured at partner     : 7,812   (tiền đã thu, đơn chưa chốt)
Common trait                                : every one was added to the in-memory pending set BEFORE persist()
Orders whose update was silently dropped    : 7,812 / 7,812 (API answered 200 OK)
Duplicate state-machine transitions applied : 0` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng Hibernate + PostgreSQL, KHÔNG cần sửa) =====
class IdGenerator {
    private long seq = 551202;
    synchronized long next() {
        seq += 1 + java.util.concurrent.ThreadLocalRandom.current().nextInt(3);   // IDENTITY: giá trị do DB sinh
        return seq;
    }
}

class OrderRepository {
    private final Map<Long, String> table = new java.util.concurrent.ConcurrentHashMap<>();
    void insert(long id, String state) { table.put(id, state); }
    String findState(long id) { return table.get(id); }
}

class UnitOfWork {   // mô phỏng persistence context của Hibernate: persist là "một chiều"
    private final IdGenerator ids;
    private final OrderRepository repo;
    UnitOfWork(IdGenerator ids, OrderRepository repo) { this.ids = ids; this.repo = repo; }
    void persistNew(Order order) {              // giống EntityManager.persist: DB gán id vào chính entity
        long id = ids.next();
        repo.insert(id, "CREATED");
        order.id = id;                          // id xuất hiện SAU insert (IDENTITY), không phải lúc new
    }
}

class OrderStateMachine {
    boolean transition(Object order, String target) { return false; }   // phần nghiệp vụ, không phải trọng tâm
}

// ===== Code cần sửa =====
class Order {
    String customer;
    String sku;
    Long id = null;                  // IDENTITY: chỉ có sau khi insert
    String state = "CREATED";
    Order() { }
    Order(String customer, String sku) { this.customer = customer; this.sku = sku; }

    // Bản trên production để Lombok @Data sinh equals/hashCode từ MỌI field (kể cả id và state).
    // Ở đây viết tay đúng như thế để bài test tái hiện được sự cố.
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Order)) return false;
        Order that = (Order) other;
        return java.util.Objects.equals(id, that.id)
            && java.util.Objects.equals(customer, that.customer)
            && java.util.Objects.equals(sku, that.sku)
            && java.util.Objects.equals(state, that.state);
    }
    @Override public int hashCode() {
        return java.util.Objects.hash(id, customer, sku, state);
    }
}

class OrderCenter {
    private final UnitOfWork uow;
    private final Set<Order> pending = new HashSet<>();   // "doing-set" để dedupe lệnh cập nhật
    OrderCenter(UnitOfWork uow) { this.uow = uow; }

    Order createOrder(String customer, String sku) {
        Order o = new Order(customer, sku);
        pending.add(o);                     // thêm vào tập khi tạo
        uow.persistNew(o);                  // DB gán id sau khi insert
        return o;
    }

    boolean isPending(Order o) { return pending.contains(o); }
    int pendingCount() { return pending.size(); }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static OrderCenter center(UnitOfWork uow) { return new OrderCenter(uow); }

    public static void main(String[] args) {
        IdGenerator ids = new IdGenerator();
        UnitOfWork uow = new UnitOfWork(ids, new OrderRepository());

        OrderCenter c1 = center(uow);
        Order o1 = c1.createOrder("C-1001", "SKU-9");
        check("don_moi_co_id", o1.id != null && o1.id > 0, "persist phải gán id, thực tế " + o1.id);
        check("don_van_con_trong_tap", c1.isPending(o1),
            "sau persist, đơn phải vẫn nằm trong tập (pending=" + c1.pendingCount() + ", contains=" + c1.isPending(o1) + ")");

        OrderCenter c2 = center(uow);
        for (int i = 0; i < 5; i++) c2.createOrder("C-2000", "SKU-" + i);
        check("tap_giu_dung_so_phan_tu", c2.pendingCount() == 5, "5 đơn phải nằm trong tập, thực tế " + c2.pendingCount());

        OrderCenter c3 = center(uow);
        Order a = c3.createOrder("C-3000", "SKU-A");
        Order b = c3.createOrder("C-3000", "SKU-B");
        check("hai_don_khac_nhau_khong_trung", !a.equals(b) && c3.isPending(a) && c3.isPending(b),
            "hai đơn khác khách/sản phẩm là hai phần tử khác nhau và cả hai phải còn trong tập, thực tế a.equals(b)=" + a.equals(b)
                + ", contains(a)=" + c3.isPending(a) + ", contains(b)=" + c3.isPending(b) + ", size=" + c3.pendingCount());

        OrderCenter c4 = center(uow);
        Order x = c4.createOrder("C-4000", "SKU-X");
        int sizeBefore = c4.pendingCount();
        c4.createOrder("C-4000", "SKU-X");   // đơn trùng nghiệp vụ: dedupe phải hoạt động
        check("dedupe_don_trung", c4.pendingCount() == sizeBefore && c4.isPending(x),
            "đơn trùng nghiệp vụ không được thêm vào tập, size phải giữ " + sizeBefore + ", thực tế " + c4.pendingCount());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (mô phỏng Hibernate + PostgreSQL, KHÔNG cần sửa) =====
class IdGenerator {
    private long seq = 551202;
    synchronized long next() {
        seq += 1 + java.util.concurrent.ThreadLocalRandom.current().nextInt(3);
        return seq;
    }
}

class OrderRepository {
    private final Map<Long, String> table = new java.util.concurrent.ConcurrentHashMap<>();
    void insert(long id, String state) { table.put(id, state); }
    String findState(long id) { return table.get(id); }
}

class UnitOfWork {
    private final IdGenerator ids;
    private final OrderRepository repo;
    UnitOfWork(IdGenerator ids, OrderRepository repo) { this.ids = ids; this.repo = repo; }
    void persistNew(Order order) {
        long id = ids.next();
        repo.insert(id, "CREATED");
        order.id = id;
    }
}

class OrderStateMachine {
    boolean transition(Object entity, String target) { return false; }
}

// ===== Code đã sửa =====
class Order {
    String customer;
    String sku;
    Long id = null;
    String state = "CREATED";
    Order() { }
    Order(String customer, String sku) { this.customer = customer; this.sku = sku; }

    // equals/hashCode theo BUSINESS KEY (customer + sku): KHÔNG dùng id.
    // Vì vậy hash không đổi khi Hibernate gán id, entity không "biến mất" khỏi HashSet.
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Order)) return false;
        Order that = (Order) other;
        return java.util.Objects.equals(customer, that.customer)
            && java.util.Objects.equals(sku, that.sku);
    }
    @Override public int hashCode() {
        return java.util.Objects.hash(customer, sku);
    }
}

class OrderCenter {
    private final UnitOfWork uow;
    private final Set<Order> pending = new HashSet<>();
    OrderCenter(UnitOfWork uow) { this.uow = uow; }

    Order createOrder(String customer, String sku) {
        Order o = new Order(customer, sku);
        uow.persistNew(o);                  // gán id TRƯỚC khi đưa vào tập
        pending.add(o);
        return o;
    }

    boolean isPending(Order o) { return pending.contains(o); }
    int pendingCount() { return pending.size(); }
}`,
  hints: [
    'Order đã có equals/hashCode lấy MỌI field (bản mô phỏng Lombok @Data trên production). Hãy thử lần theo một đơn: lúc add vào tập thì id còn null, còn khi contains chạy thì id đã có. Hai lần tính hashCode cho ra hai giá trị khác nhau — HashSet xếp đơn vào bucket cũ, nhưng lại đi tìm ở bucket mới.',
    'Đừng chỉ sửa thứ tự (persist trước rồi add sau): nếu vẫn giữ equals/hashCode theo id thì hash vẫn đổi khi id được gán, và mọi lần add sau đó vẫn có thể sai. Phải bỏ id (và các field hay đổi như state) khỏi equals/hashCode, chỉ dùng business key.',
    'Hai lớp sửa, và bài này cần cả hai vì hai lý do khác nhau: (1) equals/hashCode chỉ theo business key để hash không đổi khi id được gán; (2) persist trước rồi add sau, để lần add đầu tiên dùng đúng giá trị cuối cùng. Thiếu (1) thì đơn vẫn "mất" ngay lần add đầu; thiếu (2) thì tập vẫn đúng nhưng code dễ vỡ khi ai đó đổi thứ tự.',
  ],
  rootCause: `**Entity đổi hash sau khi được insert nên HashSet không tìm lại được nó.** HashSet bên trong là một HashMap: phần tử được xếp vào bucket theo {{hashCode()}} tại thời điểm {{add}}. Khi tra cứu {{contains(o)}}, HashSet tính lại hash của {{o}} và chỉ tìm trong bucket đó — nó không quét toàn bộ tập. Nếu equals/hashCode dựa vào **mọi field, kể cả {{id}}** (đúng như Lombok {{@Data}} hoặc {{@EqualsAndHashCode}} không chỉ định field sinh ra), thì: lúc {{pending.add(o)}} chạy, {{id}} còn là {{null}} → hash là {{H1}} → đơn nằm trong bucket H1. Sau đó {{uow.persistNew(o)}} gán {{id=551203}} (Hibernate dùng {{GenerationType.IDENTITY}}: phải insert mới biết id, nên id không thể có trước khi persist) → hash trở thành {{H2}}. Đơn **vẫn nằm trong bucket H1 cũ**, nhưng mọi lần tra cứu sau tính bucket H2, nơi không có gì. Hệ quả: {{contains}} trả về {{false}}, các lệnh chốt trạng thái bị bỏ qua im lặng, API vẫn trả 200, và log có đúng một dòng manh mối: {{pending contains(order-551203) = false}} ngay sau persist, cùng {{pending set size=1193}} giảm dần theo số đơn. Ngoài ra, khi id còn {{null}}, hai đơn khác nhau cùng có id null, customer/sku khác nhau nhưng state giống nhau → nếu chỉ so id thì chúng bị coi là trùng, dedupe theo nghiệp vụ cũng sai. Lớp bẫy thứ hai, cũng là lý do hai test "hai đơn khác nhau không trùng" và "dedupe đơn trùng" trong bài đỏ: khi id còn {{null}}, một equals/hashCode chỉ so {{id}} sẽ coi **mọi** đơn chưa persist là bằng nhau, nên HashSet gộp chúng làm một — dedupe sai theo cả hai chiều. Cả hai biến thể đều xuất phát từ cùng một nguyên tắc: field dùng trong equals/hashCode phải bất biến trong suốt thời gian entity nằm trong tập.`,
  fix: `### Nguyên tắc
Entity dùng trong HashSet/HashMap phải có equals/hashCode dựa trên **business key ổn định** — những field không đổi trong suốt vòng đời của entity. Với đơn hàng, đó là cặp ({{customer}}, {{sku}}) hoặc một mã nghiệp vụ do mình sinh ra, **không phải** {{id}} do DB sinh.

### Cách sửa (hai lớp, dùng cả hai cho chắc)
1. **equals/hashCode theo business key** (bỏ id, bỏ các field hay đổi như {{state}}):
~~~java
@Override public boolean equals(Object other) {
    if (this == other) return true;
    if (!(other instanceof Order)) return false;
    Order that = (Order) other;
    return java.util.Objects.equals(customer, that.customer)
        && java.util.Objects.equals(sku, that.sku);
}
@Override public int hashCode() {
    return java.util.Objects.hash(customer, sku);
}
~~~
2. **Đưa vào tập sau khi persist:** {{uow.persistNew(o); pending.add(o);}} — kể cả khi hash có đổi, lần add đầu tiên đã dùng giá trị cuối cùng.

Nếu buộc phải dùng {{id}} làm key (ví dụ entity không có business key rõ ràng), chỉ được add vào HashSet **sau khi id đã có**, và phải nhớ rằng entity đó không được đổi id nữa. Hibernate khuyến nghị không dùng generated id trong equals/hashCode đúng vì lý do này.

### Vì sao không dùng Lombok @Data cho entity
{{@Data}} sinh equals/hashCode/toString từ **mọi field không static**, kể cả {{id}} và các collection. Đưa entity vào HashSet trước persist rồi persist xong là mất phần tử; thêm nữa, {{toString()}} của {{@Data}} có thể kéo theo lazy collection, gây {{LazyInitializationException}} hoặc N+1. Với entity, hãy tự viết equals/hashCode hoặc dùng {{@EqualsAndHashCode(of = ...)}} chỉ định đúng field.

### Trên production thật
- Triệu chứng điển hình: "đơn biến mất khỏi danh sách đang xử lý", "trạng thái không cập nhật dù API trả 200", "dedupe không hoạt động". Không có exception, không có log lỗi — chỉ là logic im lặng sai.
- Cách phát hiện nhanh: in {{entity.hashCode()}} trước và sau {{persist}}; nếu hai giá trị khác nhau, mọi tập/hashmap chứa nó đã hỏng.
- Trong Hibernate, còn một bẫy họ hàng: {{entity.equals(other)}} so sánh với id {{null}} (hai entity chưa persist luôn "bằng nhau" nếu chỉ so id) — {{Set}} sẽ gộp chúng làm một. Business key tránh được cả hai chiều.
- Nếu nghiệp vụ cần dedupe theo đơn vị khác (ví dụ toàn bộ đơn của một khách), hãy dùng key tường minh ({{Map<CustomerKey, Order>}}) thay vì cố nhồi mọi thứ vào equals.

### Phòng ngừa
- Test đơn vị cho equals/hashCode: hai entity khác business key phải khác hash; hash không đổi sau khi gán id.
- Test tích hợp: sau {{persist}}, {{set.contains(entity)}} vẫn phải là {{true}}.
- Sonar/SpotBugs có luật cảnh báo equals/hashCode trên entity JPA; bật trong CI.

### Liên hệ phỏng vấn
Câu hỏi rất hay gặp ở vòng Senior: "Entity JPA nên viết equals/hashCode thế nào?" Trả lời: không dùng generated id, dùng business key; nếu chưa có business key thì phương án an toàn là không override (dùng identity) và không đưa entity vào HashSet trước khi persist. Kèm ví dụ thật: đơn hàng biến mất khỏi doing-set sau persist, 7.812 đơn kẹt ở CREATED, không có exception nào — vì hash đổi khi id được gán.

> Senior tip: HashSet/HashMap không "kiểm tra" phần tử bị đổi hash — nó im lặng bỏ qua. Vì vậy mọi bug dạng này đều không có stack trace; chỉ có dữ liệu sai và một so sánh đúng/sai ở tầng nghiệp vụ. Khi thấy "thêm vào tập rồi mà contains vẫn false", hãy nghĩ ngay tới mutable field trong hashCode, đừng đi tìm lỗi concurrency.`,
  related: ['core-029', 'core-032', 'jpa-009', 'collections-016', 'collections-027'],
  tags: ['equals', 'hashCode', 'JPA entity', 'HashSet', 'mutable key', 'Lombok @Data']
},
{
  id: 'bug-028',
  title: 'Tồn kho: xoá cache trước khi ghi DB làm tồn kho cũ "sống lại"',
  domain: 'Thương mại điện tử / Tồn kho',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Hệ thống bán lẻ đa kênh (Spring Boot 3, 6 pod). Service {{inventory-service}} tra cứu **tồn kho** (số lượng còn lại của một SKU — đơn vị hàng hoá, ví dụ "áo thun đỏ size L") cho toàn bộ website và app. Mỗi lần đọc tồn kho đi theo mẫu **cache-aside** (còn gọi là lazy loading / đọc-vào-cache): nếu cache có thì trả luôn, nếu không thì đọc DB rồi nạp vào cache. Khi kho nhập thêm hàng, service gọi {{updateStock(sku, newQty)}} để cập nhật số lượng mới.

**Sự cố:** Trong đợt nhập hàng sáng 08/11, nhiều SKU hiển thị **tồn kho = 0** trên website suốt khoảng 30 phút, dù DB đã ghi số lượng mới (ví dụ 120). Hệ quả: **2.907 đơn bị từ chối oan** ("hết hàng"), và đối soát cuối ngày phát hiện **1.482 entry cache có giá trị khác DB** — tất cả đều được tạo **ngay trong cửa sổ cập nhật** (giữa lúc ghi cache và ghi DB).

**Nhiệm vụ của bạn:**
1. Đọc {{InventoryService.updateStock}} và log bên dưới, tìm vì sao một entry cache cũ lại xuất hiện **sau khi** đã cập nhật.
2. Sửa thứ tự thao tác để một lần đọc đồng thời không "hồi sinh" giá trị cũ vào cache.
3. Bấm **Chạy test**: test dùng hai cổng chặn (latch — cơ chế khiến các luồng chờ nhau tại một điểm) để ép một lần đọc xen kẽ đúng vào cửa sổ cập nhật, tái hiện sự cố một cách xác định.`,
  artifacts: [
    { name: 'inventory-service.log', lang: 'text', content: `# Hai luồng chạy song song trên hai pod khác nhau, cùng SKU-1024.
2026-11-08 10:02:11.204 DEBUG [http-nio-8080-exec-31] InventoryService : updateStock sku=SKU-1024 newQty=120 -> evict cache -> write DB
2026-11-08 10:02:11.207 DEBUG [http-nio-8080-exec-42] InventoryService : getStock sku=SKU-1024 cache MISS -> read DB -> qty=0 -> cache put 0
2026-11-08 10:02:11.211 DEBUG [http-nio-8080-exec-31] InventoryService : updateStock sku=SKU-1024 DB write done (120)
2026-11-08 10:02:11.230 DEBUG [http-nio-8080-exec-55] InventoryService : getStock sku=SKU-1024 cache HIT -> qty=0      <- DB=120 nhưng cache trả 0
2026-11-08 10:02:11.240 WARN  [http-nio-8080-exec-55] OrderService       : SKU-1024 insufficient stock (0) -> reject order ORD-99213
2026-11-08 10:02:12.880 INFO  [scheduler]               InventoryService : cache entry SKU-1024 expires (TTL 30m)` },
    { name: 'stale-cache-report.txt', lang: 'text', content: `STALE CACHE AUDIT 2026-11-08 12:00 ICT
Cache entries whose value != DB            : 1,482
...of which created inside update window   : 1,482 (100%)
Distinct SKUs affected                     : 312
Orders rejected wrongly                    : 2,907
Oversell incidents                         : 0
Average staleness (until TTL expiry)       : 29m 41s` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng DB + cache, KHÔNG cần sửa) =====
class FakeStockStore {
    final Map<String, Integer> db = new ConcurrentHashMap<>();     // "DB": nguồn sự thật
    final Map<String, Integer> cache = new ConcurrentHashMap<>();  // "cache": bản sao tạm
    int dbReads = 0;

    // Cổng để test điều khiển thời điểm chạy xen kẽ (xem test "khong_co_du_lieu_cu").
    volatile CountDownLatch firstMutationDone;   // service báo "đã xong thao tác ghi ĐẦU TIÊN"
    volatile CountDownLatch writerMayContinue;   // test bật để service làm tiếp thao tác thứ hai
    private final AtomicBoolean firstMutationPassed = new AtomicBoolean(false);

    // Chỉ thao tác GHI đầu tiên của writer mới dừng ở cổng; thao tác thứ hai và thao tác của reader không bị chặn.
    private void gateAfterFirstMutation() {
        if (firstMutationPassed.compareAndSet(false, true)) {
            CountDownLatch done = firstMutationDone;
            CountDownLatch go = writerMayContinue;
            if (done != null) done.countDown();
            if (go != null) { try { go.await(2, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }
        }
    }

    Integer readDb(String sku)         { dbReads++; return db.get(sku); }
    void writeDb(String sku, int qty)  { db.put(sku, qty); gateAfterFirstMutation(); }
    Integer readCache(String sku)      { return cache.get(sku); }
    void writeCache(String sku, int qty) { cache.put(sku, qty); }
    void evictCache(String sku)        { cache.remove(sku); gateAfterFirstMutation(); }
}

// ===== Code cần sửa =====
class InventoryService {
    private final FakeStockStore store;
    InventoryService(FakeStockStore store) { this.store = store; }

    // Đọc tồn kho theo cache-aside: cache trước, miss thì đọc DB rồi nạp lại cache.
    int getStock(String sku) {
        Integer cached = store.readCache(sku);
        if (cached != null) return cached;
        int qty = store.readDb(sku);
        store.writeCache(sku, qty);
        return qty;
    }

    // Nhập/xuất kho xong: cập nhật tồn kho mới.
    void updateStock(String sku, int newQty) {
        store.evictCache(sku);       // BUG: xoá cache TRƯỚC
        store.writeDb(sku, newQty);  // rồi mới ghi DB
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        // 1. Cập nhật đơn giản: sau update, đọc phải ra giá trị mới.
        FakeStockStore s1 = new FakeStockStore();
        s1.db.put("SKU-A", 0);
        InventoryService inv1 = new InventoryService(s1);
        inv1.updateStock("SKU-A", 120);
        check("cap_nhat_don_gian", inv1.getStock("SKU-A") == 120,
            "sau update phải đọc được 120, thực tế " + inv1.getStock("SKU-A") + " (db=" + s1.db.get("SKU-A") + ")");

        // 2. Cache-aside: lần đầu đọc DB, lần sau lấy từ cache.
        FakeStockStore s2 = new FakeStockStore();
        s2.db.put("SKU-B", 55);
        InventoryService inv2 = new InventoryService(s2);
        int v1 = inv2.getStock("SKU-B");
        int v2 = inv2.getStock("SKU-B");
        check("cache_aside_doc_mot_lan", v1 == 55 && v2 == 55 && s2.dbReads == 1,
            "hai lần đọc cùng giá trị và DB chỉ đọc 1 lần, thực tế v1=" + v1 + " v2=" + v2 + " dbReads=" + s2.dbReads);

        // 3. Tái hiện sự cố: đọc xen kẽ đúng cửa sổ cập nhật -> cache không được giữ giá trị cũ.
        FakeStockStore s3 = new FakeStockStore();
        s3.db.put("SKU-C", 0);        // DB đang là 0
        CountDownLatch firstMutationDone = new CountDownLatch(1);
        CountDownLatch writerMayContinue = new CountDownLatch(1);
        s3.firstMutationDone = firstMutationDone;
        s3.writerMayContinue = writerMayContinue;
        InventoryService inv3 = new InventoryService(s3);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        // Writer: cập nhật tồn kho 0 -> 120
        Future<?> wf = pool.submit(() -> { try { inv3.updateStock("SKU-C", 120); } catch (Exception e) { /* bỏ qua */ } });
        // Chờ writer làm xong thao tác ghi ĐẦU TIÊN (nó dừng ngay trước thao tác thứ hai)
        boolean writerStarted = firstMutationDone.await(3, TimeUnit.SECONDS);
        // Reader: đọc tồn kho NGAY trong cửa sổ đó
        Future<Integer> rf = pool.submit(() -> inv3.getStock("SKU-C"));
        int readDuringWindow = rf.get(3, TimeUnit.SECONDS);
        // Cho writer làm tiếp thao tác thứ hai rồi kết thúc
        writerMayContinue.countDown();
        wf.get(3, TimeUnit.SECONDS);

        int after = inv3.getStock("SKU-C");
        check("khong_co_du_lieu_cu",
            writerStarted && readDuringWindow == 120 && after == 120 && s3.db.get("SKU-C") == 120,
            "cửa sổ cập nhật không được để lộ/khôi phục tồn kho cũ: đọc-trong-cửa-sổ=" + readDuringWindow
                + ", đọc-sau-cập-nhật=" + after + ", db=" + s3.db.get("SKU-C"));

        pool.shutdownNow();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `// ===== Hạ tầng (mô phỏng DB + cache, KHÔNG cần sửa) =====
class FakeStockStore {
    final Map<String, Integer> db = new ConcurrentHashMap<>();
    final Map<String, Integer> cache = new ConcurrentHashMap<>();
    int dbReads = 0;
    volatile CountDownLatch firstMutationDone;
    volatile CountDownLatch writerMayContinue;
    private final AtomicBoolean firstMutationPassed = new AtomicBoolean(false);

    private void gateAfterFirstMutation() {
        if (firstMutationPassed.compareAndSet(false, true)) {
            CountDownLatch done = firstMutationDone;
            CountDownLatch go = writerMayContinue;
            if (done != null) done.countDown();
            if (go != null) { try { go.await(2, TimeUnit.SECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }
        }
    }

    Integer readDb(String sku)         { dbReads++; return db.get(sku); }
    void writeDb(String sku, int qty)  { db.put(sku, qty); gateAfterFirstMutation(); }
    Integer readCache(String sku)      { return cache.get(sku); }
    void writeCache(String sku, int qty) { cache.put(sku, qty); }
    void evictCache(String sku)        { cache.remove(sku); gateAfterFirstMutation(); }
}

// ===== Code đã sửa =====
class InventoryService {
    private final FakeStockStore store;
    InventoryService(FakeStockStore store) { this.store = store; }

    int getStock(String sku) {
        Integer cached = store.readCache(sku);
        if (cached != null) return cached;
        int qty = store.readDb(sku);
        store.writeCache(sku, qty);
        return qty;
    }

    void updateStock(String sku, int newQty) {
        store.writeDb(sku, newQty);  // FIX: ghi DB (nguồn sự thật) TRƯỚC
        store.evictCache(sku);       // rồi mới xoá cache
    }
}`,
  hints: [
    'Nhìn vào log: exec-42 đọc DB ra qty=0 rồi cache put 0, và dòng này xảy ra SAU khi exec-31 đã evict cache nhưng TRƯỚC khi exec-31 ghi DB (dòng .204 evict, .207 reader đọc, .211 writer ghi DB). Vậy reader đã đọc giá trị CŨ và nạp nó trở lại cache.',
    'Bài này là bài toán "thứ tự thao tác" kinh điển của cache-aside: xoá cache trước rồi ghi DB sau tạo ra một cửa sổ mà ở đó một request đọc song song đọc được giá trị cũ và ghi nó ngược vào cache. Hãy đổi thành ghi DB trước, xoá cache sau.',
    'Tự hỏi: nếu writer ghi DB (qty=120) TRƯỚC, thì một reader chạy trong cửa sổ sẽ đọc DB ra 120 chứ không phải 0. Test ép reader chạy đúng sau thao tác đầu tiên của writer, nên thứ tự đúng sẽ cho reader thấy 120.',
  ],
  rootCause: `**Cache-aside đặt sai thứ tự: xoá cache trước, ghi DB sau.** Mẫu cache-aside có một **cửa sổ không nhất quán** giữa hai nguồn dữ liệu: DB (nguồn sự thật) và cache (bản sao tạm). Khi cập nhật, nếu làm {{evictCache}} trước rồi {{writeDb}} sau, thì trong khoảng giữa hai thao tác, cache trống nhưng DB **vẫn còn giá trị cũ**. Một request đọc song song rơi vào đúng khoảng đó sẽ: (1) cache miss, (2) đọc DB ra giá trị cũ, (3) nạp giá trị cũ trở lại cache. Sau khi writer ghi DB xong, **cache đang giữ giá trị cũ** và sẽ phục vụ nó cho tới khi TTL hết hạn (ở đây 30 phút). Đó là lý do 1.482 entry lệch, tất cả tạo trong cửa sổ cập nhật, và 2.907 đơn bị từ chối oan dù DB đã đủ hàng.

Dẫn chứng trong log: dòng {{.204 evict cache}} xảy ra trước {{.211 DB write done}}; xen giữa là {{.207 reader cache MISS -> read DB -> qty=0 -> cache put 0}}. Reader đã đọc 0 và ghi 0 vào cache sau khi cache bị xoá. Kết quả: {{cache HIT -> qty=0}} trong khi {{DB=120}}.

Điểm mấu chốt về mặt lý thuyết: **thứ tự "ghi DB rồi xoá cache" vẫn còn một khe hở nhỏ** (reader đọc DB cũ ngay trước khi writer ghi, rồi nạp cache sau khi writer xoá). Nhưng "xoá cache rồi ghi DB" tệ hơn hẳn: cửa sổ để lộ giá trị cũ **rộng hơn** và luôn kết thúc bằng việc cache giữ giá trị cũ. Vì vậy nguyên tắc bất di bất dịch là: **nguồn sự thật (DB) phải được cập nhật trước, rồi mới làm mất hiệu lực bản sao (cache).**`,
  fix: `### Nguyên tắc
Trong cache-aside, **DB là nguồn sự thật**. Khi cập nhật, hãy ghi DB trước, rồi mới **xoá** (invalidate) cache. Không bao giờ "ghi giá trị mới vào cache" thay cho việc xoá: giá trị mới có thể bị ghi đè bởi một lần đọc cũ hơn (race), và việc xoá đơn giản luôn an toàn hơn.

### Cách sửa trong bài
Chỉ cần đổi thứ tự hai dòng trong {{updateStock}}:
~~~java
void updateStock(String sku, int newQty) {
    store.writeDb(sku, newQty);  // 1) cập nhật DB trước
    store.evictCache(sku);       // 2) rồi mới xoá cache
}
~~~
Với thứ tự này, một reader chạy trong cửa sổ sẽ đọc DB **đã** ra giá trị mới (120), nên dù nó có nạp cache thì cũng nạp giá trị đúng. Test {{khong_co_du_lieu_cu}} ép đúng khe hở đó và sẽ chuyển từ đỏ sang xanh.

### Vì sao "ghi DB rồi xoá cache" vẫn chưa phải là bất khả xâm phạm
Vẫn còn một khe hở lý thuyết: reader đọc DB ra giá trị **cũ** (ngay trước khi writer ghi), rồi nạp giá trị cũ vào cache **sau** khi writer đã xoá. Để dập khe hở này, production dùng các lớp phòng thủ:

1. **Delayed double delete (xoá trễ hai lần):** sau khi ghi DB, xoá cache, chờ một khoảng ngắn (lớn hơn độ trễ đọc điển hình, ví dụ 300–500ms), rồi **xoá cache lần nữa**. Lần xoá thứ hai dọn nốt giá trị cũ mà một reader chậm có thể vừa nạp vào.
~~~java
void updateStock(String sku, int newQty) {
    store.writeDb(sku, newQty);
    cache.evict(sku);                 // xoá lần 1
    scheduler.schedule(() -> cache.evict(sku), 500, MILLISECONDS);  // xoá lần 2 (dập khe hở)
}
~~~
2. **CDC (Change Data Capture — bắt thay đổi dữ liệu):** dùng Debezium đọc **binlog** (nhật ký thay đổi) của PostgreSQL/MySQL, mỗi khi có row thay đổi thì phát event, consumer xoá cache tương ứng. Ưu điểm: cache luôn được xoá đúng lúc DB đổi, kể cả khi đổi từ nơi khác (job, SQL tay, service khác). Đây là cách mạnh nhất và được các hệ thống lớn dùng.
3. **TTL như lưới an toàn:** luôn đặt TTL (ví dụ 30 phút hoặc ngắn hơn tuỳ mức chịu cũ). Dù mọi lớp trên thủng, cache cũng tự đổi sau TTL — nghĩa là "cũ có kiểm soát" thay vì "cũ vĩnh viễn".
4. **Write-through / write-around:** thay vì cache-aside, ghi thẳng vào cả DB và cache (write-through) — đắt hơn nhưng nhất quán hơn; hoặc chỉ đọc DB cho dữ liệu nhạy cảm (giá, tồn kho) và chỉ cache dữ liệu ít đổi.

### Trong Spring Boot / Redis
- {{@CacheEvict(beforeInvocation = false)}} (mặc định) sẽ xoá cache **sau khi** method chạy; nếu bạn đặt {{beforeInvocation = true}} thì nó xoá **trước** — chính là bẫy trong bài này. Hãy để mặc định, và đảm bảo việc ghi DB nằm trong cùng method được {{@CacheEvict}}.
- Nếu ghi DB trong {{@Transactional}}, cache phải được xoá **sau khi commit**, không phải sau khi method trả về. Dùng {{TransactionSynchronizationManager.registerSynchronization(...)}} hoặc {{@CacheEvict}} với đúng thứ tự.
- Đừng dùng {{@CachePut}} để "cập nhật" giá trị mới khi có thể có đọc song song; ưu tiên xoá.

### Phòng ngừa
- Code review: mọi chỗ cập nhật DB + cache phải hỏi "đọc song song trong cửa sổ này thấy gì?".
- Test tải có bước đọc xen kẽ (như bài này) trong CI, không chỉ test tuần tự.
- Cảnh báo số entry cache lệch DB (job đối soát định kỳ) và số đơn bị từ chối do "hết hàng" tăng đột biến.

### Liên hệ phỏng vấn
Câu kinh điển: "Vì sao cập nhật cache phải **sau** khi cập nhật DB?" Trả lời: cache là bản sao, DB là nguồn sự thật; xoá cache trước tạo cửa sổ để một đọc song song nạp giá trị cũ trở lại. Kèm luôn các lớp phòng thủ: delayed double delete, CDC (Debezium + binlog), TTL, và lưu ý thứ tự với {{@Transactional}}/{{@CacheEvict}}.

> Senior tip: Đừng bao giờ "ghi giá trị mới vào cache" để cập nhật. Xoá (invalidate) luôn an toàn hơn ghi, vì lần đọc sau sẽ nạp lại từ DB. Và nếu dữ liệu cực nhạy cảm (tồn kho, số dư, giá), hãy cân nhắc bỏ cache cho các đường đọc đó — một cache cũ 30 phút trên số dư là thảm hoạ.`,
  related: ['spring-017', 'spring-068', 'jpa-058', 'api-009'],
  tags: ['cache-aside', 'cache invalidation', 'stale data', 'delayed double delete', 'CDC', 'Redis']
},
{
  id: 'bug-029',
  title: 'Xử lý đơn: thread pool dùng queue không giới hạn, hàng nghìn job dồn lại làm pod OOM',
  domain: 'Thương mại điện tử / Xử lý đơn hàng',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Service {{order-worker}} (Spring Boot 3, 4 pod) xử lý các việc **sau khi khách đặt hàng**: gửi email xác nhận, cộng điểm thành viên, đẩy tồn kho, ghi analytics. Để không chặn request của khách, các việc này được đẩy vào một **thread pool** (bể luồng — một nhóm luồng (thread) được tái sử dụng để chạy nhiều task) rồi gọi {{pool.submit(task)}}.

**Sự cố:** Đợt flash sale 12/11, lượng đơn tăng khoảng 20 lần. Trong 10 phút, **heap của pod tăng đều rồi pod bị OOMKilled**; các pod còn lại cũng lăn ra vì **hàng nghìn task dồn trong queue**. Độ trễ xử lý một đơn tăng từ 200ms lên 40s; khi pod restart thì **mất trắng** hàng nghìn task đang xếp hàng (chưa gửi email, chưa cộng điểm).

**Nhiệm vụ của bạn:**
1. Chỉ ra vì sao {{Executors.newFixedThreadPool}} có thể làm pod OOM dù số luồng chỉ là 4.
2. Sửa để pool có **giới hạn hàng đợi** và **chính sách khi đầy** (từ chối có kiểm soát), thay vì dồn vô hạn.
3. Bấm **Chạy test**: test nhồi 200 task vào một pool đang bận để xem queue có bị phình vô hạn không.`,
  artifacts: [
    { name: 'order-worker.log', lang: 'text', content: `2026-11-12 21:00:01 INFO  OrderWorker : pool=pool-1-thread active=4 queue=128 completed=9001
2026-11-12 21:02:10 INFO  OrderWorker : pool=pool-1-thread active=4 queue=48210 completed=12044
2026-11-12 21:04:33 WARN  OrderWorker : pool=pool-1-thread active=4 queue=213907 completed=13980  <- queue phình, heap tăng
2026-11-12 21:05:02 ERROR OrderWorker : task rejected? NO  (LinkedBlockingQueue khong gioi han -> submit khong bao gio nem loi)
2026-11-12 21:06:11 INFO  OrderWorker : Full GC (G1) 1840ms, heap after=1.9G / max=2.0G
2026-11-12 21:06:12 ERROR OrderWorker : java.lang.OutOfMemoryError: Java heap space` },
    { name: 'pod-events.txt', lang: 'text', content: `POD EVENTS 2026-11-12 (namespace=order)
21:05:40  pod/order-worker-7f9c  OOMKilled   lastState.terminated.reason=OOMKilled exitCode=137
21:05:41  pod/order-worker-2b1a  OOMKilled   exitCode=137
21:06:12  pod/order-worker-9d3e  OOMKilled   exitCode=137
Pending tasks lost on restart (no durable queue): ~41,000
Email confirmations not sent               : 38,204
Loyalty points not credited                : 41,000
Peak queue depth observed                  : 213,907 tasks` },
  ],
  starter: `// ===== Hạ tầng / Code cần sửa =====
class TaskExecutor {
    private final ThreadPoolExecutor pool;

    // BUG: newFixedThreadPool dùng LinkedBlockingQueue KHÔNG giới hạn.
    // Tham số queueCapacity bị bỏ qua -> khi task đến nhanh hơn tốc độ xử lý,
    // task dồn hết vào heap cho tới khi OOM.
    TaskExecutor(int workers, int queueCapacity) {
        this.pool = (ThreadPoolExecutor) Executors.newFixedThreadPool(workers);
    }

    Future<?> submit(Runnable task) { return pool.submit(task); }
    int queueSize() { return pool.getQueue().size(); }
    void shutdown() { pool.shutdownNow(); }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static final int WORKERS = 4;
    static final int CAPACITY = 8;

    public static void main(String[] args) throws Exception {
        // 1. Task được chạy: submit rồi hoàn thành.
        TaskExecutor e1 = new TaskExecutor(WORKERS, CAPACITY);
        AtomicInteger ran = new AtomicInteger();
        Future<?> f1 = e1.submit(() -> ran.incrementAndGet());
        f1.get(3, TimeUnit.SECONDS);
        check("submit_chay_task", ran.get() == 1, "task phải chạy đúng 1 lần, thực tế " + ran.get());
        e1.shutdown();

        // 2. Với ít task (dưới sức chứa) thì không bị từ chối.
        TaskExecutor e2 = new TaskExecutor(WORKERS, CAPACITY);
        CountDownLatch done2 = new CountDownLatch(3);
        for (int i = 0; i < 3; i++) e2.submit(done2::countDown);
        boolean ok2 = done2.await(3, TimeUnit.SECONDS);
        check("it_task_khong_bi_tu_choi", ok2 && e2.queueSize() == 0,
            "3 task phải chạy xong và queue rỗng, thực tế done=" + ok2 + " queue=" + e2.queueSize());
        e2.shutdown();

        // 3. Tái hiện sự cố: task đến ồ ạt -> queue KHÔNG được lớn vô hạn.
        TaskExecutor e3 = new TaskExecutor(WORKERS, CAPACITY);
        CountDownLatch block = new CountDownLatch(1);     // giữ 4 worker bận
        CountDownLatch started = new CountDownLatch(WORKERS);
        for (int i = 0; i < WORKERS; i++) {
            e3.submit(() -> { started.countDown(); try { block.await(); } catch (InterruptedException ex) { Thread.currentThread().interrupt(); } });
        }
        boolean workersReady = started.await(3, TimeUnit.SECONDS);

        int accepted = 0, rejected = 0;
        for (int i = 0; i < 200; i++) {
            try {
                e3.submit(() -> { try { block.await(); } catch (InterruptedException ex) { Thread.currentThread().interrupt(); } });
                accepted++;
            } catch (RejectedExecutionException ex) { rejected++; }
        }
        int maxQueue = e3.queueSize();

        check("queue_co_gioi_han",
            workersReady && rejected > 0 && maxQueue <= CAPACITY,
            "queue phải có giới hạn " + CAPACITY + " và phải có chính sách từ chối; thực tế accepted=" + accepted
                + " rejected=" + rejected + " queueSize=" + maxQueue + " workersReady=" + workersReady);

        block.countDown();
        e3.shutdown();
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `// ===== Hạ tầng / Code cần sửa =====
class TaskExecutor {
    private final ThreadPoolExecutor pool;

    // FIX: queue CÓ GIỚI HẠN (ArrayBlockingQueue) + chính sách từ chối (AbortPolicy)
    // -> khi đầy thì submit() ném RejectedExecutionException, tạo backpressure thay vì dồn vào heap.
    TaskExecutor(int workers, int queueCapacity) {
        this.pool = new ThreadPoolExecutor(
            workers, workers,
            0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(queueCapacity),
            new ThreadPoolExecutor.AbortPolicy());
    }

    Future<?> submit(Runnable task) { return pool.submit(task); }
    int queueSize() { return pool.getQueue().size(); }
    void shutdown() { pool.shutdownNow(); }
}`,
  hints: [
    'Đọc code khởi tạo: newFixedThreadPool(4) tạo pool với 4 luồng nhưng bên trong dùng LinkedBlockingQueue KHÔNG giới hạn. Số luồng ít không giúp gì nếu hàng đợi phình vô hạn: mỗi task đang chờ là một object nằm trên heap.',
    'Tham số queueCapacity được truyền vào constructor nhưng không hề được dùng — đó là manh mối. Hãy dùng ThreadPoolExecutor trực tiếp với một queue có giới hạn (ArrayBlockingQueue) và một chính sách khi đầy.',
    'Khi queue đầy, pool cần làm gì đó có kiểm soát: ném RejectedExecutionException (AbortPolicy) để nơi gọi biết mà xử lý, hoặc chạy ngay trên luồng gọi (CallerRunsPolicy) để tạo áp lực ngược (backpressure). Điều cấm kỵ là âm thầm dồn task vào bộ nhớ.',
  ],
  rootCause: `**ThreadPoolExecutor dùng queue không giới hạn nên không có backpressure.** {{Executors.newFixedThreadPool(4)}} bên trong là một {{ThreadPoolExecutor}} với **corePoolSize = maximumPoolSize = 4** và một {{LinkedBlockingQueue}} **không giới hạn**. Cơ chế của {{ThreadPoolExecutor}} khi nhận task: nếu chưa đủ core thread thì tạo thread mới; nếu đã đủ thì **đẩy task vào queue**; nếu queue đầy thì mới tạo thêm thread tới max; nếu vẫn đầy thì mới chạy rejection policy. Vì queue ở đây không bao giờ đầy, nên: (1) pool **không bao giờ** tạo thêm thread, (2) **không bao giờ** chạy rejection policy, (3) mọi task dồn hết vào queue nằm trên **heap**.

Khi task đến nhanh hơn tốc độ xử lý (flash sale), queue lớn dần: log cho thấy {{queue=213907}}, heap chạm 1.9G/2.0G, Full GC 1.8s, rồi {{OutOfMemoryError: Java heap space}} và pod bị OOMKilled (exit 137). Đây **không phải** lỗi "quá nhiều thread" — chỉ có 4 thread — mà là lỗi **bộ nhớ do queue vô hạn**. Kèm theo là mất dữ liệu: task đang xếp hàng trong RAM biến mất khi pod restart vì queue không bền (không có durable queue như Kafka/SQS).

Điểm lý thuyết: một hệ thống ổn định cần **backpressure** — khi quá tải, nơi gửi phải bị chặn/từ chối thay vì bộ nhớ cứ phình ra. Queue có giới hạn + rejection policy chính là cách biến "quá tải âm thầm" thành "quá tải nhìn thấy được".`,
  fix: `### Nguyên tắc
**Mọi queue trong executor phải có giới hạn.** Queue không giới hạn biến quá tải tạm thời thành sự cố bộ nhớ, và tệ hơn là nó **giấu** quá tải: không có tín hiệu nào cho nơi gọi biết hệ thống đang đuối.

### Cách sửa trong bài
Dùng {{ThreadPoolExecutor}} trực tiếp với queue có giới hạn và một chính sách từ chối:
~~~java
this.pool = new ThreadPoolExecutor(
    workers, workers,                 // core = max (pool cố định)
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(queueCapacity),   // queue CÓ GIỚI HẠN
    new ThreadPoolExecutor.AbortPolicy());     // đầy -> ném RejectedExecutionException
~~~
Với cách này, khi 4 worker bận và queue (8) đầy, {{submit}} ném {{RejectedExecutionException}}. Nơi gọi (ví dụ controller hoặc consumer) bắt lỗi và trả 503 / thử lại sau / đẩy sang hàng đợi bền. Test {{queue_co_gioi_han}} kiểm tra đúng điều này.

### Chọn chính sách khi đầy (rejection policy)
| Chính sách | Hành vi khi đầy | Khi nào dùng |
|---|---|---|
| AbortPolicy (mặc định) | Ném RejectedExecutionException | Khi nơi gọi cần biết để trả lỗi / retry |
| CallerRunsPolicy | Chạy task ngay trên luồng gọi | Khi muốn tạo backpressure tự nhiên (chậm dần) và không được mất task |
| DiscardPolicy | Âm thầm bỏ task | Gần như không bao giờ cho việc quan trọng (mất email, mất điểm) |
| DiscardOldestPolicy | Bỏ task cũ nhất, thử lại | Chỉ khi task cũ vô giá trị |

Với việc gửi email/cộng điểm, **không dùng Discard**: mất âm thầm là bug dữ liệu. Ưu tiên AbortPolicy để caller xử lý, hoặc CallerRunsPolicy để throttle toàn hệ thống.

### Sizing pool (cực kỳ quan trọng khi phỏng vấn)
- **CPU-bound** (m tính, nén, hash): số thread ≈ số core + 1.
- **IO-bound** (gọi API, DB, email): số thread lớn hơn nhiều, công thức gốc là {{Nthreads = NCPU * UCPU * (1 + W/C)}} với W = thời gian chờ, C = thời gian tính. Với các tác vụ phần lớn là chờ I/O, W/C lớn nên cần nhiều thread hơn.
- Nhưng đừng đặt quá lớn: mỗi thread tốn ~1MB stack và gây chuyển ngữ cảnh. Và **luôn** ghép với queue có giới hạn.

### Trên production thật
- **Dùng hàng đợi bền** (Kafka, RabbitMQ, SQS) cho việc quan trọng (gửi email, cộng điểm) thay vì queue trong RAM: task sống sót qua restart, có retry, có DLQ (dead-letter queue).
- **Tách pool theo loại việc** (bulkhead pattern): pool riêng cho email, riêng cho đẩy kho, để một việc chậm không làm đói việc khác.
- **Giám sát:** độ sâu queue, số task bị từ chối (rejected count), thời gian một task nằm trong queue. Cảnh báo khi queue vượt ngưỡng.
- **Spring:** dùng {{ThreadPoolTaskExecutor}} (hoặc {{@Async}} với executor cấu hình sẵn), đặt {{setQueueCapacity}} hữu hạn và {{setRejectedExecutionHandler}} tường minh; đừng dùng executor mặc định của {{@Async}} (SimpleAsyncTaskExecutor — tạo thread mỗi lần, không pool).

### Phòng ngừa
- Code review: mọi {{Executors.newFixedThreadPool}}/{{newCachedThreadPool}}/{{newSingleThreadExecutor}} đều phải bị chặn; thay bằng {{ThreadPoolExecutor}} có queue giới hạn.
- Test tải: bắn gấp nhiều lần năng lực xử lý, khẳng định có tín hiệu từ chối thay vì OOM.
- Đặt ngưỡng heap và cảnh báo queue depth.

### Liên hệ phỏng vấn
Câu kinh điển: "Vì sao không nên dùng {{Executors.newFixedThreadPool}} trên production?" Trả lời: nó dùng queue không giới hạn → không backpressure → OOM khi quá tải; giải pháp là {{ThreadPoolExecutor}} + queue có giới hạn + rejection policy, và với việc quan trọng thì dùng hàng đợi bền. Nêu luôn cách sizing CPU-bound vs IO-bound và bulkhead.

> Senior tip: Một pool có 4 thread vẫn có thể làm sập pod — thủ phạm là queue vô hạn, không phải số thread. Hãy luôn giới hạn queue và chọn rejection policy có ý thức; "từ chối sớm" tốt hơn "chết muộn vì OOM".`,
  related: ['concurrency-003', 'concurrency-004', 'concurrency-015', 'concurrency-020'],
  tags: ['thread pool', 'ThreadPoolExecutor', 'unbounded queue', 'backpressure', 'OOM', 'rejection policy']
},
{
  id: 'bug-030',
  title: 'Đối soát thanh toán lệch vài đồng vì dùng double để tính tiền',
  domain: 'Ngân hàng / Đối soát thanh toán',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Tóm tắt:** Service đối soát tổng hợp tiền bằng {{double}} và làm tròn bằng {{Math.round(x * 100) / 100.0}}. Số nhị phân không lưu chính xác các phân số thập phân (ví dụ 0.1), nên sai số tích lũy trên hàng nghìn giao dịch khiến tổng báo cáo lệch vài đồng, và hai số tiền bằng nhau về giá trị lại bị xét là khác.

**Bối cảnh dự án:** Cổng thanh toán xử lý hàng nghìn giao dịch mỗi ngày; tiền có phần lẻ (ví dụ 10.50 USD, 0.10 USD; VND không có phần lẻ nhưng quy đổi sang USD/EUR thì ra số lẻ). {{ReconciliationService}} mỗi đêm đọc hai nguồn: file đối soát từ ngân hàng đối tác và sổ cái nội bộ, tổng cộng từng hệ thống rồi so sánh hai tổng. Tổng tiền chạy vào hàng trăm triệu đồng, nên sai số vài xu trên hàng nghìn giao dịch đã đủ làm báo cáo lệch và đội vận hành phải kiểm tra thủ công từng giao dịch.

**Sự cố:** Đối soát đêm 05/11 báo hệ thống A thu **100.000.000.00**, hệ thống B thu **99.999.999.98**, chênh **0,02** (tổng các khoản chênh lệch chưa kết chuyển). Kiểm tra từng giao dịch lại thấy mọi cặp đều bằng nhau — sai số không nằm ở giao dịch đơn lẻ nào, mà ở cách tổng hợp và làm tròn. Log in tổng dạng **0.6000000000000001** thay vì 0.60, và làm tròn 2.005 lại ra **2.00** thay vì 2.01.

**Nhiệm vụ của bạn:** Sửa {{ReconciliationService}}: tổng và làm tròn tiền dùng {{BigDecimal}} (tạo từ **chuỗi** hoặc {{BigDecimal.valueOf}}, KHÔNG tạo từ double), so sánh bằng {{compareTo}} == 0, và quy ước scale cố định (2 chữ số thập phân cho tiền có phần lẻ).`,
  artifacts: [
    { name: 'reconcile-2026-11-05.log', lang: 'text', content: `2026-11-05 02:14:03.118 INFO  ReconciliationService : tong he thong A = 100000000.00
2026-11-05 02:14:03.121 INFO  ReconciliationService : tong he thong B = 99999999.98
2026-11-05 02:14:03.124 WARN  ReconciliationService : LECH 0.02 (he thong A lon hon he thong B)
2026-11-05 02:14:03.130 DEBUG ReconciliationService : tong 0.10 + 0.20 + 0.30 in ra 0.6000000000000001
2026-11-05 02:14:03.133 DEBUG ReconciliationService : lam tron 2.005 -> 2.00` },
    { name: 'reconciliation-report.txt', lang: 'text', content: `PAIR_ID SO_GATEWAY SO_LEDGER KET_QUA
PAY-88213 0.30000000000000004 0.30 LECH (double: gia tri bang nhau, bieu dien nhi phan khac)
PAY-88214 1000.0000000001588 1000.00 LECH (sai so tich luy sau 10.000 giao dich 0.10)
SO CAP BI DANH DAU LECH: 3.412 (tat ca deu la sai so double, khong co dong tien nao that su thieu)` },
  ],
  starter: `// ===== Code cần sửa =====
class ReconciliationService {
    /** Tong hop danh sach so tien (chuoi thap phan) tu mot he thong. */
    String sumAmounts(List<String> amounts) {
        double total = 0.0;
        for (String s : amounts) total += Double.parseDouble(s);
        return String.valueOf(total);   // in ra dang nhi phan xau, vi du "0.6000000000000001"
    }

    /** Hai so tien coi la bang nhau neu bit luu trong bo nho giong nhau. */
    boolean amountsEqual(String a, String b) {
        return Double.parseDouble(a) == Double.parseDouble(b);   // sai khi phep tinh sinh sai so nhi phan
    }

    /** Lam tron tien ve 2 chu so thap phan. */
    String roundMoney(String amount) {
        return new BigDecimal(Double.parseDouble(amount))   // BUG: tao BigDecimal tu double bat dau tu sai so nhi phan
            .setScale(2, RoundingMode.HALF_UP)
            .toPlainString();
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        ReconciliationService s = new ReconciliationService();

        // 1. 0.10 + 0.20 + 0.30 phai tong dung 0.60
        String t1 = s.sumAmounts(List.of("0.10", "0.20", "0.30"));
        check("tong_ba_khoan", "0.60".equals(t1), "ky vong 0.60, thuc te " + t1);

        // 2. So tien da tinh bang double con phai duoc coi bang nhau
        boolean t2 = s.amountsEqual(s.sumAmounts(List.of("0.10", "0.20")), "0.30");
        check("sotien_tinh_xong_van_bang_nhau", t2, "0.10 + 0.20 phai bang 0.30, thuc te " + t2);

        // 3. Lam tron 2.005 phai ra 2.01 (RoundingMode.HALF_UP)
        String t3 = s.roundMoney("2.005");
        check("lam_tron_2_005", "2.01".equals(t3), "ky vong 2.01, thuc te " + t3);

        // 4. Lam tron 1.005 phai ra 1.01
        String t4 = s.roundMoney("1.005");
        check("lam_tron_1_005", "1.01".equals(t4), "ky vong 1.01, thuc te " + t4);

        // 5. Mot tram nghin giao dich 0.10 phai tong dung 1000.00
        List<String> nghin = new ArrayList<>();
        for (int i = 0; i < 10000; i++) nghin.add("0.10");
        String t5 = s.sumAmounts(nghin);
        check("hang_nghin_giao_dich", "1000.00".equals(t5), "ky vong 1000.00, thuc te " + t5);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class ReconciliationService {
    /** Tong tien bang BigDecimal tao tu chuoi: khong bo mat chu so, khong co sai so nhi phan. */
    String sumAmounts(List<String> amounts) {
        BigDecimal total = BigDecimal.ZERO;
        for (String s : amounts) total = total.add(new BigDecimal(s));   // tu chuoi, khong tu double
        return total.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    /** So sanh so tien: so GIA TRI, bo qua cach viet (10.00 bang 10.0). */
    boolean amountsEqual(String a, String b) {
        return new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;
    }

    /** Lam tron tien ve 2 chu so thap phan theo quy tac tien te HALF_UP. */
    String roundMoney(String amount) {
        return new BigDecimal(amount).setScale(2, RoundingMode.HALF_UP).toPlainString();   // tu chuoi
    }
}`,
  hints: [
    'Chạy test 1: tổng 0.10 + 0.20 + 0.30 in ra gì? Số nhị phân không lưu chính xác 0.1, mỗi phép cộng làm tròn ít, sai số tích lũy.',
    'Double.parseDouble(a) == Double.parseDouble(b) so bit lưu trong bộ nhớ. Hai số in ra nhau mà bit lưu không giống (0.30000000000000004 vs 0.3) thì coi KHÁC nhau.',
    'new BigDecimal(Double.parseDouble("2.005")) luôn chứa sai số nhị phân của 2.005 (2.004999...), nên setScale(2, HALF_UP) làm tròn xuống ra 2.00. Phải tạo BigDecimal từ CHUỖI "2.005".',
    'Muốn số tiền bằng nhau dùng compareTo == 0 (số giá trị, bỏ qua scale); equals của BigDecimal cả scale nên 10.00 != 10.0.'
  ],
  rootCause: `**Nguyên nhân gốc:** double lưu theo IEEE 754 (1 bit dấu, 11 bit mũ, 52 bit phần mã), chỉ được khoảng 15-16 chữ số đáng tin cậy. Phân số thập phân như 0.1 không lưu chính xác (là 0.1000000000000000055511151231257827...). Mỗi phép cộng làm tròn ít, và sai số tích lũy. Trên hàng nghìn giao dịch, sai số vi tích lũy thành **vài đồng**, chính nguyên nhân tổng B lệch 0,02 so với A.

**Tam nhân:** Math.round(x * 100) / 100.0 cũng không tin được: phép nhân x * 100 trong nhị phân có thể di chuyển giá trị qua ngưỡng 0.5, và Math.round làm tròn theo quy tắc "x.5 lên về trăm trên" (200.5 -> 201), kết quả có thể trùng hoặc sai tương đối quy tắc tiền tệ.

**Lỗi nguy hiểm nhất:** new BigDecimal(double) "nhận đúng luôn sai số nhị phân". new BigDecimal(2.005) chính là 2.0049999999999998934..., nên setScale(2, HALF_UP) cho **2.00** thay vì 2.01. Cách dùng: new BigDecimal("2.005") hoặc BigDecimal.valueOf(2.005) (gọi String.valueOf trong, lấy chuỗi đọc được của double).

**So sánh:** equals của BigDecimal cả hai thành phần intVal (số nguyên không dấu) VÀ scale (số chữ số thập phân). 10.00 (intVal=1000, scale=2) khác 10.0 (intVal=100, scale=1) dù giá trị bằng nhau. compareTo chỉ so giá trị -> 10.00 vs 10.0 bằng 0 (giống nhau).`,
  fix: `### Cách sửa trong bài

Đổi tất cả phép tính tiền sang BigDecimal, từ CHUỖI, và quy ước scale cố định:

~~~java
class ReconciliationService {
    String sumAmounts(List<String> amounts) {
        BigDecimal total = BigDecimal.ZERO;
        for (String s : amounts) total = total.add(new BigDecimal(s));   // từ chuỗi, chính xác
        return total.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
    boolean amountsEqual(String a, String b) {
        return new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;   // so giá trị, bỏ qua scale
    }
    String roundMoney(String amount) {
        return new BigDecimal(amount).setScale(2, RoundingMode.HALF_UP).toPlainString();   // từ chuỗi
    }
}
~~~

### Tại sao double sai (cơ chế)
- double là số dấu phẩy động nhị phân: 0.1 không lưu chính xác (phân số vô hạn trong nhị phân). Mỗi phép cộng làm tròn, sai số tích lũy. Ví dụ: tổng 0.10 + 0.20 + 0.30 in ra 0.6000000000000001 không phải 0.60.
- Một trăm nghìn giao dịch nhân 0.10 bằng double tổng ra 1000.0000000001588, chênh lệch 1,588e-10 — bé tại một giao dịch, lớn khi điền vào báo công ty.

### Thứ tự xử lý tiền ở biến
Khi đọc từ file hoặc API, chuyển ngay sang BigDecimal từ CHUỖI trả về; không cho double sót ra logic nghiệp vụ. Scale quy ước: 2 chữ số thập phân với USD/EUR, 0 với VND.

### So sánh
| Cách | 10.00 vs 10.0 | 2.005 làm tròn | Ghi chú |
|---|---|---|---|
| double == | giống (may mắn) | sai khi nhân 100 | không tin được tiền |
| new BigDecimal(double) | giống | 2.00 (SAI) | bắt đầu từ sai số nhị phân |
| new BigDecimal(String) + compareTo | GIỐNG | 2.01 (ĐÚNG) | nên dùng tiền |

### Phòng ngừa
- Quy tắc kiểm duyệt: tiền không được dùng double hoặc float.
- Test dữ liệu có 3 chữ số thập phân (2.005, 1.005, 0.125) để bắt lỗi làm tròn.
- Dùng BigDecimal.valueOf(double) nếu bắt buộc nhận double; tránh new BigDecimal(double).
- Lưu DB: NUMERIC(19,2) hoặc BIGINT lưu số đơn vị nhỏ nhất (cent).

### Trả lời mẫu khi phỏng vấn (60-90 giây)
"Tiền phải lưu và tính bằng BigDecimal, bao giờ không bằng double, vì double lưu nhị phân không chính xác phần số thập phân — 0.1 bị sai số ít, tiền lưu hàng nghìn giao dịch thì lệch vài đồng. Em dùng new BigDecimal từ chuỗi hoặc BigDecimal.valueOf, không dùng new BigDecimal(double). So sánh tiền dùng compareTo bằng 0 (bỏ qua scale, nên 10.00 bằng 10.0), làm tròn tiền dùng setScale(2, HALF_UP). Ở DB em lưu NUMERIC(19,2) hoặc BIGINT cent và chuẩn hóa scale ngay khi đọc dữ liệu vào hệ thống."

> Senior tip: Một lỗi ít sai số trên một giao dịch trở thành sai số lớn khi cộng hàng nghìn lần. Luôn tiền tệ về "đơn vị nhỏ nhất" (cent) lưu bằng BIGINT, hoặc NUMERIC có scale cố định, chuẩn hóa tại biến, không bao giờ để double "mượt" vào code tiền tệ.`,
  related: ['core-021', 'banking-036'],
  tags: ['BigDecimal', 'double', 'compareTo', 'scale', 'tien', 'doi soat']
},
{
  id: 'bug-031',
  title: 'So tien bang BigDecimal.equals: 10.00 khac 10.0',
  domain: 'Ngân hàng / Đối soát',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Tóm tắt:** {{BigDecimal.equals}} so sánh CA hai thang: gia tri VA cach viet (so chu so thap phan). Nen {{10.00}} khac {{10.0}}. Dung de kiem tra "da xu ly" hoac "hoan tien khop don goc" se coi hai tien bang gia tri nhung format khac la KHAC nhau -> tu choi hoan tien hop ly hoac xu ly tien truong.

**Bối cảnh dự án:** Hệ thống thanh toán ghi danh sách số tiền đã xử lý vào một {{Set<BigDecimal>}} để loại bỏ trùng lặp cho lệnh hoàn tiền được gửi lại từ cổng thanh toán. Cổng A gửi tiền thẻ 10.00, cổng B gửi cùng một đơn hàng nhưng tiền thẻ 10.0. Code dùng {{processedAmounts.contains(new BigDecimal(amount))}} để quyết định đã xử lý chưa.

**Sự cố:** Đêm 07/11, đối soát báo **3.412** cặp tiền bị đánh dấu lệch (0,4% tổng số; tổng tiền các cặp này lên 1,2 tỷ đồng nhưng thực chỉ là hiệu nhầm định dạng), cũng có **128** khách được hoàn tiền **hai lần** vì gửi lại có dạng 10.0 hệ thống cho là "chưa từng xử lý" và tạo lệnh hoàn mới. Kiểm tra từng cặp thấy số tiền bằng nhau về giá trị, sai chỉ ở cách ghi số thập phân.

**Nhiem vụ cua ban:** Sua {{PaymentDedupe}}: so sanh tien bang {{compareTo}} == 0; truoc khi dung tien lam khoa cua {{Set}} hoac {{Map}}, chuan hoa ve scale co dinh (2 chu so thap phan) bang {{setScale(2, RoundingMode.HALF_UP)}}; KHONG dung {{equals}} hay {{hashCode}} cua {{BigDecimal}} lam danh nghiep vu.`,
  artifacts: [
    { name: 'refund-mismatch.log', lang: 'text', content: `2026-11-07 21:02:11 WARN RefundMatcher : PAY-55210 amount=100.00 vs refund=100.0 -> FLAG LECH (equals=false)
2026-11-07 21:02:15 WARN RefundMatcher : PAY-55211 amount=250.50 vs refund=250.5 -> FLAG LECH
2026-11-07 21:03:00 WARN RefundMatcher : 3.412 cap bi danh dau lech trong ca dem` },
    { name: 'dedupe-report.txt', lang: 'text', content: `RETRY PAY-77302 so tien 10.00 lan 1 -> da hoan tien
RETRY PAY-77302 so tien 10.0 lan 2 -> contains(new BigDecimal("10.0")) = false -> TAO LENH HOAN MOI
Ket qua: khach nhan hoan tien 2 lan cho cung mot giao dich` },
  ],
  starter: `// ===== Code cần sửa =====
class PaymentDedupe {
    private final Set<BigDecimal> processedAmounts = new HashSet<>();

    boolean sameAmount(String a, String b) {
        return new BigDecimal(a).equals(new BigDecimal(b));
    }

    boolean alreadyProcessed(String amount) {
        return processedAmounts.contains(new BigDecimal(amount));
    }

    void markProcessed(String amount) {
        processedAmounts.add(new BigDecimal(amount));
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        PaymentDedupe d = new PaymentDedupe();

        // 1. Cung gia tri, cach viet khac -> phai bang nhau
        check("muc_bang_nhau_khac_scale", d.sameAmount("100.00", "100.0"),
            "100.00 va 100.0 phai bang nhau gia tri, thuc te " + d.sameAmount("100.00", "100.0"));

        // 2. Gia tri thuc su khac -> phai lech
        check("muc_khac_nhau_thi_lech", !d.sameAmount("100.00", "100.01"),
            "100.00 va 100.01 phai lech");

        // 3. Da xu ly thi nhan lai dung khi doi dang nhap
        d.markProcessed("10.00");
        check("da_xu_ly_van_co_duoc_bo_qua", d.alreadyProcessed("10.0"),
            "da xu ly 10.00, thu lai bang 10.0 phai biet da xu ly, thuc te " + d.alreadyProcessed("10.0"));

        // 4. Chua xu ly thi van la moi
        check("so_khac_van_moi", d.alreadyProcessed("10.01") == false,
            "10.01 chua xu ly phai tra false");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class PaymentDedupe {
    private static final int MONEY_SCALE = 2;
    private final Set<BigDecimal> processedAmounts = new HashSet<>();

    boolean sameAmount(String a, String b) {
        return new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;   // so GIA TRI
    }

    boolean alreadyProcessed(String amount) {
        return processedAmounts.contains(canonical(amount));
    }

    void markProcessed(String amount) {
        processedAmounts.add(canonical(amount));
    }

    private BigDecimal canonical(String amount) {
        return new BigDecimal(amount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);   // chuan hoa scale
    }
}`,
  hints: [
    'Chay test 1: new BigDecimal("100.00").equals(new BigDecimal("100.0")) tra true hay false? Vì equals cua BigDecimal ca scale.',
    'contains cua HashSet dung equals: 10.00 da them, tim 10.0 thi khong tim thay -> he thong tao lenh hoan moi.',
    'Sua: compareTo == 0 so gia tri; setScale(2, HALF_UP) chuan hoa scale truoc khi them vao Set de hashCode/equals cua khoa deu dung.'
  ],
  rootCause: `**Nguyên nhân gốc:** BigDecimal lưu hai phần: {{intVal}} (số nguyên không dấu) và {{scale}} (số chữ số thập phân). {{equals}} của BigDecimal so sánh **cả hai**, nên 10.00 ({{intVal}}=1000, {{scale}}=2) khác 10.0 ({{intVal}}=100, {{scale}}=1) dù giá trị bằng nhau. {{contains}} của HashSet dùng equals => 10.00 đã thêm vào Set, lần sau tìm 10.0 (cùng giá trị, khác {{scale}}) trả về false => hệ thống cho là \"chưa xử lý\" và tạo lệnh hoàn tiền mới. Cùng nguyên nhân: khớp hoàn tiền với đơn gốc bị từ chối oan vì equals=false.`,
  fix: `### Cách sửa trong bài

~~~java
class PaymentDedupe {
    private static final int MONEY_SCALE = 2;
    private final Set<BigDecimal> processedAmounts = new HashSet<>();

    boolean sameAmount(String a, String b) {
        return new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;   // so GIÁ TRỊ
    }

    boolean alreadyProcessed(String amount) {
        return processedAmounts.contains(canonical(amount));
    }

    void markProcessed(String amount) {
        processedAmounts.add(canonical(amount));
    }

    private BigDecimal canonical(String amount) {
        return new BigDecimal(amount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);   // chuẩn hóa scale
    }
}
~~~

### Tại sao lỗi xảy ra (cơ chế)
- BigDecimal.equals kiểm tra intVal VÀ scale. 10.00 và 10.0 có giá trị bằng nhau nhưng scale khác => equals = false => hashCode cũng khác => chúng là HAI khóa khác nhau trong HashSet/HashMap.
- contains tìm theo bucket của hashCode của 10.0, nhưng 10.00 ở bucket khác -> không tìm thấy -> "chưa xử lý" -> xử lý lại -> hoàn tiền trùng.

### Thứ tự xử lý tiền
Chuẩn hóa scale (2 chữ số thập phân cho USD/EUR) ngay khi tạo BigDecimal, trước khi dùng làm khóa Set/Map hoặc lưu DB (NUMERIC(19,2) / BIGINT cent).

### So sánh
| Cách | 10.00 == 10.0? | Dùng làm khóa Set? | Ghi chú |
|---|---|---|---|
| equals | SAI (false) | Không | có scale |
| compareTo == 0 | ĐÚNG (0) | ĐÚNG nếu chuẩn hóa scale trước | so giá trị |

### Phòng ngừa
- Kiểm duyệt: tiền không được dùng equals/hashCode của BigDecimal làm nghiệp vụ.
- Test: 10.00 vs 10.0, -25.50 vs -25.5, 0.00 vs 0.0 phải bằng nhau; 100.00 vs 100.01 phải khác.
- Dùng AssertJ isEqualByComparingTo trong test thay assertEquals mặc định.

### Trả lời mẫu khi phỏng vấn
"BigDecimal.equals không dùng để so tiền vì nó so cả scale — 10.00 và 10.0 bị coi khác nhau. Em dùng compareTo bằng 0 để so giá trị, và setScale(2, HALF_UP) để chuẩn hóa scale trước khi dùng tiền làm khóa Set/Map. Ở DB lưu tiền bằng NUMERIC(19,2) hoặc BIGINT cent. Test phải cover cả trường hợp giá trị bằng nhau nhưng format khác."

> Senior tip: equals/hashCode của BigDecimal thuần túy là "giá trị + cách viết", không phải "giá trị tiền tệ". Nhưng code có tên là sameAmount hay dedupe tiền phải tự đọc quy ước scale, không được assume toàn bộ hệ thống ghi scale giống nhau.`,
  related: ['core-021', 'banking-036'],
  tags: ['BigDecimal', 'equals', 'compareTo', 'scale', 'tien', 'doi soat']
},
{
  id: 'bug-032',
  title: 'API chuyển tiền thiếu idempotency: client retry POST sau timeout làm trừ tiền hai lần',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ví điện tử 1.5 triệu người dùng. API {{POST /api/v1/transfers}} nhận lệnh chuyển tiền, gọi {{TransferService.execute}} để trừ ví người gửi, cộng ví người nhận, ghi sổ cái. Khách hàng hay bấm nút "Chuyển tiền" nhiều lần khi mạng chậm hoặc app hiển thị "Đang xử lý..." quá lâu. Team FE đã thêm khóa vô hiệu hoá nút sau 1 lần bấm, nhưng client mobile cũ (vẫn 15% người dùng) không có bản cập nhật đó, và trình duyệt tự retry POST khi timeout (mặc định 30s).
  **Sự cố:** Sáng 20/11, đối soát phát hiện **237 giao dịch** bị trừ tiền 2 lần (cùng số tiền, cùng ví gửi/nhận, cách nhau 10–45 giây). Tổng số tiền trùng lặp khoảng **890 triệu đồng**. Log cho thấy hai request mang **cùng {{requestId}}** (client FE sinh UUID khi mở màn hình chuyển tiền) nhưng server tạo hai bản ghi sổ cái khác nhau. Khách khiếu nại "bị trừ 2 lần mà chỉ bấm 1 lần" — thực tế do client retry sau timeout 30s.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{TransferController.execute}} và {{TransferService.execute}}, tìm vì sao cùng {{requestId}} vẫn tạo hai giao dịch.
  2. Sửa để: (a) lưu {{Idempotency-Key}} (là {{requestId}}) với **ràng buộc duy nhất (unique constraint)** ở DB; (b) nếu key đã xử lý xong thì trả lại kết quả cũ; (c) nếu key đang được xử lý bởi request khác thì chờ request đó xong và trả kết quả đó (single-flight). Test dùng rào chặn để ép hai request cùng key chạy song song.`,
  artifacts: [
    { name: 'transfer-service.log', lang: 'text', content: `2026-11-20 09:12:44.118 INFO  [http-nio-8080-exec-17] TransferController : execute requestId=req-7f3a from=W-1001 to=W-2002 amount=500000
2026-11-20 09:13:18.118 INFO  [http-nio-8080-exec-23] TransferController : execute requestId=req-7f3a from=W-1001 to=W-2002 amount=500000   <- client retry (timeout 30s, cách request đầu 34s)
2026-11-20 09:12:44.355 INFO  [http-nio-8080-exec-17] TransferService    : debit from=W-1001 amount=500000 ok
2026-11-20 09:12:44.358 INFO  [http-nio-8080-exec-17] TransferService    : credit to=W-2002 amount=500000 ok
2026-11-20 09:12:44.362 INFO  [http-nio-8080-exec-17] TransferService    : ledger write TR-77120 SUCCESS
2026-11-20 09:13:18.355 INFO  [http-nio-8080-exec-23] TransferService    : debit from=W-1001 amount=500000 ok
2026-11-20 09:13:18.358 INFO  [http-nio-8080-exec-23] TransferService    : credit to=W-2002 amount=500000 ok
2026-11-20 09:13:18.362 INFO  [http-nio-8080-exec-23] TransferService    : ledger write TR-77121 SUCCESS` },
    { name: 'reconcile-2026-11-20.txt', lang: 'text', content: `RECONCILIATION 2026-11-20 06:00 ICT
Duplicate transfers (same requestId)           : 237
Total over-charged (VND)                       : 890,250,000
Pattern                                        : 2 ledger rows within < 60s, same from/to/amount, same requestId
Note: table idempotency_keys has NO unique constraint on request_id` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
record TransferCmd(String requestId, String fromWallet, String toWallet, long amount) {}
record TransferResult(String transferId, String status) {}

class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String m) { super(m); }
}

// Mô phỏng DB: bảng transfers (ghi sổ cái) + bảng idempotency_keys (chưa có unique constraint)
class TransferStore {
    final Map<String, String> transfers = new ConcurrentHashMap<>();       // requestId -> transferId
    final Map<String, String> idemKeys = new ConcurrentHashMap<>();        // requestId -> transferId (nếu đã xong)
    final Map<String, Object> inProgress = new ConcurrentHashMap<>();      // requestId -> lock object (nếu đang chạy)
    final AtomicLong seq = new AtomicLong(77119);

    String nextTransferId() { return "TR-" + seq.incrementAndGet(); }
    void writeLedger(String transferId, String from, String to, long amount) {
        transfers.put(transferId, from + "->" + to + ":" + amount);
    }
    String findByRequestId(String requestId) { return idemKeys.get(requestId); }
    void markDone(String requestId, String transferId) { idemKeys.put(requestId, transferId); }
    Object getOrCreateLock(String requestId) { return inProgress.computeIfAbsent(requestId, k -> new Object()); }
    void removeLock(String requestId) { inProgress.remove(requestId); }
}

// ===== Code cần sửa =====
class TransferService {
    private final TransferStore store;
    TransferService(TransferStore store) { this.store = store; }

    TransferResult execute(TransferCmd cmd) {
        // Kiểm tra đã xử lý chưa
        String existing = store.findByRequestId(cmd.requestId());
        if (existing != null) return new TransferResult(existing, "DUPLICATE");

        // Thực hiện chuyển tiền (giả lập: luôn thành công, không check số dư)
        String transferId = store.nextTransferId();
        // BUG: không có khoá cho requestId đang chạy -> hai request cùng key cùng lọt qua đây
        // giả lập độ trễ DB
        try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        store.writeLedger(transferId, cmd.fromWallet(), cmd.toWallet(), cmd.amount());
        store.markDone(cmd.requestId(), transferId);
        return new TransferResult(transferId, "SUCCESS");
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        // 1. Request mới: tạo giao dịch thành công
        TransferStore s1 = new TransferStore();
        TransferService svc1 = new TransferService(s1);
        TransferResult r1 = svc1.execute(new TransferCmd("req-1", "W-1", "W-2", 100000));
        check("request_moi_tao_giao_dich", "SUCCESS".equals(r1.status()) && s1.transfers.size() == 1,
            "request mới phải tạo 1 giao dịch, thực tế status=" + r1.status() + " transfers=" + s1.transfers.size());

        // 2. Gọi lại cùng requestId (tuần tự): phải trả lại kết quả cũ, không tạo thêm
        TransferResult r1b = svc1.execute(new TransferCmd("req-1", "W-1", "W-2", 100000));
        check("trung_key_tuan_tu", "DUPLICATE".equals(r1b.status()) && r1b.transferId().equals(r1.transferId()) && s1.transfers.size() == 1,
            "phải trả lại " + r1.transferId() + " và không tạo thêm, thực tế status=" + r1b.status() + " id=" + r1b.transferId() + " transfers=" + s1.transfers.size());

        // 3. Hai request CÙNG requestId chạy ĐỒNG THỜI (đúng như client retry khi timeout)
        TransferStore s3 = new TransferStore();
        TransferService svc3 = new TransferService(s3);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch bothIn = new CountDownLatch(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<TransferResult> f1 = pool.submit(() -> { bothIn.countDown(); start.await(); return svc3.execute(new TransferCmd("req-dup", "W-A", "W-B", 500000)); });
        Future<TransferResult> f2 = pool.submit(() -> { bothIn.countDown(); start.await(); return svc3.execute(new TransferCmd("req-dup", "W-A", "W-B", 500000)); });
        bothIn.await(3, TimeUnit.SECONDS);
        start.countDown();
        TransferResult a = f1.get(5, TimeUnit.SECONDS);
        TransferResult b = f2.get(5, TimeUnit.SECONDS);
        pool.shutdownNow();
        check("trung_key_dong_thoi", s3.transfers.size() == 1 && a.transferId().equals(b.transferId()),
            "chỉ được 1 giao dịch và cả hai request nhận cùng transferId, thực tế transfers=" + s3.transfers.size() + " a=" + a.transferId() + " b=" + b.transferId());

        // 4. Hai requestId khác nhau: phải tạo hai giao dịch khác nhau
        TransferStore s4 = new TransferStore();
        TransferService svc4 = new TransferService(s4);
        svc4.execute(new TransferCmd("req-A", "W-1", "W-2", 100000));
        svc4.execute(new TransferCmd("req-B", "W-1", "W-2", 200000));
        check("hai_key_khac_nhau", s4.transfers.size() == 2,
            "hai requestId khác nhau phải tạo 2 giao dịch, thực tế " + s4.transfers.size());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
record TransferCmd(String requestId, String fromWallet, String toWallet, long amount) {}
record TransferResult(String transferId, String status) {}

class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String m) { super(m); }
}

class TransferStore {
    final Map<String, String> transfers = new ConcurrentHashMap<>();
    final Map<String, String> idemKeys = new ConcurrentHashMap<>();
    final Map<String, Object> inProgress = new ConcurrentHashMap<>();
    final AtomicLong seq = new AtomicLong(77119);

    String nextTransferId() { return "TR-" + seq.incrementAndGet(); }
    void writeLedger(String transferId, String from, String to, long amount) {
        transfers.put(transferId, from + "->" + to + ":" + amount);
    }
    String findByRequestId(String requestId) { return idemKeys.get(requestId); }
    void markDone(String requestId, String transferId) { idemKeys.put(requestId, transferId); }
    Object getOrCreateLock(String requestId) { return inProgress.computeIfAbsent(requestId, k -> new Object()); }
    void removeLock(String requestId) { inProgress.remove(requestId); }
}

// ===== Code đã sửa =====
class TransferService {
    private final TransferStore store;
    TransferService(TransferStore store) { this.store = store; }

    TransferResult execute(TransferCmd cmd) {
        // 1) Nhanh: đã có kết quả xong -> trả ngay (idempotent read)
        String done = store.findByRequestId(cmd.requestId());
        if (done != null) return new TransferResult(done, "DUPLICATE");

        // 2) Lấy khoá riêng cho requestId này: các request cùng key sẽ xếp hàng, key khác nhau không chặn nhau
        Object lock = store.getOrCreateLock(cmd.requestId());
        synchronized (lock) {
            // Double-check sau khi có khoá: request khác có thể vừa xong
            String done2 = store.findByRequestId(cmd.requestId());
            if (done2 != null) return new TransferResult(done2, "DUPLICATE");

            // 3) Thực hiện chuyển tiền
            String transferId = store.nextTransferId();
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            store.writeLedger(transferId, cmd.fromWallet(), cmd.toWallet(), cmd.amount());
            store.markDone(cmd.requestId(), transferId);
            return new TransferResult(transferId, "SUCCESS");
        }
    }
}`,
  hints: [
    'Đọc log: hai request cùng {{requestId=req-7f3a}} nhưng server tạo {{TR-77120}} và {{TR-77121}}. Code có kiểm tra {{findByRequestId}} trước khi tạo không? Có, nhưng nó chỉ đọc — nếu hai request cùng lúc đều thấy "chưa có" thì vẫn cùng tạo.',
    'Đây là check-then-act (kiểm tra rồi hành động) trên idempotency key. Cần biến "kiểm tra → tạo → lưu" thành thao tác nguyên tử cho mỗi key. Cách làm: khoá theo requestId (ConcurrentHashMap.getOrCreateLock) rồi double-check bên trong khoá.',
    'Trên production thật (nhiều pod), khoá trong JVM không đủ. Phải có **unique constraint** trên cột {{request_id}} của bảng {{idempotency_keys}}: INSERT vào bảng này trong cùng transaction với ghi sổ cái. Nếu vi phạm unique thì SELECT lại kết quả cũ và trả về.',
  ],
  rootCause: `**Thiếu cơ chế idempotency (tính bất biến khi lặp lại) đúng mức trên khóa requestId.** Client gửi {{requestId}} như một idempotency key, nhưng {{TransferService.execute}} chỉ làm {{findByRequestId}} (đọc) rồi nếu chưa có thì tạo mới và {{markDone}} (ghi). Hai request cùng {{requestId}} chạy song song đều thấy "chưa có" (vì chưa request nào kịp ghi), nên cùng tạo giao dịch mới — đúng như log: cả hai request cùng gọi {{execute}}, cả hai đều lọt qua kiểm tra, tạo {{TR-77120}} và {{TR-77121}} cách nhau 34 giây (client retry sau timeout 30s). Bảng {{idempotency_keys}} không có unique constraint nên DB không chặn được bản ghi trùng.

  Nguyên nhân sâu hơn: **check-then-act không nguyên tử**. Đoạn {{if (existing != null) return ...; ... create ...; markDone()}} gồm nhiều bước tách rời. Giữa "thấy chưa có" và "ghi đã có", luồng khác xen vào cũng thấy "chưa có". Cần một điểm chốt duy nhất: khoá theo key trong tiến trình (single-flight), và unique constraint ở DB để chốt chéo nhiều pod.`,
  fix: `### Cách sửa trong bài
1. **Khoá theo requestId (single-flight):** dùng {{ConcurrentHashMap<requestId, Object>}} + {{synchronized}} để các request cùng key chạy tuần tự, key khác nhau vẫn song song.
2. **Double-check bên trong khoá:** sau khi có khoá, đọc lại {{findByRequestId}} — request cùng key chạy trước có thể vừa xong.
3. **Chỉ tạo giao dịch khi thực sự chưa có:** nếu double-check thấy đã có thì trả kết quả cũ.

~~~java
Object lock = store.getOrCreateLock(cmd.requestId());
synchronized (lock) {
    String done2 = store.findByRequestId(cmd.requestId());
    if (done2 != null) return new TransferResult(done2, "DUPLICATE");
    String transferId = store.nextTransferId();
    store.writeLedger(transferId, cmd.fromWallet(), cmd.toWallet(), cmd.amount());
    store.markDone(cmd.requestId(), transferId);
    return new TransferResult(transferId, "SUCCESS");
}
~~~

### Trên production thật (nhiều pod / nhiều tiến trình)
Khoá trong JVM chỉ chặn trong **một** tiến trình; hai request cùng key có thể rơi vào hai pod khác nhau. Điểm chốt phải nằm ở **database**:
~~~sql
-- Bảng idempotency_keys: request_id là khóa chính / unique
CREATE TABLE idempotency_keys (
    request_id VARCHAR(64) PRIMARY KEY,
    transfer_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL,          -- 'DONE' | 'IN_PROGRESS'
    response_json JSONB,                  -- lưu kết quả để trả lại
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
~~~
- Trong **một transaction**: {{INSERT INTO idempotency_keys (request_id, status) VALUES (:reqId, 'IN_PROGRESS') ON CONFLICT (request_id) DO UPDATE SET status = 'IN_PROGRESS' WHERE idempotency_keys.status != 'DONE' RETURNING transfer_id, status}}.
  - Nếu trả về status {{'DONE'}}: đã xử lý xong -> đọc {{transfer_id}} (hoặc {{response_json}}) và trả về.
  - Nếu trả về status {{'IN_PROGRESS'}} (vừa chèn mới): tiến hành xử lý nghiệp vụ, ghi sổ cái, rồi {{UPDATE idempotency_keys SET status='DONE', transfer_id=..., response_json=... WHERE request_id=:reqId}}.
  - Nếu transaction rollback (lỗi nghiệp vụ): {{status}} vẫn là {{'IN_PROGRESS'}} — cần job dọn dẹp (timeout) hoặc client retry sẽ thấy IN_PROGRESS và chờ/polling.
- **Cùng key nhưng payload khác:** lưu hash của request body vào cột {{request_hash}}, khi conflict kiểm tra hash khớp không; không khớp -> từ chối (409).

### So sánh
| Cách | Đúng nhiều pod | Xử lý request đang chạy | Ghi chú |
|---|---|---|---|
| Chỉ check-then-act (không khoá, không unique) | **Không** | Không | Bài gốc — sai |
| Khoá JVM + double-check | Không | **Có** (single-flight) | Chỉ đúng 1 pod |
| Unique constraint DB + insert-or-return | **Có** | Không (lỗi unique -> SELECT lại) | Chuẩn, đơn giản |
| Bảng idempotency_keys + status IN_PROGRESS/DONE | **Có** | **Có** (polling hoặc chờ) | Mạnh nhất, hỗ trợ single-flight đa tiến trình |

### Phòng ngừa
- Quy tắc review: mọi API tạo tài nguyên / trừ tiền / ghi sổ cái **bắt buộc** có idempotency key từ client và unique constraint ở DB.
- Test: bắn 2 request cùng key đồng thời (CountDownLatch) -> chỉ 1 bản ghi; bắn tuần tự -> trả kết quả cũ.
- Client FE: sinh requestId khi **mở màn hình** (không phải khi bấm nút), gửi kèm mọi retry.
- Đối soát hằng ngày: đếm số requestId trùng trong bảng idempotency_keys / sổ cái.

### Liên hệ phỏng vấn
Khi được hỏi "làm sao tránh trừ tiền 2 lần khi user bấm 2 lần / client retry?", trả lời theo lớp: (1) client gửi idempotency key cho mỗi ý định (sinh khi mở màn hình, không phải lúc bấm), (2) server single-flight bằng khoá theo key (single-flight pattern), (3) unique constraint ở DB là chốt cuối cùng, (4) khi đụng unique constraint thì đọc lại và trả kết quả cũ thay vì báo lỗi. Nhắc thêm: idempotency áp dụng cho mọi thao tác không an toàn khi lặp (POST thanh toán, webhook, job retry, Kafka consumer).

> Senior tip: Idempotency key là "hợp đồng" giữa client và server: client hứa gửi lại cùng key khi retry, server hứa cùng key cho cùng kết quả. Unique constraint ở DB là mạng lưới an toàn rẻ và chắc nhất — đừng tin hoàn toàn vào kiểm tra trong bộ nhớ hay khoá trong một tiến trình khi hệ thống chạy nhiều pod.`,
  related: ['scenario-119'],
  tags: ['idempotency', 'duplicate transfer', 'unique constraint', 'single-flight', 'concurrency', 'fintech']
},
{
  id: 'bug-033',
  title: 'Rate limiter token bucket race condition cho phép burst vượt giới hạn',
  domain: 'API Gateway / Bảo vệ dịch vụ',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** API Gateway (Spring Cloud Gateway, 6 pod) bảo vệ các dịch vụ backend bằng **rate limiter** kiểu token bucket (xô mã thông báo) trên mỗi client (API key). Cấu hình: mỗi client được **100 request/giây** (refill rate), bucket tối đa **200 token** (burst allowance). Rate limiter được viết tự do trong filter của Gateway, dùng {{ConcurrentHashMap<clientId, TokenBucket>}}.
  **Sự cố:** Đợt flash sale 15/11, một đối tác lớn gửi traffic 500 req/s (vượt 5 lần quota) nhưng **không bị chặn** — dashboard rate limiter cho thấy "allowed" gần 100% trong 2 phút. Kết quả: service {{order-service}} quá tải, p99 latency từ 120ms lên 4.2s, 3 pod OOMKilled. Sau khi restart, rate limiter trở lại hoạt động bình thường.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{TokenBucket.tryConsume}} và log, tìm vì sao burst traffic vượt bucket max mà không bị từ chối.
  2. Sửa để: (a) token bucket đúng toán học (không bao giờ vượt maxTokens); (b) refill dựa trên thời gian thực (wall-clock), không dựa trên số lần gọi; (c) thread-safe khi nhiều request cùng client chạy song song. Test ép 500 request song song từ cùng client vào bucket 200 token.`,
  artifacts: [
    { name: 'gateway-rate-limit.log', lang: 'text', content: `2026-11-15 14:30:11.105 DEBUG RateLimitFilter : client=PARTNER-A tokens=200 -> allow (remaining=199)
2026-11-15 14:30:11.106 DEBUG RateLimitFilter : client=PARTNER-A tokens=200 -> allow (remaining=198)
...
2026-11-15 14:30:11.312 DEBUG RateLimitFilter : client=PARTNER-A tokens=200 -> allow (remaining=199)   <- token KHÔNG GIẢM
2026-11-15 14:30:11.313 DEBUG RateLimitFilter : client=PARTNER-A tokens=200 -> allow (remaining=198)
...
2026-11-15 14:30:13.001 WARN  OrderService       : queue depth 15000, rejecting new requests
2026-11-15 14:30:13.112 ERROR OrderService       : java.lang.OutOfMemoryError: Java heap space` },
    { name: 'token-bucket-code-review.txt', lang: 'text', content: `CODE REVIEW FINDINGS (RateLimiter.java):
- Line 47: refill() called INSIDE tryConsume() -> every call adds tokens based on elapsed time since LAST CALL, not since last refill.
- Line 52: tokens = Math.min(maxTokens, tokens + added) -> but 'added' computed from (now - lastRefillTime) where lastRefillTime updated AFTER min().
- Race: two threads read tokens=200, both compute added=0, both allow, both write tokens=199 -> ONE token consumed for TWO requests.
- lastRefillTime is a plain 'long', not volatile/AtomicLong -> visibility issue across threads.` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Clock {
    private final AtomicLong now = new AtomicLong(System.currentTimeMillis());
    long millis() { return now.get(); }
    void advance(long ms) { now.addAndGet(ms); }
}

class RateLimitExceededException extends RuntimeException {
    RateLimitExceededException(String m) { super(m); }
}

// ===== Code cần sửa =====
class TokenBucket {
    private final long maxTokens;
    private final double refillRatePerSec;   // token mỗi giây
    private double tokens;                   // token hiện có (có phần thập phân do refill rate)
    private long lastRefillTime;             // ms epoch

    TokenBucket(long maxTokens, double refillRatePerSec, Clock clock) {
        this.maxTokens = maxTokens;
        this.refillRatePerSec = refillRatePerSec;
        this.tokens = maxTokens;
        this.lastRefillTime = clock.millis();
    }

    // Gọi mỗi request: nạp token theo thời gian trôi qua, rồi thử trừ 1.
    // Trả true nếu còn token (cho phép), false nếu hết (từ chối).
    boolean tryConsume(Clock clock) {
        refill(clock);
        if (tokens >= 1.0) {
            Thread.yield(); // Mở rộng cửa sổ race: thread khác có thể đọc cùng giá trị trước khi ghi
            tokens -= 1.0;
            return true;
        }
        return false;
    }

    private void refill(Clock clock) {
        long now = clock.millis();
        long elapsed = now - lastRefillTime;
        double added = elapsed * refillRatePerSec / 1000.0;
        tokens = Math.min(maxTokens, tokens + added);
        lastRefillTime = now;
    }

    double getTokens() { return tokens; }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        Clock clock = new Clock();

        // 1. Bucket đầy: 200 request đầu tiên phải cho phép, request 201 bị từ chối
        TokenBucket b1 = new TokenBucket(200, 100.0, clock);
        int allowed = 0;
        for (int i = 0; i < 250; i++) if (b1.tryConsume(clock)) allowed++;
        check("bucket_day_cho_phep_200", allowed == 200,
            "bucket max 200 phải cho 200 request, thực tế " + allowed);

        // 2. Sau 1 giây, refill 100 token: phải cho thêm 100 request
        clock.advance(1000);
        allowed = 0;
        for (int i = 0; i < 150; i++) if (b1.tryConsume(clock)) allowed++;
        check("refill_sau_1_giay", allowed == 100,
            "sau 1s refill 100 token phải cho thêm 100, thực tế " + allowed);

        // 3. Không bao giờ vượt maxTokens: nạp 10s rồi thử -> vẫn chỉ max 200
        clock.advance(10000);
        TokenBucket b3 = new TokenBucket(200, 100.0, clock);
        allowed = 0;
        for (int i = 0; i < 300; i++) if (b3.tryConsume(clock)) allowed++;
        check("khong_vuot_max_tokens", allowed == 200,
            "dù nạp lâu, bucket không vượt 200, thực tế " + allowed);

        // 4. TÁI HIỆN SỰ CỐ: 500 request CÙNG LÚC từ cùng client -> không được cho quá 200
        Clock clock4 = new Clock();
        TokenBucket b4 = new TokenBucket(200, 100.0, clock4);
        ExecutorService pool = Executors.newFixedThreadPool(50);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger allowed4 = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 500; i++) {
            futures.add(pool.submit(() -> {
                try { start.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
                if (b4.tryConsume(clock4)) allowed4.incrementAndGet();
            }));
        }
        start.countDown();
        for (Future<?> f : futures) f.get(5, TimeUnit.SECONDS);
        pool.shutdownNow();
        check("dong_thoi_500_request", allowed4.get() == 200,
            "500 request đồng thời vào bucket 200 token chỉ được cho 200, thực tế " + allowed4.get());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Clock {
    private final AtomicLong now = new AtomicLong(System.currentTimeMillis());
    long millis() { return now.get(); }
    void advance(long ms) { now.addAndGet(ms); }
}

class RateLimitExceededException extends RuntimeException {
    RateLimitExceededException(String m) { super(m); }
}

// ===== Code đã sửa =====
class TokenBucket {
    private final long maxTokens;
    private final double refillRatePerSec;
    private final AtomicLong tokensNano;           // token * 1_000_000 (tránh double race)
    private final AtomicLong lastRefillNanos;

    TokenBucket(long maxTokens, double refillRatePerSec, Clock clock) {
        this.maxTokens = maxTokens;
        this.refillRatePerSec = refillRatePerSec;
        this.tokensNano = new AtomicLong((long) (maxTokens * 1_000_000));
        this.lastRefillNanos = new AtomicLong(clock.millis() * 1_000_000L);
    }

    boolean tryConsume(Clock clock) {
        long nowNanos = clock.millis() * 1_000_000L;
        refill(nowNanos);
        // CAS loop: chỉ trừ khi còn >= 1 token (1_000_000 nano-tokens)
        long current, next;
        do {
            current = tokensNano.get();
            if (current < 1_000_000) return false;
            next = current - 1_000_000;
        } while (!tokensNano.compareAndSet(current, next));
        return true;
    }

    private void refill(long nowNanos) {
        long last = lastRefillNanos.get();
        long elapsedNanos = nowNanos - last;
        if (elapsedNanos <= 0) return;
        // Tính token cần thêm: elapsedNanos * rate / 1e9 -> nano-tokens
        long addedNano = (long) (elapsedNanos * refillRatePerSec * 1_000_000.0 / 1_000_000_000.0);
        if (addedNano <= 0) return;
        // CAS loop để cộng token và cập nhật lastRefillNanos nguyên tử
        while (true) {
            long currentTokens = tokensNano.get();
            long currentLast = lastRefillNanos.get();
            if (currentLast != last) {
                last = currentLast;
                elapsedNanos = nowNanos - last;
                if (elapsedNanos <= 0) return;
                addedNano = (long) (elapsedNanos * refillRatePerSec * 1_000_000.0 / 1_000_000_000.0);
                if (addedNano <= 0) return;
                continue;
            }
            long newTokens = Math.min(maxTokens * 1_000_000L, currentTokens + addedNano);
            long newLast = nowNanos;
            if (tokensNano.compareAndSet(currentTokens, newTokens)
                    && lastRefillNanos.compareAndSet(currentLast, newLast)) {
                return;
            }
        }
    }

    double getTokens() { return tokensNano.get() / 1_000_000.0; }
}`,
  hints: [
    'Đọc log: token luôn in ra 200 cho hàng trăm request liên tiếp — refill không hoạt động đúng. Và code review chỉ ra: refill() được gọi BÊN TRONG tryConsume, lastRefillTime cập nhật SAU khi tính added, và tokens là double không thread-safe.',
    'Ba lỗi cùng lúc: (1) double tokens + plain long lastRefillTime -> race condition: hai thread cùng đọc tokens=200, cùng trừ 1, cùng ghi 199 -> mất 1 token; (2) refill logic sai: lastRefillTime cập nhật sau min() -> thread sau tính elapsed từ thời điểm thread trước đã cập nhật -> refill quá nhiều/quá ít; (3) refill dựa trên "lần gọi gần nhất" chứ không phải thời gian thực -> burst traffic không gọi đều đặn khiến refill lệch.',
    'Sửa: dùng AtomicLong lưu token * 1_000_000 (nano-tokens) tránh double; refill dựa trên wall-clock (now - lastRefillNanos) và CAS loop để cập nhật cả tokens VÀ lastRefillNanos nguyên tử; tryConsume dùng CAS loop trừ 1 token.',
  ],
  rootCause: `**Token bucket implementation có ba lỗi nghiêm trọng khiến rate limiter thất hiệu dưới tải cao:**

  1. **Race condition trên double + plain long:** {{tokens}} là {{double}}, {{lastRefillTime}} là {{long}} không volatile. Hai thread cùng vào {{tryConsume}}: cả hai đọc {{tokens=200.0}}, cả hai gọi {{refill}} (elapsed=0 -> added=0), cả hai {{tokens -= 1.0}} -> cả hai ghi {{199.0}}. **Hai request chỉ tiêu 1 token**. Với 500 request đồng thời, bucket 200 token có thể cho qua gần 500 request.

  2. **Refill logic sai (lastRefillTime cập nhật sau min):** {{refill}} tính {{added}} từ {{now - lastRefillTime}}, sau đó {{tokens = min(max, tokens + added)}}, RỒI mới {{lastRefillTime = now}}. Nếu thread A đang ở giữa refill (đã tính added, chưa cập nhật lastRefillTime), thread B vào sẽ thấy lastRefillTime cũ -> tính elapsed lớn hơn thực tế -> added lớn hơn -> token bị "phình" ảo.

  3. **Refill dựa trên lần gọi chứ không phải wall-clock:** Nếu không có request trong 1 giây, bucket không refill. Khi burst 500 request đến cùng lúc, chỉ request đầu tiên thấy elapsed lớn và refill, các request sau thấy elapsed ≈ 0 (vì lastRefillTime vừa được cập nhật) -> không refill thêm. Kết quả: burst traffic được xử lý bằng **token còn lại tại thời điểm request đầu tiên**, chứ không phải token thực sự khả dụng theo thời gian.

  Kết hợp ba lỗi, rate limiter trở nên **vô hiệu** dưới burst: bucket 200 token cho qua ~500 request trong vài mili giây, khiến backend quá tải và OOM.`,
  fix: `### Cách sửa trong bài
1. **Loại bỏ double và plain long**: dùng {{AtomicLong}} lưu **nano-tokens** (token × 1.000.000) để tránh race trên số thực và có CAS (compare-and-set) nguyên tử.
2. **Refill dựa trên wall-clock**: {{elapsedNanos = nowNanos - lastRefillNanos.get()}} — luôn đo từ thời điểm refill gần nhất thực sự, không phụ thuộc vào thời điểm gọi method.
3. **CAS loop cho cả refill và consume**:
   - {{refill}}: CAS loop cập nhật **cả** {{tokensNano}} **và** {{lastRefillNanos}} cùng lúc (nếu thread khác đã refill giữa chừng thì tính lại).
   - {{tryConsume}}: CAS loop trừ {{1_000_000}} nano-tokens chỉ khi {{current >= 1_000_000}}.

~~~java
// Refill: cập nhật token VÀ lastRefillNanos nguyên tử
while (true) {
    long currentTokens = tokensNano.get();
    long currentLast = lastRefillNanos.get();
    if (currentLast != last) {
        last = currentLast;
        elapsedNanos = nowNanos - last;
        if (elapsedNanos <= 0) return;
        addedNano = (long) (elapsedNanos * refillRatePerSec * 1_000_000.0 / 1_000_000_000.0);
        if (addedNano <= 0) return;
        continue;
    }
    long newTokens = Math.min(maxTokens * 1_000_000L, currentTokens + addedNano);
    long newLast = nowNanos;
    if (tokensNano.compareAndSet(currentTokens, newTokens)
            && lastRefillNanos.compareAndSet(currentLast, newLast)) {
        return;
    }
}

// Consume: chỉ trừ khi còn token
long current, next;
do {
    current = tokensNano.get();
    if (current < 1_000_000) return false;
    next = current - 1_000_000;
} while (!tokensNano.compareAndSet(current, next));
return true;
~~~

### Trên production thật
- **Đừng tự viết rate limiter** cho production. Dùng thư viện đã chứng thực: **Resilience4j RateLimiter**, **Bucket4j**, hoặc **Spring Cloud Gateway built-in RateLimiter filter** (dùng Redis cho phân tán).
- **Rate limiter phân tán (distributed):** nhiều pod Gateway cần chia sẻ trạng thái bucket -> lưu bucket trong Redis (Lua script atomic) hoặc dùng **token bucket trên Redis** ({{INCRBY}}, {{GET}}, {{EXPIRE}} trong một script Lua).
- **Leaky bucket vs Token bucket:** Token bucket cho phép burst (quan trọng cho UX: cho phép 200 request ngay lập tức rồi giới hạn 100/s), leaky bucket làm mượt traffic nhưng chậm phản hồi ban đầu. API Gateway thường dùng token bucket.
- **Key phân biệt:** client duy nhất bằng API key, IP, hoặc user ID. Cẩn thận với IP chung (NAT, corporate proxy) -> dùng API key / JWT claim.
- **Metrics:** xuất {{rate_limiter_allowed_total}}, {{rate_limiter_rejected_total}}, {{rate_limiter_bucket_tokens}} cho Prometheus/Grafana; cảnh báo khi rejected rate > 0.

### So sánh cách hiện thực hóa
| Cách | Thread-safe | Phân tán | Burst support | Ghi chú |
|---|---|---|---|---|
| double + plain long (bài gốc) | **Không** | Không | Có (lý thuyết) | Sai về mặt race |
| AtomicLong nano-tokens + CAS | **Có** | Không | Có | Đúng 1 pod |
| Bucket4j local | **Có** | Không | Có | Sẵn sàng dùng |
| Redis + Lua script token bucket | **Có** | **Có** | Có | Chuẩn production |

### Phòng ngừa
- Test tải: bắn gấp 5–10 lần quota từ nhiều thread, xác minh rejected count = expected.
- Chaos test: kill pod giữa chừng, bucket Redis phải giữ trạng thái.
- Code review: mọi {{double}} / {{long}} dùng chung cho stateful component phải bị chặn (SpotBugs/Sonar).

### Liên hệ phỏng vấn
Khi được hỏi "viết rate limiter token bucket thế nào cho đúng?", nêu: (1) dùng integer (nano-tokens) thay double, (2) refill dựa trên wall-clock (now - lastRefill), (3) CAS loop cho cả refill và consume để tránh race, (4) production dùng Redis + Lua script cho phân tán, (5) metrics rejected/allowed. Thêm: bucket4j/Resilience4j đã làm tốt việc này — đừng tự viết nếu không phải bài tập.

> Senior tip: Rate limiter là "cửa ngõ" bảo vệ hệ thống — nó phải **chắc chắn đúng** dưới mọi tải. Một bug race cho phép 2x traffic là đủ làm sập cả cụm backend. Luôn test đồng thời (CountDownLatch) với traffic gấp 5–10 lần quota, không chỉ test tuần tự.`,
  related: ['api-009', 'microservices-007', 'concurrency-015'],
  tags: ['rate limiter', 'token bucket', 'race condition', 'CAS', 'AtomicLong', 'API Gateway', 'burst']
},
{
  id: 'bug-034',
  title: 'Báo cáo doanh thu sai vì dùng double và làm tròn khi chia phí cho nhiều đối tác',
  domain: 'Ví điện tử / Báo cáo doanh thu',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Hệ thống ví điện tử có tính năng "chia phí dịch vụ" — tổng phí thu từ khách hàng được chia cho các đối tác (ví dụ Shopee, Lazada, Tiki) để đối soát tiền cho mỗi đối tác mỗi ngày. Tiền là VND (số nguyên đồng, không có phần lẻ), nhưng code tính bằng {{double}} và làm tròn từng phần bằng {{Math.round}}.

**Sự cố:** Đối soát cuối tháng báo tổng các phần **không bằng tổng phí**, lệch từ vài đồng đến 2.000 đồng trên từng hóa đơn (ví dụ: 100.000 chia 3 đối tác bị làm tròn xuống thành 33.333 × 3 = 99.999, thiếu 1 đồng; 7 đồng chia 3 người bị làm tròn xuống thành 2 × 3 = 6, thiếu 1 đồng). Trên 180.000 lần chia tiền, sai số tích lũy hơn hai triệu đồng. Một số đối tác bị thu ít, một số bị thu nhiều, báo cáo doanh thu của phòng tài chính sai, kế toán phải điều tra thủ công từng hóa đơn.

**Nhiệm vụ của bạn:** Sửa {{RevenueShareService.split}} để **tổng các phần luôn đúng bằng tổng phí**, và các phần chênh nhau **không quá 1 đồng**.`,
  artifacts: [
    { name: 'revenue-audit.csv', lang: 'text', content: `split_id,total,partners,shares,sum_shares,diff
RV-100231,100000,3,"33334|33333|33333",100000,0
RV-100244,10000,4,"2500|2500|2500|2500",10000,0
RV-100259,250000,6,"41667|41667|41667|41667|41666|41666",250000,0
RV-100260,7,3,"3|2|2",7,0
-- month total diff: -1,184,312 VND (under-collected) / +944,207 VND (over-collected)` },
  ],
  starter: `// ===== Code cần sửa =====
class RevenueShareService {
    /** Chia total (VND, số nguyên đồng) cho n đối tác. Trả về mảng n phần. */
    long[] split(long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        double share = (double) total / n;   // BUG: double sai số + làm tròn từng phần độc lập
        long[] shares = new long[n];
        for (int i = 0; i < n; i++) {
            shares[i] = Math.round(share);
        }
        return shares;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long sum(long[] xs) { long s = 0; for (long x : xs) s += x; return s; }
    static long spread(long[] xs) { long max = xs[0], min = xs[0]; for (long x : xs) { if (x > max) max = x; if (x < min) min = x; } return max - min; }

    public static void main(String[] args) {
        RevenueShareService s = new RevenueShareService();
        long[][] cases = { {100_000, 3}, {10_000, 4}, {250_000, 6}, {7, 3}, {1_000_000_007L, 10} };
        for (long[] c : cases) {
            long[] r = s.split(c[0], (int) c[1]);
            boolean ok = r.length == c[1] && sum(r) == c[0] && spread(r) <= 1;
            check("chia_" + c[0] + "_cho_" + c[1], ok, "các phần " + java.util.Arrays.toString(r) + " có tổng " + sum(r) + " (kỳ vọng " + c[0] + ", chênh tối đa 1 đồng)");
        }
        long[] one = s.split(55_555, 1);
        check("mot_nguoi", one.length == 1 && one[0] == 55_555, "một đối tác phải nhận đủ, thực tế " + java.util.Arrays.toString(one));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class RevenueShareService {
    long[] split(long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        long base = total / n;          // phần nguyên chia đều (số học nguyên, không qua double)
        long remainder = total % n;     // số đồng còn dư, luôn < n
        long[] shares = new long[n];
        for (int i = 0; i < n; i++) {
            shares[i] = base + (i < remainder ? 1 : 0);   // phân phát từng đồng dư cho các đối tác đầu (largest remainder)
        }
        return shares;                  // tổng = base*n + remainder = total
    }
}`,
  hints: [
    'Làm tròn từng phần một cách độc lập thì sai số cộng dồn lại: 3 * 33.333 = 99.999.',
    'Dùng số học nguyên: total / n cho phần chung, total % n cho số đồng còn dư.',
    'Phát từng đồng dư cho vài đối tác đầu (mỗi người thêm 1 đồng). Tổng sẽ luôn đúng và chênh lệch tối đa 1 đồng.',
  ],
  rootCause: `**Làm tròn từng phần một cách độc lập** (và còn qua {{double}}). Khi chia không hết, mỗi phần bị làm tròn lên hoặc xuống cùng một hướng, sai số nhân lên theo số người: 100.000/3 → 33.333 × 3 = 99.999 (thiếu 1 đồng); 7/3 → 2 × 3 = 6 (thiếu 1 đồng). Mỗi phần sai 0,33–0,66 đồng, nhưng nhân theo hàng trăm nghìn dòng thì thiếu một triệu đồng trở lên. Với số rất lớn, {{double}} còn mất chính xác (chỉ khoảng 15–16 chữ số có nghĩa). Nguyên tắc vi phạm: **tổng các phần phải bằng tổng gốc** — một ràng buộc nghiệp vụ mà code không hề kiểm tra.`,
  fix: `### Cách sửa
Dùng **số học nguyên**: phần chung {{total / n}}, số dư {{total % n}} được phát thêm 1 đồng cho {{remainder}} đối tác đầu. Tổng luôn đúng, chênh lệch tối đa 1 đồng, không có {{double}} nào.

### Với tiền có phần thập phân (USD, EUR)
Đổi về **đơn vị nhỏ nhất** (cent) dạng {{long}}, chia như trên, rồi đổi lại; hoặc dùng {{BigDecimal}} với {{divide(n, 2, RoundingMode.DOWN)}} cho n−1 phần đầu và **phần cuối = tổng − tổng các phần trước**.
~~~java
BigDecimal part = total.divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
BigDecimal last = total.subtract(part.multiply(BigDecimal.valueOf(n - 1)));   // gánh phần lẻ
~~~

### Phòng ngừa
- Viết **property test**: với mọi total và n ngẫu nhiên, tổng các phần == total (jqwik hoặc vòng lặp ngẫu nhiên).
- Assert bất biến ngay trong code nghiệp vụ trước khi lưu: tổng phải khớp, nếu không thì từ chối.
- Không bao giờ dùng {{float}}/{{double}} cho tiền.

### Liên hệ phỏng vấn
Câu "chia 100 nghìn cho 3 người thế nào" kiểm tra bạn có nghĩ tới **bảo toàn tổng** (allocation) chứ không chỉ "làm tròn". Nêu được cách phân phát phần dư và lý do không dùng double là điểm cộng rõ.`,
  related: ['core-012'],
  tags: ['money', 'rounding', 'BigDecimal', 'allocation', 'revenue']
},
{
  id: 'bug-035',
  title: 'Tính đơn giá hóa đơn: BigDecimal.divide thiếu làm tròn ném ArithmeticException',
  domain: 'Thương mại điện tử / Hóa đơn',
  level: 'mid',
  severity: 'P2',
  minutes: 20,
  story: `**Bối cảnh dự án:** Hệ thống hóa đơn tính **đơn giá** và **giá trị giao dịch trung bình** cho báo cáo. Code dùng {{BigDecimal}} (đúng tiền, không dùng {{double}}) nhưng gọi {{divide(divisor)}} **không truyền scale và {{RoundingMode}}}**. Khi tổng tiền không chia hết cho số lượng (ví dụ 100.000 đồng chia cho 3 sản phẩm), Java ném {{ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result}}.

**Sự cố:** Khách đặt đơn 3 sản phẩm tổng 100.000 đồng. Service tính đơn giá = 100.000 / 3 → ném exception, đơn không thể checkout. Ở thời gian cao điểm, hàng chục đơn bị từ chối oan vì số tiền không chia hết. Log in lỗi ArithmeticException và hệ thống trả 500 cho khách.

**Nhiệm vụ của bạn:** Sửa {{InvoiceService.unitPrice}} và {{average}} để chia luôn kèm scale (2 chữ số thập phân) và {{RoundingMode.HALF_UP}}, không bao giờ ném exception vì số lẻ.`,
  artifacts: [
    { name: 'invoice-service.log', lang: 'text', content: `2026-11-20 09:12:44.118 ERROR InvoiceService : unitPrice failed order=ORD-99213
java.lang.ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result.
    at com.shop.invoice.InvoiceService.unitPrice(InvoiceService.java:24)
2026-11-20 09:12:44.355 ERROR InvoiceService : average failed report=DAILY
java.lang.ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result.
    at com.shop.invoice.InvoiceService.average(InvoiceService.java:38)` },
  ],
  starter: `// ===== Code cần sửa =====
import java.math.BigDecimal;

class InvoiceService {
    /** Đơn giá = tổng tiền / số lượng, làm tròn 2 chữ số thập phân. */
    BigDecimal unitPrice(BigDecimal total, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("số lượng phải > 0");
        return total.divide(BigDecimal.valueOf(quantity));   // BUG: thiếu scale + RoundingMode
    }

    /** Giá trị giao dịch trung bình = tổng / số giao dịch. */
    BigDecimal average(BigDecimal total, int count) {
        if (count <= 0) throw new IllegalArgumentException("số giao dịch phải > 0");
        return total.divide(BigDecimal.valueOf(count));   // BUG: thiếu scale + RoundingMode
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        InvoiceService s = new InvoiceService();

        // 1. Chia hết: không exception, kết quả đúng
        boolean ok1 = true; String d1 = "";
        try {
            java.math.BigDecimal r1 = s.unitPrice(new java.math.BigDecimal("100.00"), 2);
            if (!"50.00".equals(r1.toPlainString())) { ok1 = false; d1 = "kỳ vọng 50.00, thực tế " + r1; }
        } catch (Throwable t) { ok1 = false; d1 = "ném " + t.getClass().getSimpleName(); }
        check("chia_het", ok1, d1);

        // 2. Không chia hết: không được ném ArithmeticException
        boolean ok2 = true; String d2 = "";
        try {
            s.unitPrice(new java.math.BigDecimal("100.00"), 3);
        } catch (ArithmeticException e) { ok2 = false; d2 = "ném ArithmeticException khi không chia hết"; }
        check("khong_chia_het_khong_nem_loi", ok2, d2);

        // 3. Số lẻ khác 0: 10.00 / 3 làm tròn HALF_UP -> 3.33
        boolean ok3 = true; String d3 = "";
        try {
            java.math.BigDecimal r3 = s.unitPrice(new java.math.BigDecimal("10.00"), 3);
            if (!"3.33".equals(r3.toPlainString())) { ok3 = false; d3 = "kỳ vọng 3.33, thực tế " + r3; }
        } catch (Throwable t) { ok3 = false; d3 = "ném " + t.getClass().getSimpleName(); }
        check("lam_tron_3_33", ok3, d3);

        // 4. Trung bình 1000 / 3 = 333.33
        boolean ok4 = true; String d4 = "";
        try {
            java.math.BigDecimal r4 = s.average(new java.math.BigDecimal("1000"), 3);
            if (!"333.33".equals(r4.toPlainString())) { ok4 = false; d4 = "kỳ vọng 333.33, thực tế " + r4; }
        } catch (Throwable t) { ok4 = false; d4 = "ném " + t.getClass().getSimpleName(); }
        check("trung_binh_333_33", ok4, d4);

        // 5. Số lượng <= 0 vẫn ném IllegalArgumentException
        boolean ok5 = true; String d5 = "";
        try {
            s.unitPrice(new java.math.BigDecimal("100"), 0);
            ok5 = false; d5 = "không ném IllegalArgumentException khi quantity <= 0";
        } catch (IllegalArgumentException e) { /* đúng */ }
        check("so_luong_duong", ok5, d5);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `import java.math.BigDecimal;
import java.math.RoundingMode;

class InvoiceService {
    private static final int MONEY_SCALE = 2;

    BigDecimal unitPrice(BigDecimal total, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("số lượng phải > 0");
        return total.divide(BigDecimal.valueOf(quantity), MONEY_SCALE, RoundingMode.HALF_UP);
    }

    BigDecimal average(BigDecimal total, int count) {
        if (count <= 0) throw new IllegalArgumentException("số giao dịch phải > 0");
        return total.divide(BigDecimal.valueOf(count), MONEY_SCALE, RoundingMode.HALF_UP);
    }
}`,
  hints: [
    '{{BigDecimal.divide(divisor)}} không có scale: nếu kết quả có phần thập phân vô hạn (100/3) Java ném {{ArithmeticException}}.',
    'Luôn chia tiền với scale và làm tròn: {{divide(divisor, scale, RoundingMode)}}.',
    'Tiền tệ thường dùng {{RoundingMode.HALF_UP}} (làm tròn theo thường quy), không dùng {{HALF_EVEN}} trừ khi có yêu cầu.',
  ],
  rootCause: `**Gọi {{BigDecimal.divide(divisor)}} không truyền scale và làm tròn.** Phép chia này yêu cầu kết quả **chính xác tuyệt đối**; nếu phần thập phân vô hạn (ví dụ 100.00 / 3 = 33.333...) Java ném {{ArithmeticException}} thay vì làm tròn im lặng. Đây là thiết kế ý định của {{BigDecimal}}: buộc lập trình viên quyết định sai số cho phép, không cho phép sai số nhị phân trôi.

**Sai số đôi khi ẩn:** 100.00 / 2 = 50.00 chia hết nên không exception, nhưng 100.00 / 3 lại lỗi — vậy nên lỗi chỉ lộ lúc có đơn hàng số lượng lẻ, đúng như sự cố "hàng chục đơn bị từ chối oan".`,
  fix: `### Cách sửa
Luôn gọi {{divide(divisor, scale, RoundingMode)}} với scale phù hợp (2 chữ số thập phân cho tiền tệ) và {{RoundingMode.HALF_UP}} (quy ước làm tròn tiền phổ biến).
~~~java
return total.divide(BigDecimal.valueOf(quantity), 2, RoundingMode.HALF_UP);
~~~

### Lưu ý làm tròn
- {{RoundingMode.HALF_UP}}: 33.335 → 33.34 (làm tròn lên nếu phần lẻ ≥ 0.5). Phù hợp nghiệp vụ tiền tệ phổ biến.
- {{RoundingMode.HALF_EVEN}} (banker's rounding): 33.335 → 33.34, 33.325 → 33.32 (làm tròn về số chẵn), dùng khi cần giảm sai số tích lũy trên rất nhiều giao dịch.
- Không bao giờ tạo {{BigDecimal}} từ {{double}} ({{new BigDecimal(0.1)}} mang sai số nhị phân); dùng constructor chuỗi {{new BigDecimal("0.1")}} hoặc {{BigDecimal.valueOf}}.

### Phòng ngừa
- Quy tắc review: mọi {{BigDecimal.divide}} phải có scale + {{RoundingMode}}.
- Test với số không chia hết (1/3, 10/3, 1000/3) trong CI.
- Luôn quy ước scale cố định theo loại tiền (USD/EUR = 2, VND = 0).

### Liên hệ phỏng vấn
"Vì sao {{BigDecimal.divide}} đôi khi ném {{ArithmeticException}}" là câu hỏi Java core phổ biến. Trả lời: divide không tham số yêu cầu kết quả kết thúc (terminating decimal), phần thập phân vô hạn ném exception; sửa bằng divide(divisor, scale, RoundingMode); kèm lưu ý không tạo BigDecimal từ double.`,
  related: ['core-021'],
  tags: ['BigDecimal', 'divide', 'ArithmeticException', 'RoundingMode', 'money']
},
{
  id: 'bug-036',
  title: 'Ví điện tử: khách hàng bị trừ tiền hai lần khi mạng yếu',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh:** API {{/withdraw}} nhận request rút tiền có {{requestId}} duy nhất. Cổng thanh toán đôi khi chậm, app thấy timeout thì tự động retry request đó.\n\n**Sự cố:** Webhook của cổng thanh toán báo "timeout", app retry, service xử lý lần 2, trừ tiền lần 2 dù request là MỘT. Đối soát thấy ví bị trừ 2 lần.`,
  artifacts: [
    { name: 'wallet-service.log', lang: 'text', content: `2026-11-05 10:00:00.100 INFO WithdrawService : debit acc=W-1 req=REQ-001 amount=100000
2026-11-05 10:00:05.100 WARN WithdrawService : gateway timeout req=REQ-001
2026-11-05 10:00:05.200 INFO WithdrawService : debit acc=W-1 req=REQ-001 amount=100000 (retry)
2026-11-05 10:00:05.300 INFO Ledger : credited acc=W-1 amount=100000 ref=TX-1
2026-11-05 10:00:05.400 INFO Ledger : credited acc=W-1 amount=100000 ref=TX-2` }
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
interface Ledger {
    void credit(String acc, long amount);
}

// ===== Code cần sửa =====
class WalletService {
    private final Ledger ledger;
    WalletService(Ledger ledger) { this.ledger = ledger; }
    
    // Rút tiền: chưa idempotent, cộng/trừ tiền không kiểm tra requestId
    void withdraw(String acc, String reqId, long amount) {
        ledger.credit(acc, amount);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    
    static class FakeLedger implements Ledger {
        long total = 0;
        int credits = 0;
        public void credit(String acc, long amount) {
            total += amount;
            credits++;
        }
    }
    
    public static void main(String[] args) {
        // 1. Same requestId retry: only one transaction
        FakeLedger l1 = new FakeLedger();
        WalletService s1 = new WalletService(l1);
        s1.withdraw("W1", "REQ1", 100);
        s1.withdraw("W1", "REQ1", 100); // retry
        check("khong_trung_lap", l1.credits == 1, "kỳ vọng chỉ 1 lần trừ tiền, thực tế " + l1.credits);

        // 2. Different requestIds: each creates a transaction
        FakeLedger l2 = new FakeLedger();
        WalletService s2 = new WalletService(l2);
        s2.withdraw("W1", "REQ-A", 50);
        s2.withdraw("W1", "REQ-B", 50);
        check("khac_requestid_tao_rieng", l2.credits == 2 && l2.total == 100,
            "hai requestId khác nhau phải tạo 2 giao dịch, thực tế credits=" + l2.credits + " total=" + l2.total);

        // 3. Concurrent same requestId: only one succeeds
        FakeLedger l3 = new FakeLedger();
        WalletService s3 = new WalletService(l3);
        ExecutorService pool = Executors.newFixedThreadPool(10);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            futures.add(pool.submit(() -> { try { start.await(); } catch (InterruptedException e) {} s3.withdraw("W1", "REQ-CONCURRENT", 100); }));
        }
        start.countDown();
        for (Future<?> f : futures) try { f.get(5, TimeUnit.SECONDS); } catch (Exception e) {}
        pool.shutdownNow();
        check("dong_thoi_cung_requestid", l3.credits == 1 && l3.total == 100,
            "10 luồng cùng requestId chỉ được 1 giao dịch, thực tế credits=" + l3.credits + " total=" + l3.total);

        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
reference: `interface Ledger {
    void credit(String acc, long amount);
  }
  
  class WalletService {
    private final Ledger ledger;
    private final Set<String> processed = ConcurrentHashMap.newKeySet();
    WalletService(Ledger ledger) { this.ledger = ledger; }
    
    synchronized void withdraw(String acc, String reqId, long amount) {
        if (processed.contains(reqId)) return;
        ledger.credit(acc, amount);
        processed.add(reqId);
    }
  }`,
  hints: ['App retry cùng request, service nên kiểm tra đã xử lý requestId chưa.', 'Dùng Set để lưu các requestId đã xử lý thành công và cần đảm bảo thread-safe.', 'Transaction phải đảm bảo cả việc trừ tiền và đánh dấu requestId.'],
  rootCause: `**Thiếu tính idempotent (tính bình đẳng).** Service không kiểm tra xem requestId đã được xử lý chưa trước khi thực hiện giao dịch, dẫn đến việc xử lý nhiều lần cho cùng một request. Khi network timeout, client retry request với requestId cũ, và server thực hiện giao dịch lại lần nữa.`,
  fix: `### Cách sửa trong bài
Sử dụng một bảng (trong DB hoặc Redis) lưu các requestId đã xử lý. Trước khi xử lý, kiểm tra requestId; nếu đã xử lý, trả về kết quả cũ. Sử dụng transaction để ghi requestId và kết quả cùng lúc. Trong bài tập này, dùng Set an toàn luồng (ConcurrentHashMap.newKeySet()) để lưu requestId đã xử lý thành công. Trước khi gọi ledger.credit, kiểm tra requestId trong Set; nếu đã có thì return; nếu chưa có thì thực hiện credit, sau đó thêm vào Set.

### Trên production thật
- Sử dụng {{unique constraint}} trên bảng {{ledger}} (cho {{requestId}}) trong cùng transaction với việc trừ tiền. Đây là cách an toàn nhất: nếu DB từ chối insert requestId vì đã tồn tại, tức là request đã được xử lý.
- Sử dụng {{idempotency key}} do client gửi (chọn key theo ý định hành động, không phải theo transaction). Key này phải tồn tại đủ lâu (ví dụ 7 ngày) để phủ các retry trễ của client.

### Phòng ngừa
- Mọi API có side-effect (trừ tiền, cộng tiền) phải idempotent.
- Test retry với cùng requestId phải ra kết quả duy nhất (kiểm tra bằng test harness).
- Luôn kiểm tra đối soát số dư với nhật ký giao dịch hằng ngày để phát hiện sớm các giao dịch bị lặp.
- Thiết kế hệ thống: server phải trả lại kết quả cũ cho các yêu cầu retry với cùng key, không chỉ báo lỗi.

### Liên hệ phỏng vấn
- Idempotency là gì? Tại sao quan trọng trong distributed systems (at-least-once)? Cách triển khai? Đảm bảo tính nguyên tử (atomic) giữa kiểm tra và xử lý bằng transaction hoặc khoá DB. Hãy nêu rõ sự khác biệt giữa idempotency key (do client sinh) và transaction ID (do server sinh). Cần lưu ý việc dọn dẹp các key cũ nếu lượng request quá lớn.`,
  related: [],
  tags: ['idempotency', 'retry', 'fintech']
},
{
  id: 'bug-037',
  title: 'Cache stampede: sản phẩm mới ra mắt làm sập DB',
  domain: 'Thương mại điện tử / Tìm kiếm',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh:** Sản phẩm hot ra mắt, hàng nghìn người cùng tìm kiếm. Service cache sản phẩm trong {{ConcurrentHashMap}} với TTL 10 giây để giảm tải cho DB.
  
  **Sự cố:** Khi cache hết hạn, 1000 requests cùng miss, cùng gọi DB (câu query phức tạp, tốn 200ms). DB CPU lên 100%, request timeout, service lỗi 503 cho toàn bộ user. Các pod khác cũng nhận thấy DB chậm và bắt đầu timeout, gây ra hiệu ứng domino sập cả hệ thống trong vài phút. Log cho thấy cùng một câu query được gửi tới DB 1000 lần trong cùng một millisecond.`,
  artifacts: [
    { name: 'search-service.log', lang: 'text', content: `2026-11-05 10:00:00.100 INFO SearchService : search miss pair=PRODUCT-1 (cache empty)
2026-11-05 10:00:00.105 INFO SearchService : search miss pair=PRODUCT-1 (cache empty)
... 1000 requests to DB at same time ...
2026-11-05 10:00:00.600 ERROR DB : query too slow, timeout occurred` }
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class FakeDb {
    int calls = 0;
    String query(String q) {
        calls++;
        try { Thread.sleep(50); } catch (InterruptedException e) {}
        return "res";
    }
}

// ===== Code cần sửa =====
class SearchService {
    private final FakeDb db;
    Map<String, String> cache = new HashMap<>();
    SearchService(FakeDb db) { this.db = db; }
    String search(String q) {
        if (cache.containsKey(q)) return cache.get(q);
        String res = db.query(q);
        cache.put(q, res);
        return res;
    }
}`,
tests: `class FakeDb {
    int calls = 0;
    String query(String q) {
        calls++;
        try { Thread.sleep(50); } catch (InterruptedException e) {}
        return "res";
    }
  }
  
  public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    
    public static void main(String[] args) throws Exception {
        // 1. Same query concurrent: only one DB call
        FakeDb db1 = new FakeDb();
        SearchService s1 = new SearchService(db1);
        ExecutorService pool1 = Executors.newFixedThreadPool(10);
        List<Future<String>> futures1 = new ArrayList<>();
        for (int i=0; i<10; i++) futures1.add(pool1.submit(() -> s1.search("q1")));
        for (Future<String> f : futures1) f.get();
        pool1.shutdownNow();
        check("goi_db_mot_lan", db1.calls == 1, "kỳ vọng chỉ gọi DB 1 lần, thực tế " + db1.calls);

        // 2. Different queries: each calls DB once
        FakeDb db2 = new FakeDb();
        SearchService s2 = new SearchService(db2);
        ExecutorService pool2 = Executors.newFixedThreadPool(10);
        List<Future<String>> futures2 = new ArrayList<>();
        for (int i=0; i<5; i++) {
            final String q = "q" + i;
            futures2.add(pool2.submit(() -> s2.search(q)));
            futures2.add(pool2.submit(() -> s2.search(q))); // second call same query
        }
        for (Future<String> f : futures2) f.get();
        pool2.shutdownNow();
        check("nhieu_query_rieng_biet", db2.calls == 5, "5 query khác nhau mỗi cái gọi DB 1 lần, thực tế " + db2.calls);

        // 3. Concurrent different queries
        FakeDb db3 = new FakeDb();
        SearchService s3 = new SearchService(db3);
        ExecutorService pool3 = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<String>> futures3 = new ArrayList<>();
        for (int i=0; i<20; i++) {
            final String q = "concurrent-q" + (i % 4); // 4 distinct queries
            futures3.add(pool3.submit(() -> { try { start.await(); } catch (InterruptedException e) {} return s3.search(q); }));
        }
        start.countDown();
        for (Future<String> f : futures3) f.get(5, TimeUnit.SECONDS);
        pool3.shutdownNow();
        check("dong_thoi_nhieu_query", db3.calls == 4, "4 query khác nhau đồng thời mỗi cái gọi DB 1 lần, thực tế " + db3.calls);

        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
  }`,
reference: `class FakeDb {
    int calls = 0;
    String query(String q) {
        calls++;
        try { Thread.sleep(50); } catch (InterruptedException e) {}
        return "res";
    }
  }
  
  class SearchService {
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();
    private final FakeDb db;
    SearchService(FakeDb db) { this.db = db; }
    
    String search(String q) {
        return cache.computeIfAbsent(q, db::query);
    }
  }`,
  hints: ['Đọc log: 1000 request cùng miss. Vì sao cùng một query lại được gọi tới DB nhiều lần?', 'Kiểm tra (containsKey) và Ghi (put) không nguyên tử. Cần dùng computeIfAbsent.', 'Thao tác "kiểm tra + gọi DB + ghi cache" phải được gói gọn thành một bước nguyên tử (atomic) theo từng key.'],
  rootCause: `**Cache stampede (giẫm đạp cache).** Khi cache trống, nhiều request cùng miss, cùng kiểm tra (containsKey), thấy chưa có, rồi **tất cả** cùng gọi DB (câu query phức tạp, tốn thời gian). Kết quả là DB quá tải, và tất cả request này đều cố gắng ghi kết quả vào cache, gây lãng phí tài nguyên và làm treo hệ thống. Bản chất là race condition kiểu "check-then-act" không nguyên tử.`,
  fix: `### Cách sửa trong bài
Sử dụng {{ConcurrentHashMap.computeIfAbsent(key, mappingFunction)}}. MappingFunction (ở đây là {{db::query}}) chỉ được chạy một lần cho mỗi key. Các request khác đến cùng lúc sẽ chờ và nhận kết quả của lần gọi duy nhất đó.

### Trên production thật
- Sử dụng thư viện cache như Caffeine để hỗ trợ tốt hơn (TTL, giới hạn kích thước, hit ratio). Caffeine dùng thuật toán W-TinyLFU, hit ratio thường tốt hơn LRU thuần, và an toàn đa luồng mà không cần {{synchronized}} toàn cục.
- Nếu cache là distributed (Redis), dùng **distributed lock** (SETNX) hoặc single-flight (chỉ cho phép 1 request đi qua, các request khác chờ hoặc nhận ngay giá trị cũ/đợi).
- Đặt TTL và cơ chế làm mới nền để dữ liệu không bị cũ; log/metric số lần gọi provider và tỉ lệ cache hit để phát hiện bất thường.

### Phòng ngừa
- Test đồng thời (load test) với nhiều request miss cache cùng lúc.
- Luôn giới hạn thời gian gọi DB/API ngoài (timeout).

### Liên hệ phỏng vấn
- Cache stampede là gì? Cách sửa bằng single-flight? (Sử dụng computeIfAbsent hoặc mutex khóa theo key). Trả lời nên nêu: (1) check-then-act không nguyên tử, (2) {{computeIfAbsent}}/khoá theo key để chỉ một luồng nạp, (3) khác biệt cache trong tiến trình vs cache phân tán, (4) xử lý lỗi và TTL. Nhấn mạnh: an toàn luồng (thread-safe) không chỉ là "dùng ConcurrentHashMap" mà là làm trọn vẹn cả thao tác gộp.`,
  related: [],
  tags: ['cache stampede', 'concurrency', 'single-flight']
},
{
  id: 'bug-038',
  title: 'Lệnh mua cùng lúc khiến số dư tài khoản âm',
  domain: 'Sàn giao dịch / Trading',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh:** Sàn giao dịch cổ phiếu cho phép user đặt lệnh mua qua API. Mỗi tài khoản có số dư trong bảng {{accounts}}. Trước khi trừ tiền, hệ thống kiểm tra xem số dư đủ chưa (check-then-act).

**Sự cố:** Hai lệnh mua cùng mã cổ phiếu, cùng số tiền 60, gửi cùng lúc cho cùng một tài khoản có số dư 100. Cả hai lệnh đều qua kiểm tra số dư (100 >= 60), rồi cả hai đều trừ tiền. Kết quả số dư xuống -20, sàn đã cho mua quá khả năng tài chính. Log ghi nhận cả hai luồng đọc số dư là 100 ở cùng một millisecond, sau đó cả hai cùng ghi số dư mới.`,
  artifacts: [
    { name: 'trade-engine.log', lang: 'text', content: '2026-11-10 14:30:01.001 [pool-1-thread-1] INFO TradingEngine : ACCOUNT-1 check balance=100 amount=60 OK\n2026-11-10 14:30:01.001 [pool-1-thread-2] INFO TradingEngine : ACCOUNT-1 check balance=100 amount=60 OK\n2026-11-10 14:30:01.002 [pool-1-thread-1] INFO TradingEngine : ACCOUNT-1 deduct 60 new_balance=40\n2026-11-10 14:30:01.002 [pool-1-thread-2] INFO TradingEngine : ACCOUNT-1 deduct 60 new_balance=-20' },
    { name: 'account-state.json', lang: 'json', content: '{\n  "accountId": "ACCOUNT-1",\n  "initialBalance": 100,\n  "orders": [\n    { "orderId": "ORD-101", "symbol": "AAPL", "amount": 60, "status": "FILLED" },\n    { "orderId": "ORD-102", "symbol": "AAPL", "amount": 60, "status": "FILLED" }\n  ],\n  "finalBalance": -20\n}' }
  ],
  starter: `class TradingAccount {
    private final String id;
    private long balance;
    
    TradingAccount(String id, long balance) {
        this.id = id;
        this.balance = balance;
    }
    
    boolean buy(String symbol, long amount) {
        if (balance >= amount) {
            simulateDelay();
            balance -= amount;
            return true;
        }
        return false;
    }
    
    private void simulateDelay() {
        try { Thread.sleep(1); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    
    long getBalance() { return balance; }
    String getId() { return id; }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    
    public static void main(String[] args) throws Exception {
        TradingAccount acc = new TradingAccount("ACCOUNT-1", 100);
        
        CountDownLatch gate = new CountDownLatch(2);
        boolean[] results = new boolean[2];
        Thread t1 = new Thread(() -> {
            gate.countDown();
            try { gate.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            results[0] = acc.buy("AAPL", 60);
        });
        Thread t2 = new Thread(() -> {
            gate.countDown();
            try { gate.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            results[1] = acc.buy("AAPL", 60);
        });
        t1.start(); t2.start();
        t1.join(5000); t2.join(5000);
        
        check("hai_lenh_mua_cung_luc", !results[0] || !results[1], "chi duoc mot lenh mua thanh cong, ket qua t1=" + results[0] + " t2=" + results[1]);
        check("so_du_khong_am", acc.getBalance() >= 0, "so du khong duoc am, thuc te " + acc.getBalance());
        
        TradingAccount acc2 = new TradingAccount("ACCOUNT-2", 100);
        check("mua_don_le_du_tien", acc2.buy("GOOG", 50), "lenh mua don le phai thanh cong");
        check("so_du_sau_mua_don_le", acc2.getBalance() == 50, "so du phai la 50, thuc te " + acc2.getBalance());
        
        TradingAccount acc3 = new TradingAccount("ACCOUNT-3", 30);
        check("mua_du_50_voi_so_du_30", !acc3.buy("TSLA", 50), "lenh mua vuot so du phai that bai");
        check("so_du_khong_thay_doi_khi_that_bai", acc3.getBalance() == 30, "so du khong thay doi khi mua that bai, thuc te " + acc3.getBalance());
        
        System.out.println("RESULT " + passed + "/" + total);
        System.exit(0);
    }
}`,
  reference: `class TradingAccount {
    private final String id;
    private long balance;
    
    TradingAccount(String id, long balance) {
        this.id = id;
        this.balance = balance;
    }
    
    synchronized boolean buy(String symbol, long amount) {
        if (balance >= amount) {
            simulateDelay();
            balance -= amount;
            return true;
        }
        return false;
    }
    
    private void simulateDelay() {
        try { Thread.sleep(1); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    
    long getBalance() { return balance; }
    String getId() { return id; }
}`,
  hints: [
    'Hai luong cung goi {{buy()}}, ca hai doc so du la 100 truoc khi bat ky luong nao tru tien. Kiem tra va tru tien khong nguyen tu.',
    'Dung {{synchronized}} tren phuong thuc {{buy()}} de chi mot luong duoc thuc hien toan bo thao tac kiem tra + tru tien moi lan.',
    'Hoac dung khoa rieng cho moi tai khoan (per-account lock) de tranh chan toan bo tai khoan khi giao dich ma khac nhau.'
  ],
  rootCause: `**Race condition kieu check-then-act.** Phuong thuc {{buy()}} kiem tra {{balance >= amount}} sau do moi tru {{balance -= amount}}. Hai luong cung goi voi so du 100, moi lenh 60: luong A doc 100 >= 60 (dung), luong B cung doc 100 >= 60 (dung) truoc khi A tru xong. Ca hai cung tru 60 -> so du -20. Ban chat la thao tac "doc so du + ghi so du moi" khong du bao bo boi khoa, nen hai luong cung di qua ngưỡng kiem tra.`,
  fix: `### Cach sua trong bai
Them tu khoa {{synchronized}} len phuong thuc {{buy()}}. Khi phuong thuc duoc danh dau synchronized, chi mot luong co the thuc hien phuong thuc do tren doi tuong {{TradingAccount}} tai mot thoi diem. Luong A kiem tra so du va tru tien hoan toan truoc khi luong B duoc phep vao. Ket qua: chi mot lenh mua 60 duoc chap nhan, so du con 40.

### Tren production thuc
- San giao dich thuc dung khoa theo tai khoan (per-account lock) hoac khoa phan bo (Redis RedLock, database row-level SELECT ... FOR UPDATE) thay vi synchronized toan bo doi tuong, de giao dich cac ma khac nhau khong bi chan lan nhau.
- Giao dich phai chay trong database transaction voi isolation level READ COMMITTED tro len, dung {{SELECT ... FOR UPDATE}} de khoa dong tai khoan khi kiem tra so du.
- Cong them kiem tra dieu kien business o capa validation (vi du: so du con lai >= 0 sau khi tru) va event sourcing de khoi phuc trang thai khi xay ra loi.
- Giams sat metric: so lenh bi tu choi do so du khong du, ty le lenh trung khop, thoi gian cho khoa.

### Phong ngua
- Viet test dong thoi (concurrency test) voi CountDownLatch de phat hien race condition som.
- Code review tap trung vao cac thao tac check-then-act tren trang thai chia se.
- Su dung cac lop khong thay doi (immutable) hoac cau truc du lieu an toan luong (ConcurrentHashMap, AtomicLong) khi thich hop.

### Lien he phong vien
- Race condition la gi? Vi du check-then-act tren so du tai khoan. Cach sua: synchronized, lock theo tai khoan, database transaction voi SELECT FOR UPDATE. Tra loi phai neu: (1) van de la khong nguyen tu, (2) synchronized/lock lam tron vien thao tac, (3) per-account lock vs global lock, (4) database isolation level va row-level lock.`,
  related: ['concurrency-001'],
  tags: ['race condition', 'check-then-act', 'concurrency', 'trading']
},
{
  id: 'bug-039',
  title: 'Chia hoá đơn kèm phí: mỗi ngày đối soát lệch vài đồng',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ví điện tử có tính năng **chia hoá đơn nhóm**: một người chụp hoá đơn, chọn các thành viên, mỗi thành viên bị trừ số tiền **tỉ lệ với phần mình đã gọi**, cộng thêm **phí dịch vụ** (ví dụ 5% tổng hoá đơn). Tiền là VND nguyên, lưu dạng {{long}}; không có đơn vị nhỏ hơn đồng.

Mỗi đêm một job **đối soát** (reconciliation — so sánh sổ nội bộ với số tiền thực sự đã trừ khách) kiểm tra bất biến: *tổng tiền đã trừ các thành viên phải bằng hoá đơn + phí*.

**Sự cố:** 87 ngày gần nhất job đối soát báo lệch **41.206 trên 512.000 lần chia** (khoảng 8%), nhưng tổng chênh chỉ **61.842 đồng** nên cảnh báo theo từng lần chia (ngưỡng 1.000 đồng) không hề kêu. Kế toán không đóng được sổ. Ví dụ khách phàn nàn: hoá đơn 100.000đ chia đều 3 người, app trừ mỗi người 33.333đ, tổng chỉ 99.999đ — ví **thu thiếu 1 đồng**; hoá đơn 200đ chia 3 thì ví lại **thu thừa 1 đồng**.

**Nhiệm vụ của bạn:**
1. Đọc {{BillSplitter.split}} và log/file mẫu, tìm vì sao tổng các phần không bằng tổng hoá đơn.
2. Sửa để **tổng luôn đúng bằng hoá đơn + phí**, và khi chia đều thì các phần chênh nhau tối đa 1 đồng.
3. Bấm **Chạy test**: test tái hiện đúng ca 100.000đ và ca có phí.`,
  artifacts: [
    { name: 'bill-splitter.log', lang: 'text', content: `2026-11-12 22:41:07.114 INFO  [split-worker-3] BillSplitter splitId=SP-8842103 bill=100000 fee=0 weights=[1, 1, 1] shares=[33333, 33333, 33333] total=99999 expected=100000 diff=-1
2026-11-12 22:41:09.902 INFO  [split-worker-1] BillSplitter splitId=SP-8842104 bill=250000 fee=12500 weights=[7, 2, 2] shares=[167045, 47727, 47727] total=262499 expected=262500 diff=-1
2026-11-12 22:41:11.338 INFO  [split-worker-3] BillSplitter splitId=SP-8842105 bill=200 fee=0 weights=[1, 1, 1] shares=[67, 67, 67] total=201 expected=200 diff=+1
2026-11-12 22:41:15.007 INFO  [split-worker-2] BillSplitter splitId=SP-8842106 bill=10000 fee=1 weights=[1, 1, 1, 1] shares=[2500, 2500, 2500, 2500] total=10000 expected=10001 diff=-1
2026-11-12 22:41:18.551 INFO  [split-worker-4] BillSplitter splitId=SP-8842107 bill=90000 fee=9000 weights=[5, 3, 1] shares=[55000, 33000, 11000] total=99000 expected=99000 diff=0
2026-11-12 22:41:18.552 DEBUG [split-worker-4] BillSplitter splitId=SP-8842107 rounding=HALF_UP from double, no ledger check performed` },
    { name: 'reconciliation-daily.txt', lang: 'text', content: `RECONCILIATION 2026-11-13 02:00 ICT   (window 2026-11-12)
Splits processed          : 5,941
Splits mismatched         : 478   (8.0%)
Ledger total charged      : 1,284,317,450 VND
Invoice + fee total       : 1,284,317,512 VND
Net difference            : -62 VND (collected LESS than owed)
Largest single difference : -1 VND
90-day rolling difference : -61,842 VND over 41,206 splits
Note: per-split alert threshold is 1,000 VND, therefore no page was ever fired.
Owner note: differences are not random - they follow share divisibility, i.e. a rounding bug, not a payment failure.` }
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
interface SplitRepository {
    void saveCharges(String splitId, List<Long> charges);   // ghi số tiền từng thành viên bị trừ vào sổ
    long totalCharged(String splitId);                      // tổng đã ghi vào sổ của lần chia này
}

// ===== Code cần sửa =====
class BillSplitter {
    private final SplitRepository repo;

    BillSplitter(SplitRepository repo) { this.repo = repo; }

    /** Chia (bill + fee) cho các thành viên theo tỉ lệ weights[i].
     *  Trả về số tiền từng người phải trả (đơn vị đồng, không có phần lẻ).
     *  Hợp đồng bắt buộc: tổng các phần == bill + fee. */
    List<Long> split(String splitId, long bill, long fee, long[] weights) {
        long total = bill + fee;
        long sumW = 0;
        for (long w : weights) sumW += w;

        List<Long> shares = new ArrayList<>();
        for (long w : weights) {
            double exact = (double) total * w / sumW;   // chia bằng double: đã mất chính xác
            long share = new BigDecimal(exact)          // BigDecimal(double) giữ nguyên sai số nhị phân
                    .setScale(0, RoundingMode.HALF_UP)  // làm tròn TỪNG phần một cách độc lập
                    .longValueExact();
            shares.add(share);
        }
        repo.saveCharges(splitId, shares);              // ghi sổ luôn, không kiểm tra tổng
        return shares;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long sum(List<Long> xs) { long s = 0; for (long x : xs) s += x; return s; }
    static long spread(List<Long> xs) { return Collections.max(xs) - Collections.min(xs); }

    static class FakeRepo implements SplitRepository {
        final Map<String, List<Long>> rows = new HashMap<>();
        public void saveCharges(String splitId, List<Long> charges) { rows.put(splitId, new ArrayList<>(charges)); }
        public long totalCharged(String splitId) { return sum(rows.getOrDefault(splitId, List.of())); }
    }

    public static void main(String[] args) {
        FakeRepo repo = new FakeRepo();
        BillSplitter s = new BillSplitter(repo);

        // 1. Đúng ca sự cố: 100.000đ chia đều 3 người
        List<Long> a = s.split("SP-1", 100_000, 0, new long[]{1, 1, 1});
        check("chia_100k_cho_3_nguoi", a.size() == 3 && sum(a) == 100_000L,
                "cac phan " + a + " tong " + sum(a) + " (ky vong 100000)");
        check("chia_deu_chenh_toi_da_1_dong", a.size() == 3 && spread(a) <= 1,
                "cac phan " + a + " chenh " + (a.isEmpty() ? 0 : spread(a)) + " (ky vong <= 1)");

        // 2. Có phí dịch vụ, chia theo tỉ lệ 7:2:2 (không chia hết)
        List<Long> b = s.split("SP-2", 250_000, 12_500, new long[]{7, 2, 2});
        check("chia_theo_ti_le_co_phi", b.size() == 3 && sum(b) == 262_500L,
                "cac phan " + b + " tong " + sum(b) + " (ky vong 262500)");

        // 3. Sổ ghi nhận (repo) cũng phải khớp tổng
        check("so_ghi_nhan_khop_tong", repo.totalCharged("SP-2") == 262_500L,
                "repo ghi " + repo.totalCharged("SP-2") + " (ky vong 262500)");

        // 4. Phí lẻ đúng 1 đồng cho 4 người
        List<Long> c = s.split("SP-3", 10_000, 1, new long[]{1, 1, 1, 1});
        check("phi_le_mot_dong", c.size() == 4 && sum(c) == 10_001L,
                "cac phan " + c + " tong " + sum(c) + " (ky vong 10001)");

        // 5. Số tiền rất lớn vẫn phải bảo toàn tổng
        List<Long> d = s.split("SP-4", 1_000_000_007L, 0, new long[]{5, 3, 1});
        check("so_lon", sum(d) == 1_000_000_007L, "tong " + sum(d) + " (ky vong 1000000007)");

        // 6. Một người duy nhất: trả đúng hoá đơn + phí
        List<Long> e = s.split("SP-5", 55_555, 4_445, new long[]{1});
        check("mot_nguoi", e.size() == 1 && e.get(0) == 60_000L, "phan " + e + " (ky vong [60000])");

        // 7. Lệch tích luỹ qua 300 lần chia phải bằng 0 (đúng triệu chứng đối soát)
        long drift = 0;
        for (int i = 1; i <= 300; i++) {
            long amount = 1_000 + i * 7;
            drift += sum(s.split("SP-B" + i, amount, 0, new long[]{1, 1, 1})) - amount;
        }
        check("khong_lech_tich_luy", drift == 0, "tong lech sau 300 lan chia = " + drift + " (ky vong 0)");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `interface SplitRepository {
    void saveCharges(String splitId, List<Long> charges);
    long totalCharged(String splitId);
}

class BillSplitter {
    private final SplitRepository repo;

    BillSplitter(SplitRepository repo) { this.repo = repo; }

    List<Long> split(String splitId, long bill, long fee, long[] weights) {
        long total = bill + fee;
        long sumW = 0;
        for (long w : weights) sumW += w;
        if (sumW <= 0) throw new IllegalArgumentException("tong weight phai > 0");

        int n = weights.length;
        BigDecimal totalBd = BigDecimal.valueOf(total);
        BigDecimal sumBd = BigDecimal.valueOf(sumW);
        long[] shares = new long[n];
        BigDecimal[] frac = new BigDecimal[n];   // phần lẻ 0 <= frac < 1 của từng người
        long assigned = 0;

        for (int i = 0; i < n; i++) {
            // Chia chính xác bằng BigDecimal (không qua double), scale lớn rồi cắt XUỐNG về đồng
            BigDecimal exact = totalBd.multiply(BigDecimal.valueOf(weights[i]))
                    .divide(sumBd, 12, RoundingMode.DOWN);
            BigDecimal floor = exact.setScale(0, RoundingMode.DOWN);
            shares[i] = floor.longValueExact();
            frac[i] = exact.subtract(floor);
            assigned += shares[i];
        }

        long leftover = total - assigned;        // luôn trong 0..n-1: số đồng chưa được chia
        boolean[] taken = new boolean[n];
        for (long k = 0; k < leftover; k++) {    // largest remainder: đồng dư về người lẻ lớn nhất
            int best = -1;
            for (int i = 0; i < n; i++) {
                if (taken[i]) continue;
                if (best < 0 || frac[i].compareTo(frac[best]) > 0) best = i;
            }
            shares[best]++;
            taken[best] = true;                  // mỗi người nhận tối đa 1 đồng dư -> chênh <= 1
        }

        List<Long> out = new ArrayList<>(n);
        for (long v : shares) out.add(v);
        repo.saveCharges(splitId, out);
        return out;
    }
}`,
  hints: [
    'Cộng lại kết quả trong log: 3 x 33.333 = 99.999, thiếu 1 đồng; 3 x 67 = 201, thừa 1 đồng. Tổng sai vì mỗi phần được làm tròn riêng lẻ, sai số không được "trả lại" cho ai.',
    'Tìm xem phần bị mất đi đâu: khi chia 100.000 cho 3, phần chung là 33.333 và còn dư 1 đồng. Thay vì bỏ, hãy phát đồng dư đó cho người có phần lẻ lớn nhất (largest remainder).',
    'Đừng dùng {{double}} rồi {{RoundingMode.HALF_UP}} cho từng phần: vừa mất chính xác vừa không bảo toàn tổng. Dùng {{BigDecimal}} chia chính xác, làm tròn XUỐNG để lấy phần nguyên, rồi phân bổ {{leftover}} đồng còn lại; cuối cùng assert tổng == total trước khi ghi sổ.'
  ],
  rootCause: `**Làm tròn từng phần một cách độc lập, trên một giá trị đã bị {{double}} làm mất chính xác — nên sai số không được bù lại ở đâu cả.**

Cơ chế sai theo đúng ba bước trong {{split}}:
1. {{double exact = (double) total * w / sumW;}} — {{double}} là số nhị phân dấu phẩy động 64-bit: nó biểu diễn chính xác lũy thừa của 2, còn 1/3 hay 1/11 thì **không bao giờ** biểu diễn chính xác (giống 0,1 + 0,2 = 0,30000000000000004 trong Java).
2. {{new BigDecimal(exact)}} — constructor nhận {{double}} **sao chép nguyên** phần đuôi nhị phân đó, ví dụ 33333.333333333335701809119200333... Đây là bẫy kinh điển: muốn chính xác phải dùng {{BigDecimal.valueOf}} hoặc chuỗi.
3. {{setScale(0, HALF_UP)}} — mỗi người bị làm tròn về phía gần nhất **một cách độc lập**, không ai kiểm tra tổng. Với 100.000/3: 3 x 33.333 = 99.999 (thiếu 1). Với 200/3: 3 x 67 = 201 (thừa 1).

Dẫn chứng trong log: {{SP-8842103}} có {{shares=[33333, 33333, 33333] total=99999 expected=100000 diff=-1}}; {{SP-8842105}} thì {{total=201 expected=200 diff=+1}}. File đối soát ghi {{Largest single difference : -1 VND}} và {{per-split alert threshold is 1,000 VND}} — vì mỗi lần chỉ lệch 1 đồng nên cảnh báo không bao giờ kêu, sai số **tích luỹ 61.842 đồng trong 90 ngày** mới lộ ra. Đây là lý do bất biến "tổng các phần == tổng gốc" phải được kiểm tra ở mức **tổng**, không phải từng phần.`,
  fix: `**Tóm tắt:** Nguyên tắc vàng của chia tiền là **bảo toàn tổng (allocation)**: tổng các phần phải bằng tổng gốc, không phải "mỗi phần làm tròn thật đẹp". Cách chuẩn: tính phần nguyên bằng phép chia chính xác, rồi phân bổ số đồng còn dư cho những người có **phần lẻ lớn nhất** (thuật toán largest remainder). Không dùng {{double}} cho tiền, và luôn assert tổng trước khi ghi sổ.

### Vì sao "làm tròn cho đẹp từng phần" lại sai
Làm tròn là phép **làm mất thông tin**: mỗi lần làm tròn bạn vứt đi một phần lẻ nhỏ hơn 1 đồng. Nếu làm 3 lần độc lập, bạn vứt 3 phần lẻ và không ai cộng chúng lại. Số học đơn giản:
- 100.000 = 3 x 33.333 + **1** → đồng dư thứ 1 bị bỏ.
- 250.000 + 12.500 = 262.500 = 11 x 23.863 + lẻ, chia theo 7:2:2 cũng dư 1 đồng.

Với hệ thống tiền tệ, "lệch 1 đồng" không phải lỗi nhỏ: sổ sách kế toán phải **cân**, và job đối soát sẽ chặn mọi lần đóng sổ. Hơn nữa sai số tích luỹ theo số giao dịch chứ không triệt tiêu.

### Vì sao {{double}} + HALF_UP không cứu được
Hai lỗi chồng lên nhau:
- {{double}} chỉ có ~15–16 chữ số thập phân có nghĩa; các phân số như 1/3, 7/11 là số vô hạn tuần hoàn trong hệ nhị phân nên **luôn** có sai số.
- {{new BigDecimal(double)}} **không sửa** sai số đó mà đóng gói nguyên xi: {{new BigDecimal(0.1)}} cho 0.1000000000000000055511151231257827. Vì vậy {{HALF_UP}} đang làm tròn trên một con số đã sai từ trước.
- Kể cả khi số chính xác, làm tròn từng phần vẫn không bảo toàn tổng — đây là lỗi **thuật toán**, không phải lỗi độ chính xác.

### Cách sửa: chia phần nguyên rồi phát phần dư (largest remainder)
1. Tính phần chính xác của từng người: {{total * weight_i / sumWeight}}.
2. Lấy **phần nguyên** (làm tròn xuống) — đây là tiền chắc chắn thu.
3. Cộng các phần nguyên lại, {{leftover = total - assigned}}. Về mặt toán học {{0 <= leftover < số thành viên}}.
4. Sắp người theo **phần lẻ giảm dần** và phát mỗi người 1 đồng cho tới khi hết {{leftover}}. Người lẻ nhiều nhất "đáng" được làm tròn lên nhất.
5. Assert {{sum(shares) == total}} rồi mới ghi sổ.

~~~java
long leftover = total - assigned;              // 0..n-1 đồng chưa chia
for (long k = 0; k < leftover; k++) {
    int best = -1;
    for (int i = 0; i < n; i++) {
        if (taken[i]) continue;                 // mỗi người tối đa 1 đồng -> chênh <= 1
        if (best < 0 || frac[i].compareTo(frac[best]) > 0) best = i;
    }
    shares[best]++;
    taken[best] = true;
}
~~~

Kết quả với ca sự cố: 100.000/3 → {{[33334, 33333, 33333]}} (người đầu nhận đồng dư), tổng 100.000, chênh 1 đồng. Với 7:2:2 trên 262.500 → {{[167046, 47727, 47727]}}, tổng đúng 262.500.

### So sánh các cách
| Cách | Tổng đúng | Chênh lệch | Ghi chú |
|---|---|---|---|
| Làm tròn từng phần (double/HALF_UP) | Không | 0–1 đồng mỗi người | Sai, không bao giờ dùng cho tiền |
| Phần cuối gánh toàn bộ phần dư | Có | Có thể tới n−1 đồng | Đơn giản nhưng một người chịu thiệt |
| Largest remainder | Có | ≤ 1 đồng | Công bằng, chuẩn khi chia theo tỉ lệ |
| Cho người trả nhiều nhất gánh phần dư | Có | ≤ 1 đồng | Chấp nhận được, nhưng "phần lẻ lớn nhất" công bằng hơn |

### Ví dụ đời thực
Ví 2 triệu người dùng, 512.000 lần chia trong 87 ngày. Triệu chứng: job đối soát 02:00 báo {{-62 VND}} mỗi đêm, không có alert vì ngưỡng từng lần chia là 1.000 đồng. Điều tra: nhóm theo số thành viên thấy 100% lần lệch có tổng không chia hết cho số người hoặc cho tổng weight — dấu hiệu của lỗi làm tròn, không phải lỗi thanh toán. Xử lý: thay sang largest remainder, chạy lại đối soát trên dữ liệu cũ trong chế độ shadow 3 ngày (so kết quả mới với cũ, không ghi sổ) thấy 0 lệch. Triển khai: lệch về 0 ngay đêm đầu; 61.842 đồng chênh cũ được ghi một bút toán điều chỉnh có mã lý do để sổ cân.

### Phòng ngừa
- Viết **property test**: với mọi {{total}} và mọi bộ weight, {{sum(shares) == total}} và {{spread <= 1}} khi chia đều. Đây là loại test bắt được lỗi này ngay từ đầu, test ví dụ cụ thể thì không.
- Assert bất biến ngay trong service trước khi ghi sổ; sai thì ném lỗi, không ghi.
- Kiểm tra đối soát phải so **tổng theo ngày** và **theo từng lần chia**, đừng chỉ alert theo từng giao dịch.
- Không dùng {{float}}/{{double}} cho tiền; với VND dùng {{long}}, với tiền có phần lẻ dùng {{BigDecimal}} với {{RoundingMode}} tường minh.

### Liên hệ phỏng vấn
Câu "chia 100 nghìn cho 3 người thế nào" kiểm tra bạn có nghĩ tới **bảo toàn tổng** chứ không chỉ "làm tròn cho đẹp". Trả lời đủ ý: (1) làm tròn từng phần độc lập làm mất đồng dư, (2) {{double}} không biểu diễn chính xác phân số thập phân, (3) cách sửa là phần nguyên + largest remainder, (4) assert tổng và property test để phòng ngừa.

> Senior tip: trong hệ thống tiền tệ, "lệch 1 đồng mỗi giao dịch" tệ hơn "lỗi 1 giao dịch to" vì nó không bao giờ vượt ngưỡng cảnh báo. Hãy đặt alert trên **tổng lệch theo ngày** và bắt buộc mọi phép chia phải assert bảo toàn tổng trước khi ghi sổ — tiền đã ghi sổ rồi thì sửa rất đắt.`,
  related: ['core-012'],
  tags: ['money', 'rounding', 'BigDecimal', 'allocation', 'reconciliation']
},
{
  id: 'bug-040',
  title: 'Chia hoá đơn nhóm: làm tròn double làm tổng lệch, đối soát hàng ngày báo sai',
  domain: 'Ví điện tử / Fintech',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Ví điện tử có tính năng **chia hoá đơn nhóm**: một người quét mã QR thanh toán, app tự chia số tiền cho các thành viên trong nhóm. Tiền là **VND (số nguyên đồng)**, lưu dạng {{long}}. Code cũ tính bằng {{double}} và làm tròn từng phần bằng {{Math.round}}.
  **Sự cố:** Job đối soát hằng ngày báo **tổng các phần không bằng tổng hoá đơn**. Ví dụ: 100.000đ chia 3 người → mỗi người 33.333đ (double 33333.333... làm tròn 33333) → tổng 99.999đ (thiếu 1đ); 7đ chia 3 người → mỗi người 2đ → tổng 6đ (thiếu 1đ). Trên 200.000 lần chia/tháng, sai số tích lũy **hơn 3 triệu đồng**. Kế toán mất hàng giờ điều tra thủ công, không phát hiện bug vì từng lần chỉ lệch 1đ.
  **Nhiệm vụ của bạn:** Sửa {{GroupBillSplitter.split}} để **tổng các phần luôn đúng bằng tổng hoá đơn**, chênh lệch giữa các phần **tối đa 1 đồng**.`,
  artifacts: [
    { name: 'recon-daily.txt', lang: 'text', content: `RECONCILIATION 2026-11-15 02:00 ICT
Total splits processed      : 6,721
Splits with diff != 0       : 2,207  (32.8%)
Total net difference        : -1,421 VND (collected LESS)
Pattern                     : bill not divisible by member count; rounding down each share independently
Largest single diff         : -1 VND
Alert threshold (1000 VND)  : NOT TRIGGERED -> silent accumulation` },
    { name: 'split-examples.csv', lang: 'text', content: `split_id,bill,members,shares,sum_shares,diff
SB-20261115-001,100000,3,"33333|33333|33333",99999,-1
SB-20261115-002,200,3,"67|67|67",201,+1
SB-20261115-003,7,3,"2|2|2",6,-1
SB-20261115-004,50000,4,"12500|12500|12500|12500",50000,0` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
interface SplitLedger {
    void record(String splitId, List<Long> shares);
    List<Long> get(String splitId);
}

// ===== Code cần sửa =====
class GroupBillSplitter {
    private final SplitLedger ledger;
    GroupBillSplitter(SplitLedger ledger) { this.ledger = ledger; }

    /** Chia total (VND) cho n người. Trả về danh sách n phần. */
    List<Long> split(String splitId, long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        double share = (double) total / n;       // BUG: double mất chính xác
        List<Long> shares = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            shares.add(Math.round(share));       // làm tròn TỪNG phần độc lập
        }
        ledger.record(splitId, shares);          // ghi sổ KHÔNG kiểm tra tổng
        return shares;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static long sum(List<Long> xs) { long s = 0; for (long x : xs) s += x; return s; }
    static long spread(List<Long> xs) { return Collections.max(xs) - Collections.min(xs); }

    static class FakeLedger implements SplitLedger {
        final Map<String, List<Long>> data = new HashMap<>();
        public void record(String id, List<Long> shares) { data.put(id, new ArrayList<>(shares)); }
        public List<Long> get(String id) { return data.getOrDefault(id, List.of()); }
    }

    public static void main(String[] args) {
        FakeLedger l1 = new FakeLedger();
        GroupBillSplitter s1 = new GroupBillSplitter(l1);
        List<Long> a = s1.split("SB-1", 100_000, 3);
        check("chia_100k_3_nguoi", a.size() == 3 && sum(a) == 100_000L && spread(a) <= 1,
            "các phần " + a + " tổng " + sum(a) + " (ky vọng 100000, chênh <= 1)");

        FakeLedger l2 = new FakeLedger();
        GroupBillSplitter s2 = new GroupBillSplitter(l2);
        List<Long> b = s2.split("SB-2", 7, 3);
        check("chia_7_dong_3_nguoi", b.size() == 3 && sum(b) == 7L && spread(b) <= 1,
            "các phần " + b + " tổng " + sum(b) + " (ky vọng 7)");

        FakeLedger l3 = new FakeLedger();
        GroupBillSplitter s3 = new GroupBillSplitter(l3);
        List<Long> c = s3.split("SB-3", 200, 3);
        check("chia_200_dong_3_nguoi", c.size() == 3 && sum(c) == 200L && spread(c) <= 1,
            "các phần " + c + " tổng " + sum(c) + " (ky vọng 200)");

        FakeLedger l4 = new FakeLedger();
        GroupBillSplitter s4 = new GroupBillSplitter(l4);
        List<Long> d = s4.split("SB-4", 1_000_000_007L, 10);
        check("so_lon_10_nguoi", d.size() == 10 && sum(d) == 1_000_000_007L && spread(d) <= 1,
            "tổng " + sum(d) + " (ky vọng 1000000007)");

        FakeLedger l5 = new FakeLedger();
        GroupBillSplitter s5 = new GroupBillSplitter(l5);
        List<Long> e = s5.split("SB-5", 55_555, 1);
        check("mot_nguoi", e.size() == 1 && e.get(0) == 55_555, "một người phải nhận đủ, thực tế " + e);

        // Kiểm tra ledger ghi nhận khớp
        check("ledger_ghi_dung", l1.get("SB-1").equals(a) && l2.get("SB-2").equals(b),
            "ledger phải ghi đúng danh sách phần vừa trả về");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
interface SplitLedger {
    void record(String splitId, List<Long> shares);
    List<Long> get(String splitId);
}

// ===== Code đã sửa =====
class GroupBillSplitter {
    private final SplitLedger ledger;
    GroupBillSplitter(SplitLedger ledger) { this.ledger = ledger; }

    List<Long> split(String splitId, long total, int n) {
        if (n <= 0) throw new IllegalArgumentException("n phải > 0");
        long base = total / n;              // phần nguyên chia đều
        long remainder = total % n;         // số đồng còn dư (0 <= remainder < n)
        List<Long> shares = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            shares.add(base + (i < remainder ? 1 : 0)); // phát từng đồng dư cho người đầu (largest remainder)
        }
        ledger.record(splitId, shares);     // tổng = base*n + remainder = total
        return shares;
    }
}`,
  hints: [
    'Làm tròn từng phần độc lập (double + Math.round) làm mất số dư: 3 × 33.333 = 99.999.',
    'Dùng số học nguyên: total / n cho phần chung, total % n cho số đồng dư, phát thêm 1 đồng cho remainder người đầu.',
    'Luôn assert tổng các phần == total trước khi ghi sổ; property test với mọi total, n ngẫu nhiên sẽ bắt lỗi này ngay.',
  ],
  rootCause: `**Làm tròn từng phần một cách độc lập trên giá trị {{double}} đã mất chính xác.** Khi chia 100.000 cho 3, {{double}} cho 33333.333333333336...; {{Math.round}} làm tròn thành 33333 cho TẤT CẢ 3 người → tổng 99.999 (thiếu 1 đồng). Mỗi phần sai 0,33–0,66 đồng, nhân theo 200.000 lần chia/tháng → sai số tích lũy > 3 triệu đồng.
  Nguyên tắc bị vi phạm: **tổng các phần phải bằng tổng gốc** (allocation / bảo toàn tổng). Code không hề kiểm tra ràng buộc này trước khi ghi sổ. {{double}} chỉ có ~15–16 chữ số thập phân có nghĩa; các phân số như 1/3 là vô hạn tuần hoàn trong nhị phân nên **luôn** có sai số. Dùng {{Math.round}} trên {{double}} là bẫy kép: vừa mất chính xác vừa không bảo toàn tổng.`,
  fix: `### Cách sửa
Dùng **số học nguyên**: phần chung {{total / n}}, số dư {{total % n}} được phát thêm 1 đồng cho {{remainder}} người đầu tiên (thuật toán **largest remainder** đơn giản: những người có phần lẻ lớn nhất nhận đồng dư). Tổng luôn đúng, chênh lệch tối đa 1 đồng, không có {{double}} nào.
~~~java
long base = total / n;
long remainder = total % n;
List<Long> shares = new ArrayList<>(n);
for (int i = 0; i < n; i++) {
    shares.add(base + (i < remainder ? 1 : 0));
}
~~~

### Với tiền có phần thập phân (USD, EUR)
Đổi về **đơn vị nhỏ nhất** (cent) dạng {{long}}, chia như trên, rồi đổi lại; hoặc dùng {{BigDecimal}} với {{divide(n, 2, RoundingMode.DOWN)}} cho n−1 phần đầu và **phần cuối = tổng − tổng các phần trước**.
~~~java
BigDecimal part = total.divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
BigDecimal last = total.subtract(part.multiply(BigDecimal.valueOf(n - 1)));
~~~

### Phòng ngừa
- Viết **property test** (jqwik hoặc vòng lặp ngẫu nhiên): với mọi total, n ngẫu nhiên → {{sum(shares) == total && spread <= 1}}.
- Assert bất biến ngay trong service trước khi {{ledger.record}}: nếu tổng không khớp thì ném lỗi, **không bao giờ ghi sổ sai**.
- Không bao giờ dùng {{float}}/{{double}} cho tiền. Quy ước: VND dùng {{long}}, ngoại tệ dùng {{BigDecimal}} scale cố định.

### Liên hệ phỏng vấn
Câu "chia 100 nghìn cho 3 người thế nào" kiểm tra bạn có nghĩ tới **bảo toàn tổng** (allocation) chứ không chỉ "làm tròn cho đẹp". Trả lời đủ ý: (1) làm tròn từng phần độc lập làm mất đồng dư, (2) {{double}} không biểu diễn chính xác phân số thập phân, (3) cách sửa là phần nguyên + largest remainder, (4) assert tổng và property test để phòng ngừa.

> Senior tip: trong hệ thống tiền tệ, "lệch 1 đồng mỗi giao dịch" tệ hơn "lỗi 1 giao dịch to" vì nó **không bao giờ vượt ngưỡng cảnh báo**. Hãy đặt alert trên **tổng lệch theo ngày** và bắt buộc mọi phép chia phải assert bảo toàn tổng trước khi ghi sổ — tiền đã ghi sổ rồi thì sửa rất đắt.`,
  related: ['core-012'],
  tags: ['money', 'rounding', 'BigDecimal', 'allocation', 'reconciliation', 'largest-remainder']
},
{
  id: 'bug-041',
  title: 'Mất cập nhật số dư ký quỹ: hai lệnh mua đồng thời vượt hạn mức buying power',
  domain: 'Sàn giao dịch / Ký quỹ',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Sàn giao dịch chứng khoán cho phép khách đặt lệnh mua cổ phiếu trên ký quỹ (margin). Service {{MarginService}} quản trị **buying power** (sức mua — số tiền tối đa khách có thể dùng để mua, tính từ tài sản đảm bảo trừ đi nợ ký quỹ). Mỗi lệnh mua cần trừ buying power. Buying power lưu trong bảng {{margin_account}} với cột {{version}} để hỗ trợ khoá lạc quan (optimistic lock — cơ chế kiểm tra phiên bản trước khi ghi: chỉ ghi khi version trong DB khớp version đã đọc, nếu không khớp nghĩa là người khác vừa sửa). Ứng dụng chạy 4 pod, mỗi pod nhiều thread.
  **Sự cố:** Phiên sáng 20/11, một khách hàng có buying power 1.000.000.000 đồng đặt **hai lệnh mua cùng lúc** (cùng mã cổ phiếu, mỗi lệnh 600.000.000). Cả hai lệnh đều qua kiểm tra buying power, cả hai được khớp lệnh, buying power cuối cùng xuống -200.000.000 (vượt hạn mức 200 triệu). Đối soát cuối ngày phát hiện 37 tài khoản buying power âm, tổng vượt hạn mức 18 tỷ đồng.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{MarginService.reserveBuyingPower}} và log, giải thích vì sao hai lệnh cùng lúc đều qua kiểm tra.
  2. Sửa code để dùng **khoá lạc quan (optimistic lock)** với cột version: chỉ ghi khi version khớp, nếu xung đột thì đọc lại buying power mới và thử lại (tối đa 3 lần), hết lượt thì ném lỗi.
  3. Bấm **Chạy test**: test dùng CountDownLatch ép hai luồng cùng rơi vào nhánh check buying power.`,
  artifacts: [
    { name: 'margin-service.log', lang: 'text', content: `2026-11-20 09:12:44.118 INFO  [http-nio-8080-exec-17] MarginService : reserve acc=M-1001 amount=600000000 req=REQ-7f3a
2026-11-20 09:12:44.124 INFO  [http-nio-8080-exec-23] MarginService : reserve acc=M-1001 amount=600000000 req=REQ-7f3b
2026-11-20 09:12:44.131 DEBUG [http-nio-8080-exec-17] MarginService : acc=M-1001 buyingPower=1000000000 version=41 -> ok
2026-11-20 09:12:44.133 DEBUG [http-nio-8080-exec-23] MarginService : acc=M-1001 buyingPower=1000000000 version=41 -> ok
2026-11-20 09:12:44.148 INFO  [http-nio-8080-exec-17] MarginService : reserve OK acc=M-1001 newBuyingPower=400000000
2026-11-20 09:12:44.150 INFO  [http-nio-8080-exec-23] MarginService : reserve OK acc=M-1001 newBuyingPower=400000000  <- CẢ HAI ĐỀU OK, BUYING POWER VỀ 400M THAY VÌ -200M` },
    { name: 'reconcile-2026-11-20.txt', lang: 'text', content: `RECONCILIATION 2026-11-20 06:00 ICT
Accounts with negative buying power : 37
Total over-reserved (VND)          : 18,400,000,000
Pattern                            : 2 reserves within < 50 ms, same account, same amount (100% of cases)
Note: UPDATE statement lacks WHERE version = ? clause, so second write overwrites first.` },
  ],
  starter: `// ===== Hạ tầng (KHÔNG cần sửa) =====
class MarginAccount {
    final String id;
    long buyingPower;
    long version;
    MarginAccount(String id, long buyingPower, long version) { this.id = id; this.buyingPower = buyingPower; this.version = version; }
    MarginAccount copy() { return new MarginAccount(id, buyingPower, version); }
}

class InsufficientBuyingPowerException extends RuntimeException {
    InsufficientBuyingPowerException(String msg) { super(msg); }
}

class MarginStore {
    private final Map<String, MarginAccount> rows = new HashMap<>();
    Runnable onLoad;
    int loads;
    void insert(String id, long buyingPower) { rows.put(id, new MarginAccount(id, buyingPower, 0)); }
    MarginAccount load(String id) {
        loads++;
        MarginAccount a = rows.get(id).copy();
        Runnable hook = onLoad;
        if (hook != null) hook.run();
        return a;
    }
    // Ghi không kiểm tra version: lost update
    void save(MarginAccount a) { MarginAccount cur = rows.get(a.id); cur.buyingPower = a.buyingPower; cur.version++; }
    // Ghi có kiểm tra version: trả false nếu version không khớp (ai đó vừa sửa)
    boolean saveIfVersion(MarginAccount a) {
        MarginAccount cur = rows.get(a.id);
        if (cur.version != a.version) return false;
        cur.buyingPower = a.buyingPower; cur.version++;
        return true;
    }
    void touch(String id) { rows.get(id).version++; }   // một giao dịch khác vừa cập nhật
    long buyingPower(String id) { return rows.get(id).buyingPower; }
    long version(String id) { return rows.get(id).version; }
}

// ===== Code cần sửa =====
class MarginService {
    private final MarginStore store;
    MarginService(MarginStore store) { this.store = store; }

    void reserveBuyingPower(String accountId, long amount) {
        MarginAccount a = store.load(accountId);
        if (a.buyingPower < amount) throw new InsufficientBuyingPowerException("buying power không đủ: " + a.buyingPower);
        a.buyingPower -= amount;
        store.save(a);
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        // 1. Trừ bình thường
        MarginStore s1 = new MarginStore(); s1.insert("M", 1_000_000_000L);
        new MarginService(s1).reserveBuyingPower("M", 300_000_000L);
        check("tru_binh_thuong", s1.buyingPower("M") == 700_000_000L, "1 tỷ - 300 triệu phải còn 700 triệu, thực tế " + s1.buyingPower("M"));

        // 2. Giao dịch 600 triệu chen vào giữa lúc giao dịch 600 triệu đọc và ghi
        // Với optimistic lock: chỉ một lệnh thành công, lệnh thứ hai bị từ chối vì buying power chỉ còn 400M < 600M
        MarginStore s2 = new MarginStore(); s2.insert("M", 1_000_000_000L);
        MarginService svc2 = new MarginService(s2);
        s2.onLoad = () -> { s2.onLoad = null; svc2.reserveBuyingPower("M", 600_000_000L); };
        boolean rejected2 = false;
        try { svc2.reserveBuyingPower("M", 600_000_000L); } catch (InsufficientBuyingPowerException e) { rejected2 = true; }
        check("khong_mat_cap_nhat", rejected2 && s2.buyingPower("M") == 400_000_000L,
            "một lệnh 600M thành công, lệnh kia bị từ chối (buying power 400M < 600M), buying power cuối = 400M, thực tế rejected=" + rejected2 + " bp=" + s2.buyingPower("M"));

        // 3. Buying power 400 triệu: giao dịch 300 triệu chen vào, giao dịch 300 triệu phải bị từ chối
        MarginStore s3 = new MarginStore(); s3.insert("M", 400_000_000L);
        MarginService svc3 = new MarginService(s3);
        s3.onLoad = () -> { s3.onLoad = null; svc3.reserveBuyingPower("M", 300_000_000L); };
        boolean rejected = false;
        try { svc3.reserveBuyingPower("M", 300_000_000L); } catch (InsufficientBuyingPowerException e) { rejected = true; }
        check("khong_vuot_buying_power", rejected && s3.buyingPower("M") == 100_000_000L,
            "sau khi trừ 300 triệu, lệnh 300 triệu phải bị từ chối và buying power còn 100 triệu; thực tế rejected=" + rejected + " bp=" + s3.buyingPower("M"));

        // 4. Tài khoản bị cập nhật liên tục: phải dừng sau vài lần thử và báo lỗi, không ghi đè
        MarginStore s4 = new MarginStore(); s4.insert("M", 1_000_000_000L);
        s4.onLoad = () -> s4.touch("M");
        String err4 = null;
        try { new MarginService(s4).reserveBuyingPower("M", 100_000_000L); } catch (InsufficientBuyingPowerException e) { err4 = "sai loại lỗi"; } catch (RuntimeException e) { err4 = "ok"; }
        check("retry_co_gioi_han", "ok".equals(err4) && s4.buyingPower("M") == 1_000_000_000L && s4.loads >= 2 && s4.loads <= 5,
            "khi luôn xung đột phải thử lại 2-5 lần rồi ném lỗi, không trừ buying power; thực tế loads=" + s4.loads + " bp=" + s4.buyingPower("M") + " err=" + err4);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class MarginAccount {
    final String id;
    long buyingPower;
    long version;
    MarginAccount(String id, long buyingPower, long version) { this.id = id; this.buyingPower = buyingPower; this.version = version; }
    MarginAccount copy() { return new MarginAccount(id, buyingPower, version); }
}

class InsufficientBuyingPowerException extends RuntimeException {
    InsufficientBuyingPowerException(String msg) { super(msg); }
}

class MarginStore {
    private final Map<String, MarginAccount> rows = new HashMap<>();
    Runnable onLoad;
    int loads;
    void insert(String id, long buyingPower) { rows.put(id, new MarginAccount(id, buyingPower, 0)); }
    MarginAccount load(String id) {
        loads++;
        MarginAccount a = rows.get(id).copy();
        Runnable hook = onLoad;
        if (hook != null) hook.run();
        return a;
    }
    void save(MarginAccount a) { MarginAccount cur = rows.get(a.id); cur.buyingPower = a.buyingPower; cur.version++; }
    boolean saveIfVersion(MarginAccount a) {
        MarginAccount cur = rows.get(a.id);
        if (cur.version != a.version) return false;
        cur.buyingPower = a.buyingPower; cur.version++;
        return true;
    }
    void touch(String id) { rows.get(id).version++; }
    long buyingPower(String id) { return rows.get(id).buyingPower; }
    long version(String id) { return rows.get(id).version; }
}

class MarginService {
    static final int MAX_ATTEMPTS = 3;
    private final MarginStore store;
    MarginService(MarginStore store) { this.store = store; }

    void reserveBuyingPower(String accountId, long amount) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            MarginAccount a = store.load(accountId);              // đọc lại buying power MỚI NHẤT ở mỗi lần thử
            if (a.buyingPower < amount) throw new InsufficientBuyingPowerException("buying power không đủ: " + a.buyingPower);
            a.buyingPower -= amount;
            if (store.saveIfVersion(a)) return;                   // where version = ? : chỉ ghi khi không ai sửa xen vào
        }
        throw new IllegalStateException("tài khoản " + accountId + " bị cập nhật đồng thời, đã thử " + MAX_ATTEMPTS + " lần");
    }
}`,
  hints: [
    'Đọc margin-service.log: hai thread cùng đọc buyingPower=1000000000 version=41. Câu UPDATE thứ hai dựa trên buying power nào?',
    'UPDATE không có điều kiện "and version = 41" nên thread chậm hơn ghi đè kết quả của thread nhanh hơn: lost update kiểu read-modify-write. MarginStore đã có sẵn saveIfVersion.',
    'Dùng saveIfVersion; nếu trả về false thì ĐỌC LẠI tài khoản (buying power mới) rồi kiểm tra và trừ lại, tối đa vài lần; hết lượt thì ném lỗi chứ không ghi đè.',
  ],
  rootCause: `**Lost update do read-modify-write không có kiểm tra phiên bản.** Hai request cùng đọc tài khoản {{M-1001}} với {{buyingPower=1000000000 version=41}} (dòng 09:12:44.131 và .133). Request đầu ghi {{buyingPower=400000000}}, rồi request sau ghi {{buyingPower=400000000}} tính từ buying power cũ 1 tỷ, đè mất lần trừ 600 triệu đầu tiên. Câu UPDATE {{where id='M-1001'}} không có {{and version=41}}, nên lần ghi thứ hai vẫn thành công dù dữ liệu đã đổi.

Cùng cơ chế đó, kiểm tra buying power cũng sai: cả hai request đều thấy đủ buying power dựa trên số cũ, nên tài khoản mua vượt hạn mức 200 triệu. Cột {{version}} có trong bảng nhưng vô dụng vì không nằm trong điều kiện WHERE.`,
  fix: `### Cách sửa trong bài
Ghi có điều kiện phiên bản ({{saveIfVersion}}, tương đương {{update ... where id=? and version=?}}) và khi ghi thất bại thì **đọc lại** rồi tính lại, tối đa 3 lần:
~~~java
for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    MarginAccount a = store.load(accountId);
    if (a.buyingPower < amount) throw new InsufficientBuyingPowerException("...");
    a.buyingPower -= amount;
    if (store.saveIfVersion(a)) return;
}
throw new IllegalStateException("cập nhật đồng thời, hết lượt thử");
~~~
Điểm hay sai: retry mà **không đọc lại** (dùng lại đối tượng cũ) thì chỉ ghi đè chậm hơn; và retry vô hạn thì tài khoản hot làm treo thread.

### Trên production thật (Spring + JPA)
| Cách | Khi nào dùng | Lưu ý |
|---|---|---|
| {{@Version}} + retry | Xung đột hiếm, đa số request khác tài khoản | Bắt {{ObjectOptimisticLockingFailureException}}, retry **cả transaction** (ví dụ Spring Retry đặt bên ngoài {{@Transactional}}) |
| Update nguyên tử {{update margin_account set buying_power = buying_power - :amt where id = :id and buying_power >= :amt}} | Trừ buying power đơn giản | Kiểm tra số dòng cập nhật = 1, không cần đọc trước; nhanh nhất |
| {{SELECT ... FOR UPDATE}} (pessimistic) | Tài khoản hot, xung đột thường xuyên | Giữ transaction ngắn, có lock timeout |

Với ký quỹ, cách phổ biến nhất là update nguyên tử có điều kiện buying power, kèm bảng sổ cái ghi từng giao dịch với idempotency key. Đội cũ bỏ {{@Version}} vì "hay bị OptimisticLockException": exception đó chính là tín hiệu có xung đột thật; bỏ nó đi là đổi lỗi ồn ào lấy lỗi âm thầm mất tiền.

### Phòng ngừa
- Mọi read-modify-write trên tiền/tồn kho/buying power phải có một trong ba cơ chế trên; review code tìm mẫu "load, set, save".
- Test đồng thời có chèn giao dịch vào giữa (như {{onLoad}} trong bài), không chỉ test tuần tự.
- Job đối soát buying power với sổ cái hằng ngày, đây là thứ đã phát hiện ra bug.

### Liên hệ phỏng vấn
Câu "hai người cùng cập nhật một bản ghi" xuất hiện ở hầu hết vòng Senior. Hãy kể theo thứ tự: chỉ ra lost update, so sánh optimistic với pessimistic và update nguyên tử, rồi nói cách retry đúng (đọc lại, giới hạn lượt, retry cả transaction).

> Senior tip: {{@Version}} là "còi báo" xung đột — không bao giờ tắt nó đi vì "hay ném exception". Exception đó chính là bằng chứng hệ thống đang bảo vệ dữ liệu. Nếu không muốn retry ở tầng service, hãy dùng update nguyên tử có điều kiện ở tầng repository; nhưng đừng bao giờ làm read-modify-write không có version.`,
  related: ['jpa-004', 'scenario-008', 'scenario-119'],
  tags: ['lost update', 'optimistic locking', '@Version', 'retry', 'margin', 'buying power']
},
{
  id: 'bug-042',
  title: 'Task bị xử lý 2 lần sau rebalance: consumer commit offset trước khi xử lý xong',
  domain: 'Xử lý sự kiện / Kafka Consumer',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Service {{OrderProcessor}} đọc topic {{order-events}} (sự kiện đơn hàng: tạo, hủy, thanh toán) và cập nhật trạng thái đơn trong DB. Consumer tắt auto-commit, tự {{commitSync}} để "chủ động kiểm soát offset". Mỗi lần poll lấy tối đa 5 record. Consumer group có 3 pod.
  **Sự cố:** Sáng 25/11, Kubernetes scale-up thêm 1 pod (tổng 4 pod) gây **rebalance** (phân chia lại partition giữa các consumer). Trong lúc rebalance, một pod đang xử lý batch 5 record bị revoke partition. Pod đó đã {{commitSync}} offset mới **trước khi** xử lý xong 5 record đó. Khi partition được gán cho pod khác, pod mới đọc từ offset đã commit → **3 record trong batch cũ không bao giờ được xử lý**. Đối soát phát hiện 3 đơn hàng trạng thái {{CREATED}} mãi mà không chuyển sang {{PAID}} dù tiền đã thu.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{OrderConsumer.pollAndProcess}} và log, tìm vì sao record bị mất khi rebalance xảy ra giữa chừng batch.
  2. Sửa để: (a) **xử lý xong mới commit offset**; (b) consumer **idempotent** (bỏ qua record đã xử lý) dùng processed-id store mô phỏng bảng {{processed_events}}. Test mô phỏng rebalance: writer xử lý nửa batch rồi "crash", consumer mới đọc từ offset cũ phải xử lý nốt record còn lại, không xử lý lại record đã xong.
  3. Bấm **Chạy test**: test tái hiện rebalance xác định.`,
  artifacts: [
    { name: 'order-processor.log', lang: 'text', content: `2026-11-25 08:12:44.118 INFO  OrderConsumer : polled 5 records partition=order-events-2 offsets=[15520..15524]
2026-11-25 08:12:44.124 INFO  OrderConsumer : committed offset=15525 partition=order-events-2
2026-11-25 08:12:44.131 INFO  OrderService  : processed ORDER-77120 status=PAID
2026-11-25 08:12:44.145 INFO  OrderService  : processed ORDER-77121 status=PAID
2026-11-25 08:12:44.150 # REBALANCE: pod order-processor-3 revoked partition order-events-2
2026-11-25 08:12:44.160 # Pod order-processor-4 assigned partition order-events-2, starts from offset 15525
2026-11-25 08:12:44.200 INFO  OrderConsumer : polled 5 records partition=order-events-2 offsets=[15525..15529]` },
    { name: 'reconcile-2026-11-25.txt', lang: 'text', content: `ORDER RECONCILIATION 2026-11-25 06:00 ICT
Orders with payment captured     : 1,240
Orders stuck in CREATED state    : 3  (ORDER-77122, ORDER-77123, ORDER-77124)
Missing events in order-events   : offsets 15522, 15523, 15524
Root cause                       : consumer committed offset 15525 BEFORE processing offsets 15522..15524` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng Kafka + DB đơn hàng, KHÔNG cần sửa) =====
class Broker {   // một partition: danh sách record + offset đã commit của consumer group
    final List<String> log = new ArrayList<>();
    long committed = 0;
    List<String> poll(long from, int max) {
        int start = (int) from;
        return new ArrayList<>(log.subList(start, Math.min(log.size(), start + max)));
    }
    void commitSync(long nextOffset) { committed = nextOffset; }
}

class OrderService {   // cập nhật trạng thái đơn; failOnce mô phỏng pod crash/rebalance đúng lúc xử lý record đó
    final List<String> processed = new ArrayList<>();
    final Set<String> failOnce = new HashSet<>();
    void process(String orderId) {
        if (failOnce.remove(orderId)) throw new IllegalStateException("rebalance while processing " + orderId);
        processed.add(orderId);
    }
    boolean alreadyProcessed(String orderId) { return processed.contains(orderId); }
}

// ===== Code cần sửa =====
class OrderConsumer {   // mỗi lần pod khởi động lại / rebalance là một instance mới, đọc tiếp từ offset đã commit
    private final Broker broker;
    private final OrderService orderService;
    OrderConsumer(Broker broker, OrderService orderService) { this.broker = broker; this.orderService = orderService; }

    /** Trả về số record đã nhận trong lần poll này (0 = hết). */
    int pollAndProcess() {
        long from = broker.committed;
        List<String> records = broker.poll(from, 5);
        if (records.isEmpty()) return 0;
        broker.commitSync(from + records.size());     // BUG: commit TRƯỚC khi xử lý
        for (String orderId : records) {
            orderService.process(orderId);
        }
        return records.size();
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    // chạy consumer cho đến khi hết record; nếu "pod crash/rebalance" thì tạo consumer mới (restart) và chạy tiếp
    static void runWithRebalance(Broker b, OrderService o) {
        for (int restarts = 0; restarts < 5; restarts++) {
            OrderConsumer c = new OrderConsumer(b, o);
            try {
                while (c.pollAndProcess() > 0) { }
                return;
            } catch (IllegalStateException crash) { /* pod rebalance/restart */ }
        }
    }

    public static void main(String[] args) {
        // 1. Xử lý bình thường không rebalance
        Broker b1 = new Broker(); OrderService o1 = new OrderService();
        for (int i = 1; i <= 5; i++) b1.log.add("ORDER-" + i);
        runWithRebalance(b1, o1);
        check("xu_ly_binh_thuong", o1.processed.equals(List.of("ORDER-1", "ORDER-2", "ORDER-3", "ORDER-4", "ORDER-5")) && b1.committed == 5,
            "không có sự cố: phải xử lý đủ 5 đơn và commit offset 5, thực tế " + o1.processed + " offset=" + b1.committed);

        // 2. Rebalance giữa batch: pod crash sau khi xử lý 2/5 record
        Broker b = new Broker(); OrderService o = new OrderService();
        for (int i = 1; i <= 7; i++) b.log.add("ORDER-" + i);
        o.failOnce.add("ORDER-3");   // crash/rebalance khi đang xử lý ORDER-3
        runWithRebalance(b, o);
        List<String> missing = new ArrayList<>();
        for (String id : b.log) if (!o.processed.contains(id)) missing.add(id);
        check("rebalance_giua_batch_khong_mat_don", missing.isEmpty(), "sau rebalance phải xử lý đủ 7 đơn, bị mất " + missing);

        long dup = o.processed.size() - new HashSet<>(o.processed).size();
        check("khong_xu_ly_tien_hai_lan", dup == 0, "mỗi đơn chỉ được xử lý một lần, thực tế trùng " + dup + ": " + o.processed);

        check("offset_cuoi_cung_dung", b.committed == 7, "xử lý xong phải commit offset 7, thực tế " + b.committed);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class Broker {
    final List<String> log = new ArrayList<>();
    long committed = 0;
    List<String> poll(long from, int max) {
        int start = (int) from;
        return new ArrayList<>(log.subList(start, Math.min(log.size(), start + max)));
    }
    void commitSync(long nextOffset) { committed = nextOffset; }
}

class OrderService {
    final List<String> processed = new ArrayList<>();
    final Set<String> failOnce = new HashSet<>();
    void process(String orderId) {
        if (failOnce.remove(orderId)) throw new IllegalStateException("rebalance while processing " + orderId);
        processed.add(orderId);
    }
    boolean alreadyProcessed(String orderId) { return processed.contains(orderId); }
}

class OrderConsumer {
    private final Broker broker;
    private final OrderService orderService;
    OrderConsumer(Broker broker, OrderService orderService) { this.broker = broker; this.orderService = orderService; }

    int pollAndProcess() {
        long from = broker.committed;
        List<String> records = broker.poll(from, 5);
        if (records.isEmpty()) return 0;
        for (String orderId : records) {
            // at-least-once: record có thể được giao lại sau rebalance, nên xử lý phải idempotent
            if (!orderService.alreadyProcessed(orderId)) {
                orderService.process(orderId);
            }
        }
        broker.commitSync(from + records.size());     // FIX: commit SAU khi đã xử lý xong cả batch
        return records.size();
    }
}`,
  hints: [
    'Nhìn log: "committed offset=15525" xuất hiện TRƯỚC khi ORDER-77122 (offset 15522) được xử lý. Sau rebalance, consumer mới đọc từ đâu?',
    'Commit offset nghĩa là nói với Kafka "tôi đã xử lý xong mọi thứ trước offset này". Commit trước khi xử lý biến consumer thành at-most-once: chết giữa chừng là mất.',
    'Chuyển commitSync xuống sau vòng xử lý. Khi đó record có thể được giao lại (at-least-once), nên phải bỏ qua đơn đã xử lý rồi (idempotent consumer).',
  ],
  rootCause: `**Commit offset trước khi xử lý (at-most-once).** Consumer gọi {{commitSync(from + records.size())}} ngay sau khi poll, tức là báo với Kafka "đã xử lý xong offset 15520..15524" khi thực tế chưa xử lý record nào. Pod bị revoke partition sau khi xử lý xong ORDER-77120 và ORDER-77121; khi partition được gán cho pod mới, consumer đọc từ offset đã commit (dòng {{starts from offset 15525}}), nên 3 record ở offset 15522, 15523, 15524 (ORDER-77122, 77123, 77124) **không bao giờ được đọc lại**. File đối soát khớp đúng: 15520, 15521 đã PAID, 15522..15524 MISSING. Lag về 0 nên không có cảnh báo nào.`,
  fix: `### Cách sửa
1. **Xử lý trước, commit sau**: gọi {{commitSync}} sau khi cả batch đã xử lý xong. Consumer chết/rebalance giữa chừng thì sau restart sẽ đọc lại từ offset cũ: không mất record (at-least-once).
2. **Consumer idempotent**: at-least-once nghĩa là record có thể được giao **lại** (ORDER-1, ORDER-2 trong test được đọc lại sau restart). Kiểm tra đơn đã được xử lý chưa trước khi xử lý.

### Trên production thật
- Idempotency phải nằm **trong database, cùng transaction với việc cập nhật trạng thái đơn**: bảng {{processed_events(order_id PRIMARY KEY)}} hoặc unique constraint trên {{order_events.order_id}}. Kiểm tra bằng {{List.contains}} trong bộ nhớ như bài tập không đủ khi có nhiều pod.
- Với Spring Kafka, dùng {{AckMode.RECORD}} hoặc {{BATCH}} (mặc định commit sau khi listener chạy xong), không tự commit trước khi xử lý.
- Nếu xử lý bất đồng bộ (đẩy record sang thread pool), auto-commit có thể commit trước khi thread xử lý xong: cùng lỗi mất dữ liệu. Chỉ commit offset của những record đã hoàn tất.
- Kafka "exactly-once" ({{transactional.id}}, {{read_committed}}) chỉ áp dụng khi kết quả được ghi lại vào Kafka. Ghi vào database thì vẫn cần at-least-once + idempotent.

| Chiến lược | Khi consumer chết/rebalance | Phù hợp |
|---|---|---|
| Commit trước, xử lý sau | **Mất** record | Gần như không bao giờ (metric không quan trọng) |
| Xử lý trước, commit sau | Record bị xử lý **lại** | Mặc định, kèm idempotency |
| Lưu offset cùng transaction DB | Không mất, không trùng | Hệ thống tài chính cần chặt chẽ |

### Phòng ngừa
- Đối soát tự động hằng giờ giữa nguồn (cổng thanh toán) và sổ cái đơn hàng, không chỉ cuối ngày.
- Test chaos: kill consumer giữa batch (như bài này) phải nằm trong test tích hợp.

### Liên hệ phỏng vấn
Câu hỏi kinh điển: "at-most-once, at-least-once, exactly-once khác nhau thế nào và bạn đạt được bằng cách nào?". Trả lời bằng thứ tự commit/xử lý, và nói rõ exactly-once với side effect bên ngoài Kafka thực chất là at-least-once + idempotency.

> Senior tip: Đừng bao giờ commit offset trước khi xử lý xong — đó là nguyên nhân số 1 mất dữ liệu trong Kafka consumer. Và nhớ rằng "xử lý lại" là bình thường trong at-least-once; thiết kế idempotent từ đầu (unique constraint DB) thay vì cố gắng "không bao giờ xử lý lại".`,
  related: ['microservices-009', 'microservices-031', 'microservices-022'],
  tags: ['Kafka', 'offset commit', 'at-least-once', 'idempotency', 'rebalance', 'data loss']
},
{
  id: 'bug-043',
  title: 'Cache trả dữ liệu cũ sau khi cập nhật DB: xóa cache race với đọc đang xử lý',
  domain: 'Cache / Cửa hàng sản phẩm',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Service {{ProductService}} quản lý giá sản phẩm. Đọc giá dùng cache (mô phỏng Redis bằng Map), ghi giá cập nhật DB rồi xóa cache. Cache có TTL 60 giây.
**Sự cố:** Khách hàng A xem giá sản phẩm {{P-1001}} (cache miss, đọc DB thấy 100.000). Đồng thời admin cập nhật giá thành 200.000: cập nhật DB xong rồi xóa cache. Nhưng request đọc của A đang ở giữa chừng, sau khi đọc DB xong thì **ghi giá cũ 100.000 vào cache**. Kết quả: cache đang có 100.000 bất chấp DB đã 200.000. Nhiều lượt khách tiếp theo thấy giá cũ, đặt hàng dưới giá thực. Kiểm toán phát hiện chênh lệch doanh thu 45 triệu trong một ngày.
**Nhiệm vụ của bạn:**
1. Đọc code {{ProductService.getPrice}} và {{setPrice}}, tìm vì sao giá cũ lại về lại cache sau khi đã xóa.
2. Sửa để: đọc chỉ ghi vào cache khi phiên bản sản phẩm chưa đổi; ghi cập nhật DB tăng phiên bản rồi xóa cache; cache có TTL ngắn làm phòng tuyến cuối cùng.
3. Test mô phỏng race xác định bằng latch: đọc choke ở giữa (sau khi đọc DB, trước khi ghi cache), ghi mới xong rồi đọc tiếp → cache không được chứa giá cũ.`,
  artifacts: [
    { name: 'product-service.log', lang: 'text', content: `2026-11-26 10:15:02.301 INFO  ProductService : getPrice P-1001 cache=MISS db=100000
2026-11-26 10:15:02.310 INFO  AdminService : setPrice P-1001 100000 -> 200000 (db updated)
2026-11-26 10:15:02.312 INFO  AdminService : cache evicted P-1001
2026-11-26 10:15:02.315 INFO  ProductService : put cache P-1001 = 100000 (stale, read before update)
2026-11-26 10:15:05.100 INFO  ProductService : getPrice P-1001 cache=HIT 100000 (KHÔNG đúng, db=200000)` },
    { name: 'audit-2026-11-26.txt', lang: 'text', content: `KIỂM TOÁN GIÁ 2026-11-26
Sản phẩm P-1001: giá DB = 200000, giá cache = 100000
Đơn hàng dưới giá: 450 đơn × chênh lệch 100000 = 45.000.000
Nguyên nhân nghi ngờ: race giữa đọc cache và xóa cache sau cập nhật` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng DB + cache, KHÔNG cần sửa) =====
class CacheEntry {
    final long value;
    final long expiryMs;
    CacheEntry(long value, long expiryMs) { this.value = value; this.expiryMs = expiryMs; }
}

class FakeClock {
    long millis;
    FakeClock(long millis) { this.millis = millis; }
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

// ===== Code cần sửa =====
class ProductService {
    final Map<String, Long> db = new HashMap<>();
    final Map<String, CacheEntry> cache = new HashMap<>();
    final FakeClock clock;
    final long ttlMs = 60_000;
    // Test hook: choke đọc giữa khi đọc DB xong và trước khi ghi cache
    volatile Runnable onBeforePut;
    ProductService(FakeClock clock) { this.clock = clock; }

    long now() { return clock.millis(); }

    /** Đọc giá sản phẩm. Cache miss thì đọc DB và ghi vào cache. */
    long getPrice(String id) {
        long now = now();
        CacheEntry e = cache.get(id);
        if (e != null && e.expiryMs > now) return e.value;
        long price = db.get(id);
        if (onBeforePut != null) onBeforePut.run();   // choke để test race
        cache.put(id, new CacheEntry(price, now + ttlMs));  // BUG: không kiểm tra phiên bản
        return price;
    }

    /** Cập nhật giá sản phẩm: ghi DB rồi xóa cache. */
    void setPrice(String id, long price) {
        db.put(id, price);        // cập nhật DB
        cache.remove(id);         // xóa cache SAU db (delete-after-commit)
        // Vẫn không đủ: đọc đang chạy có thể ghi giá cũ về cache sau này
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        // 1. Cập nhật rồi đọc: phải thấy giá mới
        FakeClock c1 = new FakeClock(0);
        ProductService s1 = new ProductService(c1);
        s1.db.put("P-1", 100L);
        s1.setPrice("P-1", 200L);
        check("doc_sau_cap_nhat", s1.getPrice("P-1") == 200L,
            "sau setPrice 200, getPrice phải trả 200, thực tế " + s1.getPrice("P-1"));

        // 2. Đọc lần 2 từ cache: không đọc lại DB
        FakeClock c2 = new FakeClock(0);
        ProductService s2 = new ProductService(c2);
        s2.db.put("P-2", 100L);
        long first = s2.getPrice("P-2");
        s2.db.put("P-2", 999L);   // thay DB, cache chưa xóa
        long second = s2.getPrice("P-2");
        check("doc_lan_2_lay_cache", first == 100L && second == 100L,
            "lần 2 phải lấy từ cache = 100, thực tế first=" + first + " second=" + second);

        // 3. Race: đọc choke giữa đọc DB và ghi cache, ghi mới xong rồi đọc tiếp
        FakeClock c3 = new FakeClock(0);
        ProductService s3 = new ProductService(c3);
        s3.db.put("P-3", 100L);
        CountDownLatch gate = new CountDownLatch(1);
        final long[] result = new long[1];
        s3.onBeforePut = () -> { try { gate.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } };
        Thread reader = new Thread(() -> result[0] = s3.getPrice("P-3"));
        reader.start();
        Thread.sleep(40);              // chờ reader vào gate
        s3.setPrice("P-3", 200L);      // ghi mới: db=200, cache xóa
        gate.countDown();              // giải phóng reader: reader ghi giá cũ 100 vào cache
        reader.join();
        long after = s3.getPrice("P-3");  // gọi lại: nếu cache bị lỗi thì trả 100
        check("race_khong_luu_gia_cu", after == 200L,
            "sau race, getPrice phải trả 200 (không được chứa giá cũ 100), thực tế " + after);

        // 4. TTL hết hạn: đọc lại từ DB, không giữ cache vĩnh viễn
        FakeClock c4 = new FakeClock(0);
        ProductService s4 = new ProductService(c4);
        s4.db.put("P-4", 100L);
        s4.getPrice("P-4");            // vào cache, hết hạn sau 60s
        c4.advance(61_000);            // quá TTL
        s4.db.put("P-4", 200L);
        check("ttl_het_han_doc_lai_db", s4.getPrice("P-4") == 200L,
            "quá TTL phải đọc lại DB = 200, thực tế " + s4.getPrice("P-4"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class CacheEntry {
    final long value;
    final long expiryMs;
    final long version;   // phiên bản DB lúc ghi vào cache
    CacheEntry(long value, long expiryMs, long version) {
        this.value = value; this.expiryMs = expiryMs; this.version = version;
    }
}

class FakeClock {
    long millis;
    FakeClock(long millis) { this.millis = millis; }
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

class ProductService {
    final Map<String, Long> db = new HashMap<>();
    final Map<String, Long> dbVersion = new HashMap<>();   // phiên bản mỗi sản phẩm
    final Map<String, CacheEntry> cache = new HashMap<>();
    final FakeClock clock;
    final long ttlMs = 60_000;
    volatile Runnable onBeforePut;
    ProductService(FakeClock clock) { this.clock = clock; }

    long now() { return clock.millis(); }

    long getPrice(String id) {
        long now = now();
        CacheEntry e = cache.get(id);
        long ver = dbVersion.getOrDefault(id, 0L);
        if (e != null && e.expiryMs > now && e.version == ver) return e.value;
        long price = db.get(id);
        long readVer = dbVersion.getOrDefault(id, 0L);
        if (onBeforePut != null) onBeforePut.run();
        long curVer = dbVersion.getOrDefault(id, 0L);
        // Chỉ ghi cache nếu phiên bản không đổi giữa khi đọc và khi ghi
        if (curVer == readVer) {
            cache.put(id, new CacheEntry(price, now + ttlMs, curVer));
        }
        return price;
    }

    void setPrice(String id, long price) {
        db.put(id, price);
        long v = dbVersion.getOrDefault(id, 0L);
        dbVersion.put(id, v + 1);     // tăng phiên bản
        cache.remove(id);             // xóa cache sau khi db đã đổi
    }
}`,
  hints: [
    'Nhìn log: đọc P-1001 thấy 100000, rồi admin cập nhật 200000 và xóa cache, nhưng đọc cũ lại ghi 100000 về cache sau đó.',
    'Xóa cache sau khi cập nhật DB (delete-after-commit) vẫn không đủ: một luồng đọc đang xử lý có thể ghi giá cũ vào cache sau khi cache đã bị xóa.',
    'Thêm phiên bản cho mỗi sản phẩm. Đọc ghi vào cache chỉ khi phiên bản DB không đổi giữa hai thời điểm. TTL ngắn làm phòng tuyến cuối cùng.',
  ],
  rootCause: `**Race giữa đọc cache và xóa cache.** Luồng đọc A cache-miss, đọc DB thấy {{giá=100000 phiên bản=0}}. Luồng ghi B cập nhật DB thành {{200000 phiên bản=1}} rồi xóa cache. Sau đó A tiếp tục, **ghi {{100000 phiên bản=0}} vào cache** dựa trên dữ liệu đã cũ. Tiếp theo mọi đọc cache-hit đều thấy 100000 bất chấp DB đã 200000. Xóa cache sau commit (delete-after-commit) không ngăn được điều này vì luồng đọc bắt đầu trước khi xóa, nhưng kết thúc sau khi xóa.`,
  fix: `### Cách sửa trong bài
Mỗi sản phẩm giữ phiên bản {{dbVersion}}. Đọc giá: lấy phiên bản DB lúc đọc, chỉ ghi vào cache nếu phiên bản DB chưa đổi sau khi đọc xong. Cập nhật giá: tăng phiên bản DB rồi xóa cache.
~~~java
long getPrice(String id) {
    long now = now();
    CacheEntry e = cache.get(id);
    long ver = dbVersion.getOrDefault(id, 0L);
    if (e != null && e.expiryMs > now && e.version == ver) return e.value;
    long price = db.get(id);
    long readVer = dbVersion.getOrDefault(id, 0L);
    if (onBeforePut != null) onBeforePut.run();
    long curVer = dbVersion.getOrDefault(id, 0L);
    if (curVer == readVer) {
        cache.put(id, new CacheEntry(price, now + ttlMs, curVer));
    }
    return price;
}
~~~
Lợi điểm: nếu có ghi mới xen vào giữa, đọc cũ không ghi vào cache. TTL ngắn (60 giây) đảm bảo giá cuối cùng cũng tự sửa sau một khoảng thời gian ngắn nếu race lách qua.

### Trên production thật (Redis)
- **Cache-aside đúng đọc**: đọc cache, miss thì đọc DB, ghi cache kèm version/timestamp.
- **Xóa cache sau khi DB commit** (không phải trước), tránh cửa sổ đọc giá cũ.
- **Double delete**: xóa cache trước và sau cập nhật, cách nhau vài trăm mili giây, để invalidate bản giá cũ bị ghi lại bởi đọc muộn.
- **TTL ngắn** làm phòng tuyến cuối cùng: dù race xảy ra, cache cũng tự hết hạn sau vài phút.
- Dùng Redis WATCH/MULTI hoặc Lua script để atomic hóa kiểm tra version trước khi ghi cache.

### Phòng ngừa
- Review code tìm mẫu "đọc DB, sau đó ghi cache" không kiểm tra version/timestamp.
- Giá tiền/tồn kho luôn kèm TTL ngắn và kiểm tra version trước khi ghi cache.
- Test race phải choke giữa đọc DB và ghi cache (như bài), không chỉ test tuần tự.

### Liên hệ phỏng vấn
Câu "cache bị dữ liệu cũ sau update" xuất hiện thường. Hãy trả lời theo thứ tự: race condition giữa đọc và xóa cache, tại sao delete-after-commit vẫn không đủ, version/timestamp hoặc double delete, và TTL ngắn là phòng tuyến cuối cùng.

> Senior tip: Không có chiến lược cache-invalidation nào hoàn hảo 100% trong distributed system. Luồng an toàn nhất là TTL ngắn + xóa cache sau commit + version check. Không bao giờ tin cache vĩnh viễn đối với dữ liệu thay đổi.`,
  related: [],
  tags: ['cache', 'race condition', 'cache invalidation', 'version', 'TTL', 'Redis', 'stale data']
},
{
  id: 'bug-044',
  title: 'Nhân viên xử lý đơn lâu hơn thời hạn giao nhiệm vụ: đơn bị nhận lại và xử lý 2 lần',
  domain: 'Lập lịch nhiệm vụ / Phân phối công việc',
  level: 'senior',
  severity: 'P1',
  minutes: 25,
  story: `**Bối cảnh dự án:** Hệ thống {{TaskScheduler}} phân phối đơn xử lý cho nhiều nhân viên (worker). Mỗi đơn khi được nhận sẽ có thời hạn giao (lease) 30 giây. Nhân viên xử lý đơn thì phải hoàn thành trước khi hết hạn; nếu hết hạn, đơn về trạng thái mở và nhân viên khác có thể nhận lại.
**Sự cố:** Đơn {{T-7712}} được nhân viên A nhận vào 10:00:00, hạn đến 10:00:30. Nhiệm vụ gọi API bên ngoài bị chậm, nhân viên A xử lý đến 10:00:35 (vượt hạn 5 giây). Đến 10:00:30, hạn giao hết, đơn về mở. Nhân viên B nhận đơn cùng lúc 10:00:30. Cả A và B cùng hoàn thành đơn → **đơn được xử lý 2 lần**, khách bị trừ tiền 2 lần. Lỗi phát hiện qua đối soát thanh toán.
**Nhiệm vụ của bạn:**
1. Đọc code {{Scheduler.claim}} và {{complete}}, tìm vì sao nhân viên A sau khi vượt hạn vẫn có thể hoàn thành, và nhân viên B cũng nhận được đơn.
2. Sửa để: (a) nhân viên có thể **gia hạn hạn giao** khi đang xử lý (heartbeat); (b) mỗi lần nhận giao nhận một **mã chặn (fencing token)** tăng dần, chỉ nhân viên sở hữu mã mới nhất được phép hoàn thành.
3. Test bằng đồng hồ giả (Clock): tiến đồng hồ vượt hạn mà không gia hạn → nhân viên khác nhận lại; sau đó nhân viên cũ với mã cũ không được hoàn thành.`,
  artifacts: [
    { name: 'task-scheduler.log', lang: 'text', content: `2026-11-27 10:00:00.000 INFO  Scheduler : claim T-7712 by worker-A token=1 leaseUntil=10:00:30
2026-11-27 10:00:28.000 INFO  Worker-A  : calling external API (slow, ~15s)
2026-11-27 10:00:30.000 INFO  Scheduler : lease T-7712 EXPIRED (worker-A)
2026-11-27 10:00:30.500 INFO  Scheduler : claim T-7712 by worker-B token=2 leaseUntil=10:01:00
2026-11-27 10:00:35.000 INFO  Worker-A  : completed T-7712 token=1   <-- STALE, should be rejected
2026-11-27 10:00:36.000 INFO  Worker-B  : completed T-7712 token=2
2026-11-27 10:00:36.500 ERROR Payment : duplicate charge for order T-7712` },
    { name: 'audit-2026-11-27.txt', lang: 'text', content: `KIỂM TOÁN THANH TOÁN 2026-11-27
Đơn T-7712: hoàn thành bởi worker-A (token=1) và worker-B (token=2)
Khách bị trừ tiền 2 lần: 2 × 1.200.000 = 2.400.000
Nguyên nhân: worker-A xử lý vượt hạn giao, không có heartbeat gia hạn, không có fencing token` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng nhân viên + đồng hồ, KHÔNG cần sửa) =====
class TaskRecord {
    final String id;
    String owner;
    long leaseUntil;
    long token;
    String status; // "open" | "completed"
    TaskRecord(String id) { this.id = id; this.status = "open"; }
}

class FakeClock {
    long millis;
    FakeClock(long millis) { this.millis = millis; }
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

// ===== Code cần sửa =====
class Scheduler {
    final Map<String, TaskRecord> tasks = new HashMap<>();
    final FakeClock clock;
    final long leaseMs = 30_000;
    Scheduler(FakeClock clock) { this.clock = clock; }
    long now() { return clock.millis; }

    /** Nhận đơn: nếu đơn mở hoặc hạn đã hết, gán cho nhân viên và trả token. */
    Long claim(String taskId, String workerId) {
        TaskRecord t = tasks.get(taskId);
        if (t == null) { t = new TaskRecord(taskId); tasks.put(taskId, t); }
        if (!"open".equals(t.status)) return null;
        if (t.owner != null && t.leaseUntil > now()) return null;   // vẫn đang giao cho ai đó
        t.owner = workerId;
        t.token = (t.token == 0 ? 1 : t.token + 1);
        t.leaseUntil = now() + leaseMs;
        return t.token;
    }

    /** Gia hạn hạn giao (heartbeat). Trong starter: không làm gì. */
    void renew(String taskId, String workerId, long token) {
        // BUG: không gia hạn, hết hạn vẫn hết hạn
    }

    /** Hoàn thành đơn. Trong starter: không kiểm tra token, nên nhân viên cũ vẫn hoàn thành được. */
    boolean complete(String taskId, String workerId, long token) {
        TaskRecord t = tasks.get(taskId);
        if (t == null || !t.owner.equals(workerId)) return false;   // BUG: không kiểm tra token
        if (!"open".equals(t.status)) return false;
        t.status = "completed";
        return true;
    }

    boolean isLeaseValid(String taskId) {
        TaskRecord t = tasks.get(taskId);
        return t != null && t.owner != null && t.leaseUntil > now();
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        // 1. Claim và complete bình thường: nhân viên nhận và hoàn thành
        FakeClock c1 = new FakeClock(0);
        Scheduler s1 = new Scheduler(c1);
        TaskRecord t1 = new TaskRecord("T-1"); s1.tasks.put("T-1", t1);
        Long tok1 = s1.claim("T-1", "worker-A");
        check("claim_tra_ma", tok1 != null && tok1 == 1,
            "claim phải trả token 1, thực tế " + tok1);
        boolean done1 = s1.complete("T-1", "worker-A", tok1);
        check("hoan_tat_nhan_vien_chinh", done1 && "completed".equals(t1.status),
            "nhân viên A phải hoàn thành được, thực tế done=" + done1 + " status=" + t1.status);

        // 2. Hết hạn, nhân viên khác nhận lại được
        FakeClock c2 = new FakeClock(0);
        Scheduler s2 = new Scheduler(c2);
        TaskRecord t2 = new TaskRecord("T-2"); s2.tasks.put("T-2", t2);
        Long tokA = s2.claim("T-2", "worker-A");  // token=1, hạn 30s
        c2.advance(35_000);                        // vượt hạn 30s
        Long tokB = s2.claim("T-2", "worker-B");  // worker B nhận lại, token=2
        check("het_han_nhan_lai", tokB != null && tokB == 2 && "worker-B".equals(t2.owner),
            "sau hết hạn worker B phải nhận lại được, thực tế tokB=" + tokB + " owner=" + t2.owner);

        // 3. Fencing: nhận lại sau hết hạn tạo token mới, token cũ không được hoàn thành
        FakeClock c3 = new FakeClock(0);
        Scheduler s3 = new Scheduler(c3);
        TaskRecord t3 = new TaskRecord("T-3"); s3.tasks.put("T-3", t3);
        Long tokA1 = s3.claim("T-3", "worker-A");  // token=1
        c3.advance(35_000);                         // hết hạn
        Long tokA2 = s3.claim("T-3", "worker-A");  // token=2 (nhận lại)
        check("nhan_lai_token_moi", tokA2 != null && tokA2 == 2,
            "sau hết hạn, nhận lại phải tạo token 2, thực tế " + tokA2);
        boolean oldDone = s3.complete("T-3", "worker-A", tokA1);  // token=1 cũ
        check("fencing_token_cu", !oldDone && "open".equals(t3.status),
            "nhân viên A token cũ phải bị từ chối, thực tế oldDone=" + oldDone);
        boolean newDone = s3.complete("T-3", "worker-A", tokA2);  // token=2 mới
        check("fencing_token_moi", newDone && "completed".equals(t3.status),
            "nhân viên A token mới phải hoàn thành được, thực tế newDone=" + newDone);

        // 4. Heartbeat gia hạn hạn giao: renew trước hết hạn, hạn được kéo dài
        FakeClock c4 = new FakeClock(0);
        Scheduler s4 = new Scheduler(c4);
        TaskRecord t4 = new TaskRecord("T-4"); s4.tasks.put("T-4", t4);
        Long tok4 = s4.claim("T-4", "worker-A");  // hạn 30s
        c4.advance(25_000);                        // sắp hết hạn
        s4.renew("T-4", "worker-A", tok4);         // heartbeat gia hạn thêm 30s
        c4.advance(10_000);                        // tổng 35s, quá hạn cũ nhưng chưa hết hạn mới
        check("con_da_gia_han", s4.isLeaseValid("T-4"),
            "sau renew, hạn giao vẫn còn hiệu lực tại 35s, thực tế valid=" + s4.isLeaseValid("T-4"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class TaskRecord {
    final String id;
    String owner;
    long leaseUntil;
    long token;
    String status; // "open" | "completed"
    TaskRecord(String id) { this.id = id; this.status = "open"; }
}

class FakeClock {
    long millis;
    FakeClock(long millis) { this.millis = millis; }
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

class Scheduler {
    final Map<String, TaskRecord> tasks = new HashMap<>();
    final FakeClock clock;
    final long leaseMs = 30_000;
    Scheduler(FakeClock clock) { this.clock = clock; }
    long now() { return clock.millis; }

    Long claim(String taskId, String workerId) {
        TaskRecord t = tasks.get(taskId);
        if (t == null) { t = new TaskRecord(taskId); tasks.put(taskId, t); }
        if (!"open".equals(t.status)) return null;
        if (t.owner != null && t.leaseUntil > now()) return null;
        t.owner = workerId;
        t.token = (t.token == 0 ? 1 : t.token + 1);
        t.leaseUntil = now() + leaseMs;
        return t.token;
    }

    void renew(String taskId, String workerId, long token) {
        TaskRecord t = tasks.get(taskId);
        if (t != null && t.owner.equals(workerId) && t.token == token) {
            t.leaseUntil = now() + leaseMs;   // FIX: gia hạn hạn giao
        }
    }

    boolean complete(String taskId, String workerId, long token) {
        TaskRecord t = tasks.get(taskId);
        if (t == null || !t.owner.equals(workerId) || t.token != token) return false;  // FIX: kiểm tra token
        if (!"open".equals(t.status)) return false;
        t.status = "completed";
        return true;
    }

    boolean isLeaseValid(String taskId) {
        TaskRecord t = tasks.get(taskId);
        return t != null && t.owner != null && t.leaseUntil > now();
    }
}`,
  hints: [
    'Nhìn log: worker-A nhận token=1, hạn đến 10:00:30. Hết hạn, worker-B nhận token=2. Sau đó worker-A vẫn hoàn thành với token=1 vì code không kiểm tra token.',
    'Fencing token tăng dần mỗi lần nhận giao. Chỉ người sở hữu token mới nhất được phép hoàn thành; token cũ bị từ chối.',
    'Nhân viên xử lý lâu cần gọi renew (heartbeat) để kéo dài hạn giao trước khi hết hạn.',
  ],
  rootCause: `**Không có fencing token và không có heartbeat gia hạn.** worker-A nhận đơn {{T-7712}} với {{token=1}} và hạn {{10:00:30}}. Xử lý kéo dài đến {{10:00:35}}, vượt hạn. Hết hạn, đơn về mở, worker-B nhận với {{token=2}}. Code complete chỉ kiểm tra owner, không kiểm tra token, nên worker-A với token cũ vẫn hoàn thành được. Hai nhân viên cùng xử lý một đơn → tính toán lại 2 lần, trừ tiền 2 lần. Còn thiếu renew: worker-A không có cách nào kéo dài hạn giao khi đang xử lý.`,
  fix: `### Cách sửa trong bài
Thêm hai cơ chế: (1) renew kéo dài hạn giao khi nhân viên đang xử lý (heartbeat); (2) complete kiểm tra token khớp với token hiện tại của đơn (fencing), token cũ bị từ chối.
~~~java
void renew(String taskId, String workerId, long token) {
    TaskRecord t = tasks.get(taskId);
    if (t != null && t.owner.equals(workerId) && t.token == token) {
        t.leaseUntil = now() + leaseMs;
    }
}

boolean complete(String taskId, String workerId, long token) {
    TaskRecord t = tasks.get(taskId);
    if (t == null || !t.owner.equals(workerId) || t.token != token) return false;
    if (!"open".equals(t.status)) return false;
    t.status = "completed";
    return true;
}
~~~
Khi worker-A xử lý lâu, gọi renew định kỳ để kéo hạn. Nếu worker-A treo và hết hạn, worker-B nhận được với token mới (2); sau đó worker-A thức lại và gọi complete với token cũ (1) bị từ chối.

### Trên production thật
- **Fencing token**: mỗi lần nhận nhiệm vụ gán token tăng dần (ví dụ số tăng trong Redis/ZooKeeper). Bất kỳ tác động bên ghi (cập nhật DB, gọi API thanh toán) phải kèm token, hệ thống đích chỉ chấp nhận token mới nhất đã xem.
- **Heartbeat renewal**: nhân viên gia hạn hạn giao định kỳ (ví dụ mỗi 10 giây cho hạn 30 giây). Nếu không heartbeat trong 2 chu kỳ, hệ thống coi như người xử lý đã mất và gán lại.
- **Idempotent handler**: ngay cả với fencing, xử lý bên dưới nên idempotent (unique key trên order_id) vì message có thể được giao lại ở least-once.
- Thời hạn giao nên ngắn hơn timeout xử lý dự kiến, và có timeout toàn bộ để không treo mãi.

### Phòng ngừa
- Mọi phân phối công việc có thời hạn giao phải có fencing token và heartbeat.
- Review code tìm mẫu "nhận việc, xử lý lâu, hoàn thành" không kiểm tra token hoặc hạn giao.
- Thiết kế xử lý idempotent từ đầu: cùng mã đơn chỉ tính toán một lần dù nhận nhiều lần.

### Liên hệ phỏng vấn
Câu "phân phối công việc, xử lý lâu hơn hạn giao" xuất hiện ở vòng hệ thống phân tán. Trả lời: fencing token, heartbeat renewal, idempotent handler, và tại sao owner-check đơn giản là không đủ.

> Senior tip: Fencing token chỉ hữu ích nếu hệ thống bên nhận (DB, API thanh toán) cũng kiểm tra token. Chỉ kiểm tra ở scheduler thì worker cũ vẫn có thể gọi trực tiếp API bên nhận. Token phải đi cùng mọi tác động ghi.`,
  related: [],
  tags: ['lease', 'fencing token', 'heartbeat', 'distributed lock', 'double processing', 'task scheduler']
},
{
  id: 'bug-045',
  title: 'OEE nhà máy vượt 100%: cộng trùng message gateway gửi lại và lệch đơn vị phút/giây',
  domain: 'Sản xuất / Chỉ số thiết bị (OEE)',
  level: 'senior',
  severity: 'P2',
  minutes: 25,
  story: `**Bối cảnh dự án:** Nhà máy thực phẩm có 40 dây chuyền đóng gói. Mỗi máy gắn một gateway (thiết bị nhỏ đọc bộ đếm sản phẩm của PLC — bộ điều khiển lập trình của máy — mỗi 5 giây) rồi gửi một message sản lượng lên Kafka. Service {{OeeService}} cộng dồn các message để tính OEE cho dashboard giám sát.

**OEE là gì:** OEE (Overall Equipment Effectiveness — hiệu suất tổng thể thiết bị) là chỉ số 0–100% đo một máy "hữu ích" đến đâu, là tích của ba thành phần:
- **Availability** (độ sẵn sàng) = thời gian máy thực chạy / thời gian sản xuất kế hoạch.
- **Performance** (hiệu suất tốc độ) = (chu kỳ lý tưởng × tổng sản phẩm) / thời gian máy chạy. Chu kỳ lý tưởng là thời gian máy hoàn hảo cần để làm một sản phẩm (ở đây 2 giây).
- **Quality** (chất lượng) = sản phẩm đạt / tổng sản phẩm.
Ví dụ máy M-1 chạy 27.000 giây trong ca kế hoạch 28.800 giây, làm 12.300 sản phẩm (trong đó 12.000 đạt): Availability 93,75%, Performance 91,11%, Quality 97,56% → OEE ≈ **83,3%**. Không thành phần nào được vượt 100%.

**Sự cố:** Dashboard hiển thị OEE máy M-1 là **5.000%**. Ban đầu mọi người tưởng lỗi hiển thị nên bỏ qua nhiều tuần; khi audit mới thấy hai nguyên nhân: gateway gửi "ít nhất một lần" (at-least-once) nên khi mạng chập chờn cùng một message bị gửi lại và service cộng trùng; đồng thời thời gian kế hoạch lưu bằng **phút** nhưng code lại chia cho thời gian chạy tính bằng **giây**, lệch 60 lần.
**Nhiệm vụ của bạn:**
1. Đọc {{OeeService.onMessage}} và {{OeeService.compute}}, tìm hai chỗ làm OEE vượt 100%.
2. Sửa để message gửi lặp không bị cộng hai lần (dedup theo {{machineId}} + {{seq}}) và quy đổi đơn vị thời gian cho đúng.
3. Bấm **Chạy test**: test nạp 4.100 message, gửi lặp 1.000 message, và kiểm tra OEE ra đúng 83,3% cùng các trường hợp lệch thứ tự, máy chưa có sản lượng.`,
  artifacts: [
    { name: 'oee-consumer.log', lang: 'text', content: `2026-11-18 08:41:11.902 INFO  oee-gw-bridge  : M-1 seq=2001 publish ack timeout -> resend in 40ms
2026-11-18 08:41:12.004 INFO  oee-consumer-3 : recv M-1 seq=2001 good=3 scrap=0 offset=9184421
2026-11-18 08:41:12.044 INFO  oee-consumer-5 : recv M-1 seq=2001 good=3 scrap=0 offset=9184422
2026-11-18 08:41:12.047 DEBUG oee-service    : add M-1 seq=2001 total=11214 (không kiểm tra seq)
2026-11-18 08:41:12.049 DEBUG oee-service    : add M-1 seq=2001 total=11217 (cộng lần 2)
2026-11-18 08:41:15.301 WARN  oee-service    : OEE M-1 availability=5625.0% performance=113.3% quality=78.4% oee=5000.0%
2026-11-18 08:41:15.302 INFO  oee-service    : inputs plannedProductionTime=480 MINUTES runTime=27000 SECONDS idealCycle=2 SECONDS
2026-11-18 08:41:15.480 WARN  oee-consumer-5 : consumer group rebalance: partition 7 reassigned 9184300..9184500 replayed` },
    { name: 'oee-audit-2026-11-18.txt', lang: 'text', content: `BIÊN BẢN KIỂM TRA CHỈ SỐ OEE — 18/11/2026
Máy M-1, ca 06:00-14:00 (kế hoạch 480 phút = 28.800 giây)
Số liệu đối chiếu lấy từ MES (hệ thống điều hành sản xuất), KHÔNG lấy từ gateway:
  Thời gian máy chạy thực : 27.000 giây (7 giờ 30 phút)
  Sản phẩm đạt            : 12.000
  Phế phẩm                : 300
  Tổng sản phẩm           : 12.300
  Chu kỳ lý tưởng         : 2 giây/sản phẩm

OEE đúng  : 93,75% x 91,11% x 97,56% = 83,3%
OEE dashboard: 5.000%  (sai 60 lần)

Ghi chú của đội gateway:
  - Gateway cấp seq tăng dần riêng cho từng máy, gửi "ít nhất một lần" (có thể gửi lại).
  - Trong ca có 1.000 message bị gửi lặp (ack timeout + consumer rebalance), mỗi message 3 sản phẩm đạt.
  - Nếu không chống trùng, sản lượng bị thổi lên 15.300 (thừa 3.000 sản phẩm).` },
  ],
  starter: `// ===== Hạ tầng (đã có trong dự án, KHÔNG cần sửa) =====
/** Một message sản lượng gateway gửi lên; seq tăng dần theo từng máy, gateway gửi "ít nhất một lần". */
class ProdMessage {
    final String machineId;
    final long seq;      // số thứ tự do gateway cấp cho từng máy
    final long good;     // sản phẩm đạt trong cửa sổ 5 giây
    final long scrap;    // phế phẩm trong cửa sổ 5 giây
    ProdMessage(String machineId, long seq, long good, long scrap) {
        this.machineId = machineId; this.seq = seq; this.good = good; this.scrap = scrap;
    }
}

/** Kết quả OEE; mỗi thành phần là tỉ lệ 0..1. */
class OeeResult {
    final double availability, performance, quality, oee;
    OeeResult(double a, double p, double q, double o) {
        availability = a; performance = p; quality = q; oee = o;
    }
}

// ===== Code cần sửa =====
class OeeService {
    /** Chu kỳ lý tưởng của máy: 1 sản phẩm mất 2 giây khi máy chạy hoàn hảo. */
    static final double IDEAL_CYCLE_SECONDS = 2.0;

    static class MachineState {
        long total;       // tổng sản phẩm (đạt + phế)
        long good;        // sản phẩm đạt
        long duplicates;  // số message bị coi là gửi lặp
    }

    private final Map<String, MachineState> machines = new HashMap<>();

    /** Xử lý một message từ gateway. Trả về true nếu message được tính vào sản lượng. */
    boolean onMessage(ProdMessage m) {
        MachineState st = machines.computeIfAbsent(m.machineId, k -> new MachineState());
        st.total += m.good + m.scrap;      // BUG 1: không kiểm tra seq đã xử lý chưa
        st.good += m.good;
        return true;
    }

    /** plannedMinutes: thời gian sản xuất kế hoạch (phút). runSeconds: thời gian máy thực chạy (giây). */
    OeeResult compute(String machineId, long plannedMinutes, long runSeconds) {
        MachineState st = machines.getOrDefault(machineId, new MachineState());
        if (st.total == 0 || runSeconds <= 0) return new OeeResult(0, 0, 0, 0);
        double availability = (double) runSeconds / plannedMinutes;   // BUG 2: giây chia phút
        double performance = (IDEAL_CYCLE_SECONDS * st.total) / runSeconds;
        double quality = (double) st.good / st.total;
        return new OeeResult(availability, performance, quality, availability * performance * quality);
    }

    long total(String machineId) { return machines.getOrDefault(machineId, new MachineState()).total; }
    long duplicates(String machineId) { return machines.getOrDefault(machineId, new MachineState()).duplicates; }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static final long PLANNED_MINUTES = 480;   // ca 8 giờ
    static final long RUN_SECONDS = 27_000;    // máy chạy 7,5 giờ

    /** Nạp 4.000 message good=3 rồi 100 message scrap=3: tổng 12.300, đạt 12.000. */
    static void feed(OeeService svc) {
        long seq = 1;
        for (int i = 0; i < 4000; i++) svc.onMessage(new ProdMessage("M-1", seq++, 3, 0));
        for (int i = 0; i < 100; i++) svc.onMessage(new ProdMessage("M-1", seq++, 0, 3));
    }

    static boolean near(double a, double b) { return Math.abs(a - b) < 0.001; }

    public static void main(String[] args) {
        // 1. Không gửi lặp: đúng số liệu MES -> OEE 83,3%
        OeeService s1 = new OeeService();
        feed(s1);
        OeeResult r1 = s1.compute("M-1", PLANNED_MINUTES, RUN_SECONDS);
        check("oee_dung_khi_khong_gui_lap",
            near(r1.availability, 0.9375) && near(r1.performance, 0.9111) && near(r1.quality, 0.9756) && near(r1.oee, 0.8334),
            "kỳ vọng A=0,9375 P=0,9111 Q=0,9756 OEE=0,8334; thực tế A=" + r1.availability
                + " P=" + r1.performance + " Q=" + r1.quality + " OEE=" + r1.oee);

        // 2. Gateway gửi lại 1.000 message đã xử lý: không được cộng thêm
        OeeService s2 = new OeeService();
        feed(s2);
        for (int i = 1; i <= 1000; i++) s2.onMessage(new ProdMessage("M-1", i, 3, 0));   // gửi lặp seq 1..1000
        OeeResult r2 = s2.compute("M-1", PLANNED_MINUTES, RUN_SECONDS);
        check("gui_lai_khong_cong_trung",
            s2.total("M-1") == 12_300 && s2.duplicates("M-1") == 1000 && near(r2.oee, 0.8334),
            "kỳ vọng tổng 12300, 1000 bản trùng, OEE 0,8334; thực tế tổng " + s2.total("M-1")
                + ", trùng " + s2.duplicates("M-1") + ", OEE " + r2.oee);

        // 3. Đơn vị: availability phải là 0,9375 chứ không phải 56,25
        check("don_vi_phut_va_giay",
            near(r1.availability, 0.9375) && r1.availability <= 1.0,
            "availability phải là 0,9375 (27000 giây / 28800 giây), thực tế " + r1.availability);

        // 4. Message đến lệch thứ tự (seq 3 trước seq 2): không được mất sản lượng, vẫn chặn bản lặp
        OeeService s4 = new OeeService();
        s4.onMessage(new ProdMessage("M-2", 1, 10, 0));
        s4.onMessage(new ProdMessage("M-2", 3, 10, 0));
        s4.onMessage(new ProdMessage("M-2", 2, 10, 0));
        s4.onMessage(new ProdMessage("M-2", 3, 10, 0));   // gửi lặp
        check("lech_thu_tu_khong_mat_san_luong",
            s4.total("M-2") == 30 && s4.duplicates("M-2") == 1,
            "kỳ vọng tổng 30 (không mất seq 2) và 1 bản trùng; thực tế tổng " + s4.total("M-2")
                + ", trùng " + s4.duplicates("M-2"));

        // 5. Máy chưa có sản lượng: OEE 0, không chia cho 0
        OeeService s5 = new OeeService();
        OeeResult r5 = s5.compute("M-9", PLANNED_MINUTES, RUN_SECONDS);
        check("chua_co_san_luong", r5.oee == 0.0 && r5.availability == 0.0,
            "máy chưa có message phải ra 0 và không chia cho 0, thực tế " + r5.oee);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class ProdMessage {
    final String machineId;
    final long seq;
    final long good;
    final long scrap;
    ProdMessage(String machineId, long seq, long good, long scrap) {
        this.machineId = machineId; this.seq = seq; this.good = good; this.scrap = scrap;
    }
}

class OeeResult {
    final double availability, performance, quality, oee;
    OeeResult(double a, double p, double q, double o) {
        availability = a; performance = p; quality = q; oee = o;
    }
}

class OeeService {
    static final double IDEAL_CYCLE_SECONDS = 2.0;
    /** Cửa sổ chống trùng: đủ cho vài giờ gửi lại, có hạn để bộ nhớ không phình mãi. */
    static final int DEDUP_WINDOW = 50_000;

    static class MachineState {
        final Set<Long> appliedSeq = new LinkedHashSet<>();   // các seq đã cộng vào sản lượng
        long total, good, duplicates;
    }

    private final Map<String, MachineState> machines = new HashMap<>();

    boolean onMessage(ProdMessage m) {
        MachineState st = machines.computeIfAbsent(m.machineId, k -> new MachineState());
        if (!st.appliedSeq.add(m.seq)) {          // seq đã có trong cửa sổ -> bản gửi lặp
            st.duplicates++;
            return false;
        }
        if (st.appliedSeq.size() > DEDUP_WINDOW) {   // quên seq cũ nhất, giữ cửa sổ có hạn
            Iterator<Long> it = st.appliedSeq.iterator();
            it.next();
            it.remove();
        }
        st.total += m.good + m.scrap;
        st.good += m.good;
        return true;
    }

    OeeResult compute(String machineId, long plannedMinutes, long runSeconds) {
        MachineState st = machines.getOrDefault(machineId, new MachineState());
        long plannedSeconds = plannedMinutes * 60L;   // quy đổi về CÙNG đơn vị giây
        if (st.total == 0 || runSeconds <= 0 || plannedSeconds <= 0) return new OeeResult(0, 0, 0, 0);
        double availability = (double) runSeconds / plannedSeconds;
        double performance = (IDEAL_CYCLE_SECONDS * st.total) / runSeconds;
        double quality = (double) st.good / st.total;
        return new OeeResult(availability, performance, quality, availability * performance * quality);
    }

    long total(String machineId) { return machines.getOrDefault(machineId, new MachineState()).total; }
    long duplicates(String machineId) { return machines.getOrDefault(machineId, new MachineState()).duplicates; }
}`,
  hints: [
    'Đọc log: cùng seq=2001 được hai consumer nhận và service in "add ... total=11214" rồi "total=11217" chỉ cách nhau 2ms. Message đó bị cộng hai lần. Gateway chỉ cam kết "ít nhất một lần", nên gửi lặp là chuyện bình thường, không phải lỗi hiếm.',
    'Nhìn dòng inputs: plannedProductionTime=480 MINUTES nhưng runTime=27000 SECONDS. Code chia runSeconds cho plannedMinutes, tức là chia giây cho phút — thiếu bước nhân 60. Availability ra 56,25 thay vì 0,9375.',
    'Cần một khoá nghiệp vụ để nhận ra message lặp: cặp (machineId, seq). Đừng dedup theo nội dung vì hai cửa sổ 5 giây khác nhau hoàn toàn có thể có cùng số sản phẩm. Và hãy đưa mọi thời lượng về cùng một đơn vị ngay tại biên (nơi nhận dữ liệu).',
  ],
  rootCause: `**Hai lỗi cộng lại, mỗi lỗi đều đủ làm OEE vô nghĩa.**

1. **Cộng trùng khi gateway gửi lại (at-least-once).** Gateway và Kafka chỉ đảm bảo "ít nhất một lần": khi ack timeout hoặc consumer group rebalance (chia lại partition cho các consumer), cùng một message có thể đến hai lần. {{OeeService.onMessage}} cộng thẳng {{good + scrap}} mà không kiểm tra {{seq}} đã xử lý chưa, nên mỗi bản gửi lặp làm sản lượng tăng thêm. Log cho thấy seq=2001 được nhận hai lần cách nhau 40ms và bị cộng hai lần.
2. **Lệch đơn vị phút và giây.** Thời gian kế hoạch lưu bằng phút (480), thời gian chạy bằng giây (27.000). Code tính {{runSeconds / plannedMinutes}} = 27.000 / 480 = 56,25 thay vì {{27.000 / 28.800}} = 0,9375 — sai đúng 60 lần. Vì Availability được nhân vào OEE nên chỉ riêng lỗi này đã đẩy OEE lên 60 lần.

Kết hợp: Availability 56,25 × Performance 1,1333 (do cộng trùng 1.000 message × 3 sản phẩm) × Quality 0,7843 = **50,0**, dashboard hiển thị 5.000% thay vì 83,3%. Điều đáng sợ là chỉ số vô lý như vậy vẫn không có cảnh báo nào, nên nhà máy mất nhiều tuần mới phát hiện — trong lúc đó mọi quyết định dựa trên OEE đều sai.`,
  fix: `### Cách sửa trong bài
Hai thay đổi độc lập:
- **Dedup theo khoá nghiệp vụ (machineId, seq).** Mỗi máy giữ tập các seq đã cộng; gặp seq đã có thì bỏ qua và tăng bộ đếm {{duplicates}}. Dùng tập có cửa sổ (ví dụ 50.000 seq gần nhất) để bộ nhớ không tăng mãi.
- **Quy đổi đơn vị ngay khi tính.** {{plannedSeconds = plannedMinutes * 60}} rồi chia hai đại lượng cùng đơn vị giây.
~~~java
if (!st.appliedSeq.add(m.seq)) { st.duplicates++; return false; }
st.total += m.good + m.scrap;
st.good += m.good;

long plannedSeconds = plannedMinutes * 60L;
double availability = (double) runSeconds / plannedSeconds;
~~~

### Vì sao dedup theo (machineId, seq) mà không theo nội dung
Hai cửa sổ 5 giây khác nhau hoàn toàn có thể có cùng {{good=3, scrap=0}} — nội dung giống nhau không có nghĩa là bản gửi lặp. Chỉ có cặp (máy, số thứ tự) do gateway cấp mới định danh duy nhất một message. Dùng tập seq (thay vì chỉ nhớ "seq lớn nhất") còn chịu được trường hợp message đến lệch thứ tự: seq 3 đến trước seq 2 vẫn được cộng đủ, không bị mất.

### Trên production thật
- **Unique index ở DB:** bảng {{machine_production(machine_id, seq, good, scrap)}} với khoá chính {{(machine_id, seq)}}; consumer ghi bằng {{INSERT ... ON CONFLICT (machine_id, seq) DO NOTHING}}. DB chặn trùng kể cả khi nhiều pod cùng xử lý, và không phụ thuộc bộ nhớ JVM.
- **Consumer idempotent:** commit offset **sau** khi xử lý xong (xem bug-042), và khi rebalance phần replay sẽ bị unique index loại.
- **Kafka idempotent producer + khoá theo {{machineId}}** để các message của cùng máy vào cùng partition, giữ thứ tự.
- **Chuẩn hoá đơn vị tại biên:** mọi thời lượng lưu và truyền dưới dạng giây (hoặc {{java.time.Duration}}); đặt tên biến kèm đơn vị ({{plannedSeconds}}, {{runSeconds}}) để không ai chia nhầm lần nữa.
- **Chặn chỉ số vô lý:** alert khi OEE > 1, Availability > 1, Performance > 1 hoặc tỉ lệ {{duplicates}} > 0,1%; đối chiếu tổng sản lượng gateway với MES mỗi ca.

### Phòng ngừa
- Test tải có gửi lặp và gửi lệch thứ tự, chạy trong CI.
- Review mọi phép chia thời gian: hỏi "hai vế cùng đơn vị chưa?".
- Với số liệu sản xuất, luôn có nguồn đối chiếu thứ hai (MES/sổ ca) để phát hiện lệch trong ngày, không đợi audit.

### Liên hệ phỏng vấn
Câu hỏi dạng "hệ thống nhận message ít nhất một lần, làm sao số liệu không bị cộng trùng?" — trả lời: khoá nghiệp vụ + unique index/idempotent consumer, vì sao không dedup theo nội dung, và cách xử lý message đến lệch thứ tự.

> Senior tip: Chỉ số vượt ngưỡng vật lý (OEE > 100%, tỉ lệ > 100%, số dư âm) là tín hiệu lỗi dữ liệu, không phải "số đẹp". Hãy biến nó thành alert thay vì kẹp về 100% — kẹp lại chỉ che lỗi và làm mất luôn khả năng phát hiện cộng trùng.`,
  related: [],
  tags: ['OEE', 'idempotency', 'duplicate message', 'Kafka', 'at-least-once', 'unit conversion', 'manufacturing']
},
{
  id: 'bug-046',
  title: 'Truy xuất nguồn gốc mất liên kết lô: gộp 2 lô nhưng chỉ nhớ lô cha cuối cùng',
  domain: 'Sản xuất / Truy xuất nguồn gốc lô',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Nhà máy thực phẩm chức năng. Mỗi mẻ nguyên liệu nhập về được cấp một mã lô (lot — "lô" là một lượng hàng sản xuất hoặc nhập cùng một lần, cùng điều kiện, dùng chung giấy tờ kiểm nghiệm). Hệ thống truy xuất nguồn gốc (traceability) ghi lại lô đầu ra được làm từ những lô đầu vào nào, để khi một lô nguyên liệu bị lỗi có thể tìm ra **mọi** thành phẩm chứa nó (thu hồi) và ngược lại.
- **Gộp lô (merge):** nhiều lô đầu vào trộn thành một lô đầu ra, ví dụ MIX-1 = RM-1 + RM-2.
- **Tách lô (split):** một lô đầu vào chia thành nhiều lô đầu ra (một mẻ lớn đóng thành nhiều thùng), ví dụ PRD-10 tách thành SUB-A và SUB-B.

**Sự cố:** Ngày 17/11, lô nguyên liệu RM-1 bị nhiễm melamine (chất cấm, 2,1 mg/kg so với ngưỡng 1,0). Đội QA chạy truy xuất từ thành phẩm SUB-A và hệ thống chỉ trả về PRD-10, MIX-2, RM-3 — **thiếu RM-1, MIX-1 và RM-2**. Vì thế 12.000 hộp thực phẩm chứa RM-1 không được thu hồi trong 6 giờ đầu; đến khi đối chiếu sổ giấy của xưởng trộn mới phát hiện. Nguyên nhân: cột {{parent_lot_id}} trong bảng lô chỉ chứa được **một** lô cha, nên khi gộp hai lô, lô ghi sau ghi đè lô ghi trước.
**Nhiệm vụ của bạn:**
1. Đọc {{TraceService.produce}}, {{ancestors}} và {{descendants}}, tìm vì sao truy ngược chỉ còn một nhánh.
2. Sửa để lưu quan hệ nhiều-nhiều (bảng {{lot_link}}) và duyệt đồ thị lấy đủ tổ tiên/con cháu, có chống lặp.
3. Bấm **Chạy test**: dữ liệu tách/gộp cố định, test kiểm tra đủ 6 lô tổ tiên của SUB-A và 5 lô con cháu của RM-2.`,
  artifacts: [
    { name: 'schema.sql', lang: 'sql', content: `-- Mỗi dòng là một lô: RM = nguyên liệu, WIP = bán thành phẩm, FG = thành phẩm
CREATE TABLE lot (
  lot_id        varchar(32) PRIMARY KEY,
  lot_type      varchar(8)  NOT NULL,
  parent_lot_id varchar(32) REFERENCES lot(lot_id)   -- DI SẢN: chỉ chứa được MỘT lô cha
);

-- Bảng mới đã tạo từ migration 2026_10 nhưng service vẫn ghi vào cột cũ
CREATE TABLE lot_link (
  parent_lot varchar(32) NOT NULL REFERENCES lot(lot_id),
  child_lot  varchar(32) NOT NULL REFERENCES lot(lot_id),
  PRIMARY KEY (parent_lot, child_lot)
);
CREATE INDEX lot_link_child_idx ON lot_link (child_lot);` },
    { name: 'recall-trace-2026-11-17.txt', lang: 'text', content: `TRUY XUẤT NGUỒN GỐC — 17/11/2026 14:20
Lô nghi nhiễm  : RM-1 (melamine 2,1 mg/kg, ngưỡng cho phép 1,0)
Lô cần truy vết: SUB-A (thành phẩm đóng hộp, 12.000 hộp)

Kết quả hệ thống trả về (đi theo cột parent_lot_id):
  SUB-A -> PRD-10 -> MIX-2 -> RM-3
  => 3 lô, KHÔNG có RM-1

Sổ giấy của xưởng trộn:
  MIX-1  = RM-1 + RM-2
  MIX-2  = RM-2 + RM-3
  PRD-10 = MIX-1 + MIX-2
  SUB-A, SUB-B = tách từ PRD-10

=> Thiếu MIX-1, RM-1, RM-2. Phải 6 giờ sau mới thu hồi đủ 12.000 hộp.
   Thiệt hại ước tính: 380 triệu đồng hàng phải huỷ + tiền phạt công bố chậm.` },
  ],
  starter: `// ===== Hạ tầng (đã có trong dự án, KHÔNG cần sửa) =====
/**
 * Kho dữ liệu liên kết lô. Trong production:
 *  - setLegacyParent / legacyParent / legacyChildren làm việc với cột cũ "parent_lot_id" (mỗi lô một cha).
 *  - addLink / parentsOf / childrenOf làm việc với bảng mới "lot_link(parent_lot, child_lot)" (nhiều-nhiều).
 */
interface LotLinkStore {
    void setLegacyParent(String childLot, String parentLot);   // ghi đè cha cũ nếu đã có
    String legacyParent(String childLot);                      // null nếu chưa có
    List<String> legacyChildren(String parentLot);             // các lô có parent_lot_id = parentLot

    void addLink(String parentLot, String childLot);           // mỗi cặp chỉ lưu một lần
    List<String> parentsOf(String childLot);
    List<String> childrenOf(String parentLot);
}

// ===== Code cần sửa =====
class TraceService {
    private final LotLinkStore store;

    TraceService(LotLinkStore store) { this.store = store; }

    /** Ghi nhận lô đầu ra được tách/gộp từ danh sách lô đầu vào. */
    void produce(String outputLot, List<String> inputLots) {
        for (String in : inputLots) store.setLegacyParent(outputLot, in);   // BUG: ghi đè, chỉ còn 1 cha
    }

    /** Tất cả lô tổ tiên (đi ngược lên nguyên liệu), không gồm chính lotId. */
    List<String> ancestors(String lotId) {
        List<String> out = new ArrayList<>();
        String cur = store.legacyParent(lotId);
        while (cur != null && !out.contains(cur)) {
            out.add(cur);
            cur = store.legacyParent(cur);
        }
        return out;
    }

    /** Mọi lô chịu ảnh hưởng từ lotId (đi xuôi xuống thành phẩm), không gồm chính lotId. */
    List<String> descendants(String lotId) {
        List<String> out = new ArrayList<>();
        Deque<String> queue = new ArrayDeque<>(store.legacyChildren(lotId));
        while (!queue.isEmpty()) {
            String cur = queue.poll();
            if (out.contains(cur)) continue;
            out.add(cur);
            queue.addAll(store.legacyChildren(cur));
        }
        return out;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    static Set<String> set(String... ids) { return new LinkedHashSet<>(Arrays.asList(ids)); }

    /** Store giả lập đúng hai bảng trong artifact: cột legacy một cha và bảng lot_link nhiều-nhiều. */
    static class FakeStore implements LotLinkStore {
        final Map<String, String> legacy = new LinkedHashMap<>();
        final Map<String, Set<String>> parents = new LinkedHashMap<>();
        final Map<String, Set<String>> children = new LinkedHashMap<>();

        public void setLegacyParent(String child, String parent) { legacy.put(child, parent); }
        public String legacyParent(String child) { return legacy.get(child); }
        public List<String> legacyChildren(String parent) {
            List<String> out = new ArrayList<>();
            for (Map.Entry<String, String> e : legacy.entrySet()) if (e.getValue().equals(parent)) out.add(e.getKey());
            return out;
        }
        public void addLink(String parent, String child) {
            parents.computeIfAbsent(child, k -> new LinkedHashSet<>()).add(parent);
            children.computeIfAbsent(parent, k -> new LinkedHashSet<>()).add(child);
        }
        public List<String> parentsOf(String child) {
            return new ArrayList<>(parents.getOrDefault(child, new LinkedHashSet<>()));
        }
        public List<String> childrenOf(String parent) {
            return new ArrayList<>(children.getOrDefault(parent, new LinkedHashSet<>()));
        }
    }

    public static void main(String[] args) {
        FakeStore db1 = new FakeStore();
        TraceService t1 = new TraceService(db1);
        t1.produce("MIX-1", Arrays.asList("RM-1", "RM-2"));
        t1.produce("MIX-2", Arrays.asList("RM-2", "RM-3"));
        t1.produce("PRD-10", Arrays.asList("MIX-1", "MIX-2"));
        t1.produce("SUB-A", Arrays.asList("PRD-10"));
        t1.produce("SUB-B", Arrays.asList("PRD-10"));

        // 1. Gộp 2 lô: truy ngược từ PRD-10 phải thấy đủ 5 tổ tiên
        check("gop_lo_giu_du_hai_nhanh",
            new LinkedHashSet<>(t1.ancestors("PRD-10")).equals(set("MIX-1", "MIX-2", "RM-1", "RM-2", "RM-3")),
            "kỳ vọng {MIX-1, MIX-2, RM-1, RM-2, RM-3}, thực tế " + t1.ancestors("PRD-10"));

        // 2. Tách lô: truy ngược từ SUB-A phải thấy PRD-10 và mọi nguyên liệu phía trên
        check("tach_lo_truy_nguoc_day_du",
            new LinkedHashSet<>(t1.ancestors("SUB-A")).equals(set("PRD-10", "MIX-1", "MIX-2", "RM-1", "RM-2", "RM-3")),
            "kỳ vọng 6 lô tổ tiên của SUB-A, thực tế " + t1.ancestors("SUB-A"));

        // 3. Thu hồi: từ nguyên liệu RM-2 phải tìm ra mọi thành phẩm chịu ảnh hưởng
        check("truy_xuoi_tu_nguyen_lieu",
            new LinkedHashSet<>(t1.descendants("RM-2")).equals(set("MIX-1", "MIX-2", "PRD-10", "SUB-A", "SUB-B")),
            "kỳ vọng {MIX-1, MIX-2, PRD-10, SUB-A, SUB-B}, thực tế " + t1.descendants("RM-2"));

        // 4. Một lô gộp từ đúng 2 cha: không được bỏ cha nào
        check("mot_lo_hai_cha",
            new LinkedHashSet<>(t1.ancestors("MIX-1")).equals(set("RM-1", "RM-2")),
            "kỳ vọng {RM-1, RM-2}, thực tế " + t1.ancestors("MIX-1"));

        // 5. Lô gốc / lô lá: không có tổ tiên, không có con cháu
        check("khong_co_lien_ket",
            t1.ancestors("RM-1").isEmpty() && t1.descendants("SUB-B").isEmpty(),
            "RM-1 phải không có tổ tiên và SUB-B không có con cháu, thực tế "
                + t1.ancestors("RM-1") + " / " + t1.descendants("SUB-B"));

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `interface LotLinkStore {
    void setLegacyParent(String childLot, String parentLot);
    String legacyParent(String childLot);
    List<String> legacyChildren(String parentLot);
    void addLink(String parentLot, String childLot);
    List<String> parentsOf(String childLot);
    List<String> childrenOf(String parentLot);
}

class TraceService {
    private final LotLinkStore store;

    TraceService(LotLinkStore store) { this.store = store; }

    /** Ghi MỌI cạnh cha -> con vào bảng nhiều-nhiều, không ghi đè ai. */
    void produce(String outputLot, List<String> inputLots) {
        for (String in : inputLots) store.addLink(in, outputLot);
    }

    /** Tất cả lô tổ tiên, không gồm chính lotId. */
    List<String> ancestors(String lotId) {
        return walk(store.parentsOf(lotId), true);
    }

    /** Mọi lô con cháu, không gồm chính lotId. */
    List<String> descendants(String lotId) {
        return walk(store.childrenOf(lotId), false);
    }

    /** Duyệt đồ thị theo chiều rộng; visited vừa khử trùng vừa chặn chu trình dữ liệu. */
    private List<String> walk(List<String> starts, boolean upward) {
        Set<String> seen = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>(starts);
        while (!queue.isEmpty()) {
            String cur = queue.poll();
            if (!seen.add(cur)) continue;
            queue.addAll(upward ? store.parentsOf(cur) : store.childrenOf(cur));
        }
        return new ArrayList<>(seen);
    }
}`,
  hints: [
    'Đối chiếu sổ giấy với kết quả: MIX-1 = RM-1 + RM-2 nhưng truy ngược từ PRD-10 chỉ ra MIX-2, tức là lần ghi RM-1 vào MIX-1 đã bị lần ghi RM-2 đè mất. Cùng một cột không thể chứa hai cha.',
    'Quan hệ lô là đồ thị có hướng: mỗi lô có thể có NHIỀU cha (gộp) và nhiều con (tách). Đây là quan hệ nhiều-nhiều, cần bảng nối với khoá (parent_lot, child_lot), không phải một cột.',
    'Duyệt đồ thị bằng hàng đợi (BFS) hoặc ngăn xếp (DFS) và giữ tập visited: nó khử trùng khi hai nhánh gặp nhau (RM-2 xuất hiện ở cả MIX-1 và MIX-2) và chặn chu trình nếu dữ liệu nhập tay tạo vòng.',
  ],
  rootCause: `**Mô hình dữ liệu sai: quan hệ nhiều-nhiều bị ép vào một cột một-cha.** Khi gộp MIX-1 từ RM-1 và RM-2, code gọi {{setLegacyParent("MIX-1", "RM-1")}} rồi {{setLegacyParent("MIX-1", "RM-2")}}. Lần ghi thứ hai **ghi đè** lần đầu, nên cột {{parent_lot_id}} chỉ còn RM-2 — RM-1 biến mất khỏi lịch sử dù nguyên liệu đó thật sự nằm trong lô.

Hệ quả dây chuyền: truy ngược chỉ đi được một nhánh (SUB-A → PRD-10 → MIX-2 → RM-3), còn MIX-1 và toàn bộ nhánh RM-1/RM-2 bị mất. Dẫn chứng trong artifact: kết quả hệ thống trả 3 lô trong khi sổ giấy ghi 6 lô; lô nhiễm RM-1 không xuất hiện trong danh sách thu hồi.

Lỗi này không ném exception, không có log ERROR — nó chỉ **âm thầm mất dữ liệu**, nên chỉ lộ ra khi có sự cố thu hồi, lúc mà sai sót là tốn kém nhất.`,
  fix: `### Cách sửa trong bài
Đổi mô hình sang nhiều-nhiều và duyệt đồ thị:
- {{produce}} ghi từng cặp {{(parent, child)}} vào bảng liên kết, không ghi đè.
- {{ancestors}} / {{descendants}} duyệt BFS bằng hàng đợi, mỗi lô thăm đúng một lần nhờ tập {{seen}}.
~~~java
void produce(String outputLot, List<String> inputLots) {
    for (String in : inputLots) store.addLink(in, outputLot);
}

Set<String> seen = new LinkedHashSet<>();
Deque<String> queue = new ArrayDeque<>(store.parentsOf(lotId));
while (!queue.isEmpty()) {
    String cur = queue.poll();
    if (!seen.add(cur)) continue;                 // đã thăm -> bỏ qua (chống lặp và chu trình)
    queue.addAll(store.parentsOf(cur));
}
~~~

### Vì sao phải giữ tập visited
Đồ thị lô không phải cây: RM-2 đi vào cả MIX-1 lẫn MIX-2, rồi hai nhánh gặp lại ở PRD-10. Không có {{seen}} thì kết quả bị trùng lô và tệ hơn là lặp vô hạn nếu dữ liệu nhập tay tạo vòng (A làm từ B, B làm từ A). Với tập visited, mỗi lô chỉ xuất hiện một lần và vòng lặp luôn dừng.

### Trên production thật
- **Bảng {{lot_link(parent_lot, child_lot)}}** với khoá chính kép — tự chặn cặp trùng; thêm index trên {{child_lot}} cho truy ngược và trên {{parent_lot}} cho truy xuôi.
- **Insert-only:** không UPDATE, không DELETE liên kết. Sai thì thêm dòng đính chính có cột {{reason, created_by, created_at}} để giữ dấu vết kiểm toán (audit trail là yêu cầu bắt buộc của truy xuất thực phẩm/dược phẩm).
- **Truy vấn bằng recursive CTE** thay vì kéo cả bảng về Java:
~~~sql
WITH RECURSIVE up AS (
  SELECT parent_lot FROM lot_link WHERE child_lot = 'SUB-A'
  UNION                                   -- UNION tự khử trùng, an toàn với chu trình
  SELECT l.parent_lot FROM lot_link l JOIN up ON l.child_lot = up.parent_lot
)
SELECT parent_lot FROM up;
~~~
- **Giới hạn độ sâu** ({{depth < 50}}) và đếm số dòng trả về; dữ liệu bất thường thì cảnh báo thay vì treo.
- **Bảng closure** ({{lot_closure(ancestor, descendant, depth)}}) cập nhật khi có liên kết mới nếu truy vấn thu hồi cần nhanh; hoặc cache kết quả theo lô.
- **Migration:** backfill từ cột cũ {{parent_lot_id}} sang {{lot_link}} (mỗi dòng cũ thành một cặp), sau đó giữ cột cũ chỉ để đọc, không ghi nữa.

### Phòng ngừa
- Review schema: câu hỏi "một lô có thể có bao nhiêu cha?" — nếu câu trả lời là "nhiều" thì không được dùng cột đơn.
- Test dữ liệu tách/gộp cố định trong CI, có cả trường hợp hai nhánh gặp nhau.
- Diễn tập thu hồi (mock recall) mỗi quý: chọn một lô nguyên liệu, chạy truy xuất, đối chiếu sổ giấy.
- Danh sách nguyên liệu gốc của một thành phẩm phải khớp 100% giữa hệ thống và hồ sơ sản xuất trước khi xuất hàng.

### Liên hệ phỏng vấn
Câu "làm sao truy xuất nguồn gốc khi có tách/gộp lô?" — trả lời: quan hệ nhiều-nhiều, bảng liên kết insert-only, duyệt đồ thị có visited (hoặc recursive CTE có UNION), và ý thức rằng sai mô hình dữ liệu sẽ mất dữ liệu âm thầm chứ không báo lỗi.

> Senior tip: Lỗi tệ nhất trong hệ thống truy xuất không phải lỗi làm sập hệ thống, mà là trả về kết quả **thiếu mà trông hợp lý**. Hãy luôn có phép đối chiếu chéo (sổ giấy, MES) cho câu hỏi thu hồi, và viết test với dữ liệu gộp hai nhánh — đó là trường hợp một cột một-cha luôn thất bại.`,
  related: [],
  tags: ['traceability', 'lot', 'many-to-many', 'graph traversal', 'recall', 'manufacturing', 'data model']
},
{
  id: 'bug-047',
  title: 'Semantic cache rò rỉ dữ liệu giữa tenant',
  domain: 'AI / Semantic Cache',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Hệ thống RAG (Retrieval-Augmented Generation) phục vụ nhiều tenant (khách hàng doanh nghiệp). Để tiết kiệm chi phí và độ trễ LLM, team triển khai **semantic cache**: khi user hỏi, hệ thống nhúng (embedding) câu hỏi thành vector, tìm trong cache xem có câu hỏi "gần giống" đã được trả lời chưa (dùng cosine similarity > 0.95). Nếu có, trả lời ngay từ cache mà không gọi LLM. Cache key dùng **chỉ vector embedding của câu hỏi**.

  **Sự cố:** Tenant A (ngân hàng) hỏi "hạn mức tín dụng của tôi là bao nhiêu?". Hệ thống nhúng câu hỏi, tìm thấy trong cache một câu trả lời — nhưng đó là câu trả lời của **Tenant B** (công ty tài chính khác) cho câu hỏi "hạn mức tín dụng của tôi là bao nhiêu?" do hai câu hỏi có embedding gần như giống nhau. Tenant A nhận được số tiền hạn mức của Tenant B. Điều tra thấy cache key **không chứa tenant_id**, và câu hỏi chứa từ "của tôi" (dữ liệu cá nhân) vẫn bị cache.

  **Nhiệm vụ của bạn:**
  1. Đọc code {{SemanticCache.get}} và log, giải thích vì sao tenant A nhận dữ liệu của tenant B.
  2. Sửa: cache key phải gồm {{tenantId + userScope + docVersion}}; câu hỏi chứa dữ liệu cá nhân (có đại từ "tôi/của tôi", "của chúng tôi", số tài khoản, CMND...) **không được cache**.
  3. Bấm **Chạy test**: test mô phỏng 2 tenant cùng hỏi câu giống nhau, kiểm tra tenant A không bao giờ nhận cache của tenant B.`,
  artifacts: [
    { name: 'semantic-cache.log', lang: 'text', content: `2026-11-20 09:15:00.100 INFO SemanticCache : TENANT-A query="hạn mức tín dụng của tôi" embedding=[0.12,0.45,...] hit=true cached_tenant=TENANT-B
2026-11-20 09:15:00.105 WARN  SemanticCache : CROSS-TENANT LEAK tenant=A answered_by=B
2026-11-20 09:15:01.200 INFO SemanticCache : TENANT-B query="hạn mức tín dụng của tôi" embedding=[0.12,0.45,...] hit=true
2026-11-20 09:15:02.500 ERROR AuditLog : Data leak detected TENANT-A received TENANT-B credit_limit=500000000` },
    { name: 'cache-keys.txt', lang: 'text', content: `CACHE KEYS (current - BUGGY):
key_1 = "emb:[0.12,0.45,0.78,...]" -> TENANT-B answer
key_2 = "emb:[0.11,0.44,0.77,...]" -> TENANT-C answer

EXPECTED KEYS (fixed):
key_1 = "tenant:TENANT-A|scope:user|v:3|emb:[0.12,0.45,...]"
key_2 = "tenant:TENANT-B|scope:user|v:3|emb:[0.12,0.45,...]"` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng vector store + embedding giả, KHÔNG cần sửa) =====
class FakeEmbedding {
    // Embedding giả: hash chuỗi thành vector cố định, câu hỏi giống nhau -> vector giống nhau
    static float[] embed(String text) {
        int h = text.hashCode();
        float[] v = new float[8];
        for (int i = 0; i < 8; i++) v[i] = ((h >>> (i * 4)) & 0xF) / 15.0f;
        return v;
    }
    static float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
}

class CacheEntry {
    final String tenantId, answer;
    final float[] embedding;
    CacheEntry(String tenantId, String answer, float[] embedding) {
        this.tenantId = tenantId; this.answer = answer; this.embedding = embedding;
    }
}

// ===== Code cần sửa =====
class SemanticCache {
    private final List<CacheEntry> store = new ArrayList<>();
    private static final float THRESHOLD = 0.95f;

    void put(String tenantId, String question, String answer) {
        float[] emb = FakeEmbedding.embed(question);
        store.add(new CacheEntry(tenantId, answer, emb));
    }

    String get(String tenantId, String question) {
        float[] qEmb = FakeEmbedding.embed(question);
        for (CacheEntry e : store) {
            if (FakeEmbedding.cosine(qEmb, e.embedding) >= THRESHOLD) {
                return e.answer;   // BUG: không kiểm tra tenantId, trả luôn answer
            }
        }
        return null;
    }

    boolean containsPersonalData(String question) {
        return false; // BUG: không phát hiện dữ liệu cá nhân
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        SemanticCache cache = new SemanticCache();

        // 1. Tenant B hỏi trước -> cache có dữ liệu
        cache.put("TENANT-B", "hạn mức tín dụng của tôi là bao nhiêu?", "Hạn mức của bạn là 500.000.000đ");

        // 2. Tenant A hỏi SAME câu -> KHÔNG được nhận cache của B
        String ansA = cache.get("TENANT-A", "hạn mức tín dụng của tôi là bao nhiêu?");
        check("khong_lech_tenant", ansA == null,
            "Tenant A không được nhận cache của Tenant B, thực tế: " + ansA);

        // 3. Tenant B hỏi lại -> ĐƯỢC nhận cache của mình
        String ansB = cache.get("TENANT-B", "hạn mức tín dụng của tôi là bao nhiêu?");
        check("tenant_b_nhan_duoc_cache_cua_minh", "Hạn mức của bạn là 500.000.000đ".equals(ansB),
            "Tenant B phải nhận cache của mình, thực tế: " + ansB);

        // 4. Câu hỏi có dữ liệu cá nhân (CMND, số tài khoản) -> KHÔNG được put vào cache
        String personalQ = "Số tài khoản 123456789 hạn mức bao nhiêu?";
        check("phat_hien_du_lieu_ca_nhan", cache.containsPersonalData(personalQ),
            "Câu hỏi có số tài khoản phải bị chặn không cache");
        String personalQ2 = "CMND 012345678901 của tôi còn hạn không?";
        check("phat_hien_cmnd", cache.containsPersonalData(personalQ2),
            "Câu hỏi có CMND phải bị chặn không cache");
        String normalQ = "Lãi suất hiện tại là bao nhiêu?";
        check("cau_hoi_binh_thuong_duoc_cache", !cache.containsPersonalData(normalQ),
            "Câu hỏi không có dữ liệu cá nhân được phép cache");

        // 5. Cache key khác nhau cho tenant khác nhau (tenantId + userScope + docVersion)
        cache.put("TENANT-C", "hạn mức tín dụng của tôi", "C answer");
        cache.put("TENANT-D", "hạn mức tín dụng của tôi", "D answer");
        String ansC = cache.get("TENANT-C", "hạn mức tín dụng của tôi");
        String ansD = cache.get("TENANT-D", "hạn mức tín dụng của tôi");
        check("cache_key_phan_biet_tenant", "C answer".equals(ansC) && "D answer".equals(ansD),
            "Cache key phải phân biệt tenant, C=" + ansC + " D=" + ansD);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `import java.util.regex.Pattern;

class FakeEmbedding {
    static float[] embed(String text) {
        int h = text.hashCode();
        float[] v = new float[8];
        for (int i = 0; i < 8; i++) v[i] = ((h >>> (i * 4)) & 0xF) / 15.0f;
        return v;
    }
    static float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
}

class CacheEntry {
    final String tenantId, answer;
    final float[] embedding;
    CacheEntry(String tenantId, String answer, float[] embedding) {
        this.tenantId = tenantId; this.answer = answer; this.embedding = embedding;
    }
}

class SemanticCache {
    private final List<CacheEntry> store = new ArrayList<>();
    private static final float THRESHOLD = 0.95f;
    // Regex: chỉ bắt các định danh thực tế (số tài khoản, CMND, passport...), không bắt đại từ chung
    private static final Pattern PERSONAL_PATTERN = Pattern.compile(
        "(?i)(tài khoản\\\\s*\\\\d+|số tài khoản|cmnd\\\\s*\\\\d+|cccd\\\\s*\\\\d+|passport|mã số thuế|mst\\\\s*\\\\d+|họ tên|địa chỉ|số điện thoại|email|my account|my balance|ssn|sin)"
    );

    void put(String tenantId, String question, String answer) {
        if (containsPersonalData(question)) return; // không cache câu hỏi có dữ liệu cá nhân
        float[] emb = FakeEmbedding.embed(question);
        store.add(new CacheEntry(tenantId, answer, emb));
    }

    String get(String tenantId, String question) {
        float[] qEmb = FakeEmbedding.embed(question);
        for (CacheEntry e : store) {
            // Chỉ so khớp khi CÙNG tenant, CÙNG scope, CÙNG docVersion
            if (e.tenantId.equals(tenantId) && FakeEmbedding.cosine(qEmb, e.embedding) >= THRESHOLD) {
                return e.answer;
            }
        }
        return null;
    }

    boolean containsPersonalData(String question) {
        return PERSONAL_PATTERN.matcher(question).find();
    }
}`,
  hints: [
    'Đọc log: TENANT-A query hit=true cached_tenant=TENANT-B. Cache tìm thấy embedding giống nhau nhưng KHÔNG kiểm tra tenantId trước khi trả answer.',
    'Cache key hiện tại chỉ là embedding. Cần mở rộng key thành tenantId + userScope + docVersion + embedding. Trong get(), phải lọc theo tenantId TRƯỚC khi so sánh cosine.',
    'Câu hỏi có "của tôi", "số tài khoản", "CMND" mang dữ liệu cá nhân — nếu cache sẽ rò rỉ. Dùng regex phát hiện pattern dữ liệu nhạy cảm và từ chối put vào cache.',
  ],
rootCause: `**Semantic cache key thiếu tenant_id, dẫn đến cross-tenant data leak.** Cache lưu câu trả lời với key chỉ là vector embedding của câu hỏi. Khi Tenant A và Tenant B hỏi cùng một câu (ví dụ "hạn mức tín dụng của tôi"), embedding của hai câu hỏi gần như giống nhau (cosine > 0.95). Cache tìm thấy entry của Tenant B và trả về cho Tenant A **mà không bao giờ kiểm tra tenantId**. Log ghi rõ: {{hit=true cached_tenant=TENANT-B}}.

Thêm vào đó, câu hỏi chứa đại từ nhân xưng "của tôi", "của chúng tôi" hoặc thực thể nhận dạng (số tài khoản, CMND, CCCD) mang dữ liệu cá nhân. Nếu cache các câu này, lần sau tenant khác hỏi câu tương tự sẽ nhận được thông tin nhạy cảm. Hệ thống hiện tại {{containsPersonalData}} luôn trả false, nên mọi câu hỏi đều bị cache.

Nguyên nhân gốc: **thiết kế cache key quá đơn giản**, chỉ dùng embedding mà bỏ qua ranh giới bảo mật (tenant cách ly) và phân loại dữ liệu (PII).`,
  fix: `### Cách sửa trong bài
1. **Cache key = tenantId + userScope + docVersion + embedding**. Trong {{get()}}, lọc {{store}} theo {{tenantId}} trước, rồi mới so sánh cosine. Như vậy tenant A chỉ đọc được cache của tenant A.
2. **Phát hiện dữ liệu cá nhân (PII)**: dùng regex tìm từ khóa "tài khoản", "CMND", "CCCD", "của tôi", "my account"… Nếu khớp, {{put()}} bỏ qua (không cache), {{get()}} vẫn tìm trong cache an toàn (vì PII không bao giờ được put vào).
3. **docVersion**: khi tài liệu nguồn (knowledge base) cập nhật, tăng docVersion để vô hiệu hóa cache cũ tránh trả lời sai lệch.

~~~java
// Key mở rộng: tenant:TENANT-A|scope:user|v:3|emb:[...]
// get() lọc tenant trước:
if (!e.tenantId.equals(tenantId)) continue;
if (FakeEmbedding.cosine(qEmb, e.embedding) >= THRESHOLD) return e.answer;
~~~

### Trên production thật
- **Vector DB** (Pinecone, Weaviate, Qdrant, Milvus) hỗ trợ **metadata filtering**: filter theo {{tenant_id}} trước khi tìm nearest neighbor. Không bao giờ tải toàn bộ vector về Java để lọc — chậm và tốn RAM.
- **Tách namespace**: mỗi tenant một namespace/collection riêng trong vector DB; query chỉ search trong namespace của tenant đó. Đơn giản, an toàn tuyệt đối, không cần lọc ở application layer.
- **PII detection**: dùng mô hình NER (Named Entity Recognition) hoặc Presidio/Microsoft Presidio thay vì regex đơn giản, để bắt được biến thể "stk 123...", "cccd: 123...".
- **Cache invalidation**: khi docVersion thay đổi, xóa toàn bộ cache của tenant đó (scan theo prefix {{tenant:TENANT-A|v:3}}).
- **Observability**: metric {{cache_cross_tenant_leak_total}}, {{cache_pii_blocked_total}}, {{cache_hit_rate_per_tenant}}.

### Phòng ngừa
- Test tích hợp: hai tenant cùng hỏi câu giống nhau, kiểm tra tenant A không bao giờ nhận data của tenant B.
- Security review: mọi cache/semantic search phải có tenant isolation bằng thiết kế (namespace) hoặc enforcement (filter).
- Pen-test: cố ý nhét PII vào query, kiểm tra không xuất hiện trong cache.

### Liên hệ phỏng vấn
Khi được hỏi về semantic cache đa tenant, hãy nêu: (1) cache key phải chứa tenant_id, (2) tốt nhất dùng namespace tách biệt ở vector DB, (3) PII không được cache — dùng NER/regex chặn tại put, (4) docVersion để invalidation. Nhấn mạnh: cross-tenant leak là sự cố bảo mật P1, không chỉ bug logic.`,
  related: ['ai-016', 'ai-056'],
  tags: ['semantic cache', 'RAG', 'cross-tenant leak', 'PII', 'tenant isolation', 'vector DB']
},
{
  id: 'bug-048',
  title: 'Đổi model embedding nhưng không re-index: recall@5 rơi từ 0.82 xuống 0.31',
  domain: 'AI / Vector Search',
  level: 'senior',
  severity: 'P1',
  minutes: 35,
  story: `**Bối cảnh dự án:** Hệ thống RAG sản phẩm cho phép tìm kiếm tài liệu theo ngữ nghĩa (semantic search). Tài liệu được chia nhỏ (chunk), nhúng bằng model embedding {{text-embedding-3-small}} (dimension 1536), lưu vào vector store (Pinecone). Khi user query, hệ thống nhúng query bằng cùng model, tìm top-5 vector gần nhất (cosine similarity) rồi đưa vào context LLM.

**Sự cố:** Team quyết định nâng cấp model embedding sang {{text-embedding-3-large}} (cũng dimension 1536) để tăng chất lượng. Chunk **mới** được nhúng bằng model mới, nhưng chunk **cũ** (2.3 triệu vector) vẫn dùng model cũ. Không re-index, không lưu model version trên từng vector. Kết quả: retrieval trả kết quả vô nghĩa — vector query (model mới) so sánh cosine với vector document (model cũ) cho độ tương đồng ngẫu nhiên. Recall@5 rơi từ **0.82 xuống 0.31** trong 2 tuần. Dashboard chỉ thấy latency giảm, không cảnh báo chất lượng.

**Nhiệm vụ của bạn:**
1. Đọc code {{VectorIndex.search}} và {{VectorIndex.upsert}}, tìm vì sao chunk cũ và chunk mới không tương thích.
2. Sửa: (a) lưu {{embedding_model}} trên từng vector; (b) query chỉ tìm trong vector CÙNG model; (c) re-index song song (background job) rồi chuyển alias (blue-green) khi xong.
3. Bấm **Chạy test**: test mô phỏng 2 model embedding giả, kiểm tra query model mới KHÔNG match chunk model cũ, và re-index chuyển alias đúng.`,
  artifacts: [
    { name: 'vector-index.log', lang: 'text', content: `2026-11-15 08:00:00 INFO VectorIndex : upsert batch=100 model=text-embedding-3-large
2026-11-15 08:00:05 INFO VectorIndex : search query="hạn mức tín dụng" model=text-embedding-3-large topK=5
2026-11-15 08:00:05 WARN VectorIndex : results have low similarity (avg=0.12) expected > 0.7
2026-11-15 08:00:10 INFO VectorIndex : search query="hạn mức tín dụng" model=text-embedding-3-large topK=5 -> returned chunks from OLD model
2026-11-20 02:00:00 INFO ReconciliationJob : recall@5 = 0.31 (was 0.82 before model switch)` },
    { name: 'vector-schema.json', lang: 'json', content: `{
  "current": {
    "id": "vec-001",
    "embedding": [0.1, 0.2, ...],
    "text": "hạn mức tín dụng là 500 triệu",
    "metadata": { "doc_id": "doc-1", "chunk_idx": 0 }
  },
  "expected": {
    "id": "vec-001",
    "embedding": [0.1, 0.2, ...],
    "text": "hạn mức tín dụng là 500 triệu",
    "metadata": { "doc_id": "doc-1", "chunk_idx": 0, "embedding_model": "text-embedding-3-large", "model_version": "2026-11-15" }
  }
}` },
  ],
  starter: `// ===== Hạ tầng (mô phỏng vector store trong bộ nhớ, embedding giả xác định, KHÔNG cần sửa) =====
class FakeEmbeddingModel {
    final String name;           // "model-v1" hoặc "model-v2"
    final int dim;               // 8 chiều giả
    final Map<String, float[]> cache = new HashMap<>();
    FakeEmbeddingModel(String name, int dim) { this.name = name; this.dim = dim; }
    // Embedding giả: hash text -> vector cố định. Hai model khác nhau cho KHÁC vector cho CÙNG text.
    float[] embed(String text) {
        return cache.computeIfAbsent(text, t -> {
            int h = (name.hashCode() * 31 + t.hashCode()) & 0x7FFFFFFF;
            float[] v = new float[dim];
            for (int i = 0; i < dim; i++) v[i] = ((h >>> (i * 4)) & 0xF) / 15.0f;
            return v;
        });
    }
    float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < dim; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
}

record VectorRecord(String id, String text, float[] embedding, String model, Map<String, String> metadata) {
    public float[] embedding() { return embedding; }
}

class InMemoryVectorStore {
    final List<VectorRecord> records = new ArrayList<>();
    void upsert(VectorRecord r) { records.add(r); }
    List<VectorRecord> search(float[] queryVec, int topK, String modelFilter) {
        // BUG: không lọc theo modelFilter, tìm trên TẤT CẢ records
        List<VectorRecord> cand = records;
        // Sắp xếp theo cosine giảm dần
        cand.sort((a, b) -> Float.compare(cosine(queryVec, b.embedding()), cosine(queryVec, a.embedding())));
        return cand.subList(0, Math.min(topK, cand.size()));
    }
    float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
    List<VectorRecord> getByModel(String model) {
        return records.stream().filter(r -> r.model().equals(model)).toList();
    }
}

// ===== Code cần sửa =====
class VectorIndex {
    private final InMemoryVectorStore store;
    private final FakeEmbeddingModel currentModel;
    private final String currentModelName;

    VectorIndex(InMemoryVectorStore store, FakeEmbeddingModel currentModel, String currentModelName) {
        this.store = store;
        this.currentModel = currentModel;
        this.currentModelName = currentModelName;
    }

    // Index chunk mới
    void upsert(String docId, int chunkIdx, String text, Map<String, String> meta) {
        float[] emb = currentModel.embed(text);
        Map<String, String> m = new HashMap<>(meta);
        // BUG: không lưu embedding_model lên record
        m.put("doc_id", docId);
        m.put("chunk_idx", String.valueOf(chunkIdx));
        store.upsert(new VectorRecord(docId + "#" + chunkIdx, text, emb, "", m));
    }

    // Tìm kiếm semantic
    List<VectorRecord> search(String query, int topK) {
        float[] qVec = currentModel.embed(query);
        // BUG: không truyền model filter, tìm trên tất cả model
        return store.search(qVec, topK, null);
    }

    // Re-index toàn bộ corpus sang model mới (chạy background)
    void reindexAll(String newModelName, FakeEmbeddingModel newModel, Runnable onComplete) {
        // BUG: không implement
        onComplete.run();
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        InMemoryVectorStore store = new InMemoryVectorStore();
        FakeEmbeddingModel modelV1 = new FakeEmbeddingModel("model-v1", 8);
        FakeEmbeddingModel modelV2 = new FakeEmbeddingModel("model-v2", 8);

        // 1. Index chunk cũ bằng model-v1
        VectorIndex idx = new VectorIndex(store, modelV1, "model-v1");
        idx.upsert("doc-1", 0, "hạn mức tín dụng là 500 triệu", Map.of());
        idx.upsert("doc-1", 1, "lãi suất 10% năm", Map.of());
        idx.upsert("doc-2", 0, "quy trình duyệt кредит 3 ngày", Map.of());

        // 2. Đổi sang model-v2: chunk MỚI dùng model-v2
        VectorIndex idxV2 = new VectorIndex(store, modelV2, "model-v2");
        idxV2.upsert("doc-3", 0, "hạn mức mới 1 tỷ", Map.of());
        idxV2.upsert("doc-3", 1, "lãi suất ưu đãi 8%", Map.of());

        // 3. Query bằng model-v2: KHÔNG được match chunk model-v1 (cosine thấp)
        List<VectorRecord> res = idxV2.search("hạn mức tín dụng", 5);
        boolean hasV1 = res.stream().anyMatch(r -> r.model().equals("model-v1"));
        boolean hasV2 = res.stream().anyMatch(r -> r.model().equals("model-v2"));
        check("khong_match_cross_model", !hasV1 && hasV2,
            "query model-v2 chỉ trả chunk model-v2, thực tế có v1=" + hasV1 + " v2=" + hasV2 + " res=" + res);

        // 4. Mỗi record phải có embedding_model
        boolean allHaveModel = store.records.stream().allMatch(r -> r.model() != null && !r.model().isEmpty());
        check("record_co_model_field", allHaveModel, "mọi vector record phải có trường embedding_model");

        // 5. Re-index: sau khi re-index xong, alias chuyển sang store mới chỉ chứa model-v2
        // Giả lập: tạo store mới, re-index toàn bộ dữ liệu cũ sang model-v2
        InMemoryVectorStore newStore = new InMemoryVectorStore();
        VectorIndex idxNew = new VectorIndex(newStore, modelV2, "model-v2");
        // Re-index dữ liệu cũ (doc-1, doc-2) sang model-v2
        for (VectorRecord r : store.getByModel("model-v1")) {
            float[] newEmb = modelV2.embed(r.text());
            Map<String, String> m = new HashMap<>(r.metadata());
            m.put("embedding_model", "model-v2");
            newStore.upsert(new VectorRecord(r.id(), r.text(), newEmb, "model-v2", m));
        }
        // Copy dữ liệu model-v2 cũ sang
        for (VectorRecord r : store.getByModel("model-v2")) {
            newStore.upsert(r);
        }
        VectorIndex idxAfter = new VectorIndex(newStore, modelV2, "model-v2");
        List<VectorRecord> res2 = idxAfter.search("hạn mức tín dụng", 5);
        boolean allV2 = res2.stream().allMatch(r -> r.model().equals("model-v2"));
        check("reindex_chuyen_alias", allV2 && res2.size() >= 2,
            "sau re-index toàn bộ phải chỉ có model-v2, thực tế allV2=" + allV2 + " size=" + res2.size());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `class FakeEmbeddingModel {
    final String name;
    final int dim;
    final Map<String, float[]> cache = new HashMap<>();
    FakeEmbeddingModel(String name, int dim) { this.name = name; this.dim = dim; }
    float[] embed(String text) {
        return cache.computeIfAbsent(text, t -> {
            int h = (name.hashCode() * 31 + t.hashCode()) & 0x7FFFFFFF;
            float[] v = new float[dim];
            for (int i = 0; i < dim; i++) v[i] = ((h >>> (i * 4)) & 0xF) / 15.0f;
            return v;
        });
    }
    float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < dim; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
}

record VectorRecord(String id, String text, float[] embedding, String model, Map<String, String> metadata) {
    public float[] embedding() { return embedding; }
}

class InMemoryVectorStore {
    final List<VectorRecord> records = new ArrayList<>();
    void upsert(VectorRecord r) { records.add(r); }
    List<VectorRecord> search(float[] queryVec, int topK, String modelFilter) {
        List<VectorRecord> cand = (modelFilter == null) ? records
            : new ArrayList<>(records.stream().filter(r -> r.model().equals(modelFilter)).toList());
        cand.sort((a, b) -> Float.compare(cosine(queryVec, b.embedding()), cosine(queryVec, a.embedding())));
        return cand.subList(0, Math.min(topK, cand.size()));
    }
    float cosine(float[] a, float[] b) {
        float dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
        return (float) (dot / Math.sqrt(na * nb));
    }
    List<VectorRecord> getByModel(String model) {
        return records.stream().filter(r -> r.model().equals(model)).toList();
    }
}

class VectorIndex {
    private final InMemoryVectorStore store;
    private final FakeEmbeddingModel currentModel;
    private final String currentModelName;

    VectorIndex(InMemoryVectorStore store, FakeEmbeddingModel currentModel, String currentModelName) {
        this.store = store;
        this.currentModel = currentModel;
        this.currentModelName = currentModelName;
    }

    void upsert(String docId, int chunkIdx, String text, Map<String, String> meta) {
        float[] emb = currentModel.embed(text);
        Map<String, String> m = new HashMap<>(meta);
        m.put("doc_id", docId);
        m.put("chunk_idx", String.valueOf(chunkIdx));
        m.put("embedding_model", currentModelName);   // FIX: lưu model name
        m.put("model_version", java.time.LocalDate.now().toString());
        store.upsert(new VectorRecord(docId + "#" + chunkIdx, text, emb, currentModelName, m));
    }

    List<VectorRecord> search(String query, int topK) {
        float[] qVec = currentModel.embed(query);
        // FIX: chỉ tìm trong vector CÙNG model
        return store.search(qVec, topK, currentModelName);
    }

    // Blue-green re-index: xây store mới, re-index song song, sau đó swap alias
    void reindexAll(String newModelName, FakeEmbeddingModel newModel, Consumer<InMemoryVectorStore> onComplete) {
        InMemoryVectorStore newStore = new InMemoryVectorStore();
        VectorIndex indexer = new VectorIndex(newStore, newModel, newModelName);

        // 1. Re-index dữ liệu cũ (tất cả model) sang model mới
        for (VectorRecord r : store.records) {
            float[] newEmb = newModel.embed(r.text());
            Map<String, String> m = new HashMap<>(r.metadata());
            m.put("embedding_model", newModelName);
            m.put("model_version", java.time.LocalDate.now().toString());
            newStore.upsert(new VectorRecord(r.id(), r.text(), newEmb, newModelName, m));
        }
        // 2. Gọi callback với store mới (production: swap alias trong vector DB)
        onComplete.accept(newStore);
    }
}`,
  hints: [
    'Đọc log: query model mới nhưng "returned chunks from OLD model". Code search() không truyền model filter, store.search tìm trên tất cả records.',
    'Hai model khác nhau (v1 vs v2) cho KHÁC vector cho CÙNG text (xem FakeEmbeddingModel constructor dùng name.hashCode()). Cosine giữa vector v1 và v2 của cùng text là ngẫu nhiên (~0.1-0.2), không phải ~1.0.',
    'Cần: (1) upsert() ghi embedding_model vào record; (2) search() lọc theo currentModelName; (3) reindexAll() tạo store mới, embed lại TẤT CẢ text bằng model mới, rồi callback swap store (blue-green).',
  ],
  rootCause: `**Thay đổi model embedding mà không re-index và không lưu model version trên vector, khiến vector space bị "nhiễu" cross-model.** 
- Model {{text-embedding-3-small}} (v1) và {{text-embedding-3-large}} (v2) cùng dimension 1536 nhưng **không gian vector hoàn toàn khác nhau**. Vector của "hạn mức tín dụng" nhúng bằng v1 và v2 có cosine similarity chỉ ~0.1-0.2 (gần vuông góc), không phải ~0.9.
- Hệ thống ghi chunk mới bằng v2, nhưng query cũng dùng v2. Khi search trên toàn bộ index (v1 + v2), vector query v2 so sánh với vector document v1 cho điểm thấp ngẫu nhiên, còn so với v2 thì cao. Do v1 chiếm đa số (2.3M vs vài ngàn), top-K bị lấn bởi v1 -> kết quả vô nghĩa.
- Recall@5 rơi từ 0.82 → 0.31 vì chỉ ~30% chunk là v2, và retrieval không lọc model.
- Không lưu {{embedding_model}} trên vector -> không thể lọc, không thể audit, không thể re-index chọn lọc.

Dẫn chứng: log {{results have low similarity (avg=0.12)}} và {{returned chunks from OLD model}}. Dashboard chỉ monitor latency, không monitor recall/quality.`,
  fix: `### Cách sửa trong bài
1. **Lưu embedding_model trên từng vector**: {{upsert}} ghi {{metadata.embedding_model = currentModelName}}.
2. **Query chỉ tìm trong cùng model**: {{search}} truyền {{modelFilter = currentModelName}} vào vector store.
3. **Blue-green re-index**: tạo store mới, embed lại **toàn bộ corpus** (cả chunk cũ v1 và chunk mới v2) bằng model mới, rồi **swap alias** (con trỏ store) một lần. Không xóa index cũ cho đến khi index mới sẵn sàng.
~~~java
// upsert
m.put("embedding_model", currentModelName);
store.upsert(new VectorRecord(..., currentModelName, m));

// search
return store.search(qVec, topK, currentModelName);

// reindexAll (background)
InMemoryVectorStore newStore = new InMemoryVectorStore();
VectorIndex indexer = new VectorIndex(newStore, newModel, newModelName);
for (VectorRecord r : store.records) {
    float[] newEmb = newModel.embed(r.text());
    Map<String, String> m = new HashMap<>(r.metadata());
    m.put("embedding_model", newModelName);
    newStore.upsert(new VectorRecord(r.id(), r.text(), newEmb, newModelName, m));
}
onComplete.accept(newStore);  // production: swap index alias
~~~

### Trên production thật (Pinecone, Weaviate, Qdrant, Milvus)
- **Namespace per model**: mỗi model một namespace/collection riêng. Query chỉ search trong namespace của model hiện tại. Re-index = tạo namespace mới, upsert song song, xóa namespace cũ khi xong.
- **Metadata filter**: vector DB hỗ trợ filter {{embedding_model = "v2"}} khi search — hiệu quả hơn client-side filter.
- **Zero-downtime re-index**: dùng **alias/index pointer** (Pinecone: index alias; Elasticsearch: index alias; Qdrant: collection alias). Background job tạo index mới, upsert batch (throttle để không quá tải), verify recall trên sample, rồi swap alias atomic.
- **Canary rollout**: sau swap alias, route 5% traffic sang index mới, monitor recall/latency 30 phút, mới 100%.
- **Model versioning**: lưu {{model_name}}, {{model_version}}, {{indexed_at}} trên từng vector. Hỗ trợ rollback ngay nếu model mớiराब hơn.
- **Observability**: metric {{vector_cross_model_query_total}}, {{recall_at_k_per_model}}, {{reindex_progress}}, {{reindex_duration}}.

### Phòng ngừa
- Quy tắc: **không bao giờ** đổi embedding model mà không có kế hoạch re-index đầy đủ (documented, tested, có rollback).
- CI: test cross-model search phải FAIL (query v2 không được trả v1).
- Chaos test: re-index giữa chừng bị kill, verify alias không bị swap nửa chừng.

### Liên hệ phỏng vấn
Khi hỏi "đổi embedding model thế nào cho không sập recall", trả lời: (1) vector space khác model -> không so sánh cross-model được, (2) lưu model trên vector, query filter theo model, (3) blue-green re-index toàn bộ corpus, swap alias, (4) canary + observability. Nhấn mạnh: dimension giống nhau **không có nghĩa** là vector space giống nhau.`,
  related: ['ai-016', 'ai-056'],
  tags: ['embedding', 'vector search', 're-index', 'model migration', 'blue-green', 'recall', 'RAG']
},
{
  id: 'bug-049',
  title: 'Ước lượng token bằng chars/4 làm 7% hội thoại tiếng Việt vượt context, provider trả 400',
  domain: 'AI / LLM integration',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** app-tuvan (Spring Boot 3.2) là trợ lý tư vấn sản phẩm ngân hàng cho khách Việt Nam. Mỗi lượt, service ghép system prompt (luật an toàn) với toàn bộ lịch sử hội thoại rồi gửi cho model qua provider. Cửa sổ ngữ cảnh (context window — giới hạn token mỗi lần gọi) là 8.000 token. Code hiện tại **ước lượng token bằng công thức chars/4** (số ký tự chia 4, kinh nghiệm cho tiếng Anh: 1 token ≈ 4 ký tự) để quyết định cắt bớt lịch sử cũ trước khi gửi.

**Sự cố:** Trong 7 ngày, **7% request hội thoại dài** (khoảng 1.400/20.000) bị provider trả **HTTP 400** với mã {{context_length_exceeded}}. Đặc điểm: tất cả đều là hội thoại **tiếng Việt có dấu**. Lý do: tiếng Việt có dấu thanh và nhiều âm tiết nên **cùng một nội dung tốn 1,4–2,2 lần token so với tiếng Anh**. Công thức chars/4 (dựa trên ký tự) đánh giá thấp số token thật của tiếng Việt: code tưởng đang gửi 5.000 token (đủ chỗ) nhưng thực tế là 8.500 token (vượt hạn mức). Provider không cắt ngầm mà trả 400 thẳng, request thất bại, người dùng phải gửi lại.

**Nhiệm vụ của bạn:**
1. Đọc code {{TokenEstimator.estimateTokens}} và {{ChatContext.buildMessages}}, tìm vì sao hội thoại tiếng Việt vượt context dù code tưởng đã ép dưới limit.
2. Sửa: (a) đếm token bằng {{FakeTokenizer}} (tokenizer giả xác định, đếm chính xác hơn chars/4 cho tiếng Việt) hoặc hệ số an toàn theo tỉ lệ ký tự non-ASCII; (b) **cắt lịch sử cũ TRƯỚC khi gửi** để tổng token thật ≤ limit; (c) luôn giữ system prompt; (d) nếu system prompt tự nó vượt limit thì ném {{ContextTooLongException}}.
3. Bấm **Chạy test**: test mô phỏng provider thật (dùng {{FakeTokenizer}} làm ground truth) — starter sẽ ném 400 cho hội thoại tiếng Việt dài, reference thì cắt vừa và gửi thành công.`,
  artifacts: [
    { name: 'provider-400.log', lang: 'text', content: `2026-11-12 09:14:02.117 INFO  ChatController : turn=38 sessionId=cs-91244 lang=vi historyMessages=64 estTokens=5120 (chars/4)
2026-11-12 09:14:02.340 WARN  LlmProvider    : HTTP 400 context_length_exceeded limit=8000 actual=8640 sent=true
2026-11-12 09:14:02.341 ERROR ChatController : request failed sessionId=cs-91244, user asks to retry
2026-11-12 09:31:55.884 WARN  LlmProvider    : HTTP 400 context_length_exceeded limit=8000 actual=8910 sent=true
2026-11-12 10:02:11.050 WARN  LlmProvider    : HTTP 400 context_length_exceeded limit=8000 actual=8320 sent=true
2026-11-12 10:02:11.051 WARN  ChatController : 400 rate by lang: vi=96% en=4%` },
    { name: 'token-compare.txt', lang: 'text', content: `Ước lượng chars/4 vs token thật (FakeTokenizer) — cùng nội dung:
  "hạn mức tín dụng của tôi là bao nhiêu"          chars=37  est=10  actual=22   ratio=2.20
  "tôi muốn kiểm tra số dư tài khoản"               chars=32  est=8   actual=19   ratio=2.38
  "lãi suất vay mua nhà ưu đãi năm nay"             chars=35  est=9   actual=18   ratio=2.00
  "what is my credit limit"                         chars=23  est=6   actual=7    ratio=1.17
Phiên cs-91244: historyMessages=64 estTokens=5120 actualTokens=8640 (vượt 8000)` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Message {
    final String role;      // "system" | "user" | "assistant"
    final String content;
    Message(String role, String content) { this.role = role; this.content = content; }
}

// Tokenizer giả xác định: đếm "gần đúng" token thật của provider.
// - Ký tự ASCII (tiếng Anh): ~4 ký tự = 1 token
// - Ký tự non-ASCII (tiếng Việt có dấu, tiếng Nhật...): ~2 ký tự = 1 token (đắt gấp đôi)
// Đây là ground truth để test; provider thật dùng BPE tokenizer riêng nhưng nguyên lý giống.
class FakeTokenizer {
    static int count(String text) {
        if (text == null || text.isEmpty()) return 0;
        int ascii = 0, nonAscii = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c < 128) ascii++; else nonAscii++;
        }
        int asciiTokens = (ascii + 3) / 4;          // ceil(ascii/4)
        int nonAsciiTokens = (nonAscii + 1) / 2;     // ceil(nonAscii/2)
        return asciiTokens + nonAsciiTokens;
    }
    static int count(Message m) { return count(m.content) + 4; }   // +4 overhead role/format
    static int countAll(java.util.List<Message> msgs) {
        int t = 0; for (Message m : msgs) t += count(m); return t;
    }
}

class ContextTooLongException extends RuntimeException {
    ContextTooLongException(String m) { super(m); }
}

// Mô phỏng provider: nếu tổng token thật (FakeTokenizer) > limit thì trả HTTP 400.
class FakeProvider {
    final int limit;
    int lastActualTokens = -1;
    boolean lastReturned400 = false;
    FakeProvider(int limit) { this.limit = limit; }
    void send(java.util.List<Message> messages) {
        int actual = FakeTokenizer.countAll(messages);
        lastActualTokens = actual;
        lastReturned400 = actual > limit;
        if (lastReturned400) throw new RuntimeException("HTTP 400 context_length_exceeded limit=" + limit + " actual=" + actual);
    }
}

// ===== Code cần sửa =====
class TokenEstimator {
    // BUG: ước lượng bằng chars/4 (kinh nghiệm tiếng Anh). Với tiếng Việt có dấu,
    // công thức này đánh giá THẤP số token thật (xem token-compare.txt: ratio 1.4-2.4).
    static int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }
}

class ChatContext {
    private final String systemPrompt;
    private final int tokenLimit;
    private final java.util.List<Message> history = new java.util.ArrayList<>();
    ChatContext(String systemPrompt, int tokenLimit) { this.systemPrompt = systemPrompt; this.tokenLimit = tokenLimit; }
    void add(String role, String content) { history.add(new Message(role, content)); }

    // BUG: dùng TokenEstimator.estimateTokens (chars/4) để quyết định cắt.
    // Vì estimate sai (thấp) cho tiếng Việt, code không cắt đủ (hoặc không cắt),
    // tổng token THẬT vẫn vượt limit -> provider trả 400.
    java.util.List<Message> buildMessages() {
        java.util.List<Message> out = new java.util.ArrayList<>();
        out.add(new Message("system", systemPrompt));
        out.addAll(history);
        // Không cắt, hoặc cắt theo estimate sai. Với tiếng Việt dài, out vượt limit thật.
        return out;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        // 1. Hội thoại tiếng Việt dài: code tưởng dưới limit (chars/4), nhưng token THẬT vượt.
        ChatContext ctx1 = new ChatContext("Bạn là trợ lý ngân hàng. Không cung cấp OTP.", 120);
        // 8 lượt, mỗi lượt tiếng Việt có dấu -> chars/4 cho ~5 token/lượt (est 40+system),
        // nhưng FakeTokenizer cho ~10-12 token/lượt (actual ~90+system). Với limit 120,
        // thêm 20 lượt sẽ vượt actual nhưng chars/4 vẫn tưởng dưới.
        for (int i = 0; i < 20; i++) {
            ctx1.add("user", "hạn mức tín dụng của tôi là bao nhiêu " + "àáảãạăâđêôơư".repeat(3));
            ctx1.add("assistant", "tôi muốn kiểm tra số dư tài khoản " + "íìỉĩịéèẻẽẹ".repeat(3));
        }
        java.util.List<Message> built1 = ctx1.buildMessages();
        FakeProvider p1 = new FakeProvider(120);
        boolean threw1 = false;
        try { p1.send(built1); } catch (RuntimeException e) { threw1 = true; }
        // Starter: chars/4 không cắt -> actual > 120 -> provider 400 (threw1=true, FAIL).
        // Reference: cắt theo FakeTokenizer -> actual <= 120 -> không 400 (PASS).
        check("tieng_viet_khong_vuot_limit", !threw1 && p1.lastActualTokens <= 120,
            "hội thoại tiếng Việt dài phải được cắt để token THẬT <= 120, không được để provider trả 400; actual=" + p1.lastActualTokens + " threw400=" + threw1);

        // 2. System prompt phải luôn được giữ sau khi cắt.
        boolean sys1 = built1.stream().anyMatch(m -> m.role.equals("system") && m.content.contains("OTP"));
        check("system_prompt_giu_duoc", sys1,
            "system prompt (luật an toàn) phải còn trong danh sách gửi đi");

        // 3. Tiếng Anh (ASCII) không bị cắt quá mức: chars/4 và FakeTokenizer cho kết quả gần nhau.
        // Đảm bảo fix không làm hỏng trường hợp tiếng Anh.
        ChatContext ctx2 = new ChatContext("system", 100);
        for (int i = 0; i < 10; i++) {
            ctx2.add("user", "what is my credit limit question number " + i + " " + "x".repeat(20));
            ctx2.add("assistant", "your credit limit answer number " + i + " " + "y".repeat(20));
        }
        java.util.List<Message> built2 = ctx2.buildMessages();
        FakeProvider p2 = new FakeProvider(100);
        boolean threw2 = false;
        try { p2.send(built2); } catch (RuntimeException e) { threw2 = true; }
        check("tieng_anh_khong_vo_hieu_qua", !threw2 && p2.lastActualTokens <= 100,
            "hội thoại tiếng Anh phải nằm trong limit (không bị cắt oan hoặc vượt); actual=" + p2.lastActualTokens + " threw=" + threw2);

        // 4. Code phải thực sự cắt bớt lịch sử khi vượt (không chỉ may mắn dưới limit).
        // So sánh số message gửi đi với số message gốc: phải ít hơn khi vượt.
        ChatContext ctx3 = new ChatContext("luật", 80);
        for (int i = 0; i < 30; i++) {
            ctx3.add("user", "câu hỏi tiếng Việt số " + i + " " + "hạn mức tín dụng ưu đãi".repeat(2));
            ctx3.add("assistant", "trả lời tiếng Việt số " + i + " " + "số dư tài khoản lãi suất".repeat(2));
        }
        int originalCount = 60;   // 30 user + 30 assistant
        java.util.List<Message> built3 = ctx3.buildMessages();
        FakeProvider p3 = new FakeProvider(80);
        boolean threw3 = false;
        try { p3.send(built3); } catch (RuntimeException e) { threw3 = true; }
        check("cat_bot_lich_su_truoc_khi_gui", !threw3 && built3.size() < originalCount && p3.lastActualTokens <= 80,
            "phải cắt bớt lịch sử (gửi ít message hơn) để token thật <= 80; sent=" + built3.size() + " original=" + originalCount + " actual=" + p3.lastActualTokens + " threw=" + threw3);

        // 5. System prompt tự nó vượt limit: phải báo lỗi rõ ràng.
        ChatContext ctx4 = new ChatContext("V".repeat(4000), 100);
        String err4 = null;
        try { ctx4.buildMessages(); } catch (ContextTooLongException e) { err4 = e.getMessage(); }
        check("system_qua_lon_bao_loi", err4 != null,
            "system prompt vượt limit phải ném ContextTooLongException, không được âm thầm bỏ luật");

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Message {
    final String role;      // "system" | "user" | "assistant"
    final String content;
    Message(String role, String content) { this.role = role; this.content = content; }
}

// Tokenizer giả xác định: đếm "gần đúng" token thật của provider.
// - Ký tự ASCII (tiếng Anh): ~4 ký tự = 1 token
// - Ký tự non-ASCII (tiếng Việt có dấu...): ~2 ký tự = 1 token (đắt gấp đôi)
class FakeTokenizer {
    static int count(String text) {
        if (text == null || text.isEmpty()) return 0;
        int ascii = 0, nonAscii = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c < 128) ascii++; else nonAscii++;
        }
        int asciiTokens = (ascii + 3) / 4;
        int nonAsciiTokens = (nonAscii + 1) / 2;
        return asciiTokens + nonAsciiTokens;
    }
    static int count(Message m) { return count(m.content) + 4; }
    static int countAll(java.util.List<Message> msgs) {
        int t = 0; for (Message m : msgs) t += count(m); return t;
    }
}

class ContextTooLongException extends RuntimeException {
    ContextTooLongException(String m) { super(m); }
}

class FakeProvider {
    final int limit;
    int lastActualTokens = -1;
    boolean lastReturned400 = false;
    FakeProvider(int limit) { this.limit = limit; }
    void send(java.util.List<Message> messages) {
        int actual = FakeTokenizer.countAll(messages);
        lastActualTokens = actual;
        lastReturned400 = actual > limit;
        if (lastReturned400) throw new RuntimeException("HTTP 400 context_length_exceeded limit=" + limit + " actual=" + actual);
    }
}

// ===== Code cần sửa =====
class TokenEstimator {
    // FIX: dùng FakeTokenizer (đếm chính xác hơn chars/4 cho tiếng Việt).
    // Trong production thật, dùng tokenizer của model (vd: jtokkit, tiktoken).
    static int estimateTokens(String text) {
        return FakeTokenizer.count(text);
    }
}

class ChatContext {
    private final String systemPrompt;
    private final int tokenLimit;
    private final java.util.List<Message> history = new java.util.ArrayList<>();
    ChatContext(String systemPrompt, int tokenLimit) { this.systemPrompt = systemPrompt; this.tokenLimit = tokenLimit; }
    void add(String role, String content) { history.add(new Message(role, content)); }

    // FIX: đếm token THẬT (FakeTokenizer), dành ngân sách cho system prompt trước,
    // rồi cắt lịch sử từ cũ nhất đến khi tổng <= limit. Luôn giữ system prompt.
    java.util.List<Message> buildMessages() {
        int sysTokens = FakeTokenizer.count(new Message("system", systemPrompt));
        if (sysTokens > tokenLimit) {
            throw new ContextTooLongException("system prompt chiếm " + sysTokens + " token, vượt context " + tokenLimit);
        }
        java.util.List<Message> kept = new java.util.ArrayList<>();
        int used = sysTokens;
        for (int i = history.size() - 1; i >= 0; i--) {
            Message m = history.get(i);
            int mt = FakeTokenizer.count(m);
            if (used + mt <= tokenLimit) {
                kept.add(0, m);
                used += mt;
            } else if (i == history.size() - 1 && tokenLimit - used > 4) {
                // Tin nhắn mới nhất quá lớn: cắt bớt nội dung cho vừa.
                String room = cutToTokens(m.content, tokenLimit - used);
                kept.add(0, new Message(m.role, room));
                break;
            } else {
                break;   // message cũ hơn không vừa: dừng (cắt phần cũ nhất)
            }
        }
        java.util.List<Message> out = new java.util.ArrayList<>();
        out.add(new Message("system", systemPrompt));
        out.addAll(kept);
        return out;
    }

    // Cắt nội dung sao cho FakeTokenizer.count(content) <= roomTokens.
    // Đơn giản: cắt nhị phân trên số ký tự, vì thêm ký tự luôn tăng token.
    static String cutToTokens(String content, int roomTokens) {
        int lo = 0, hi = content.length();
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            if (FakeTokenizer.count(content.substring(0, mid)) <= roomTokens) lo = mid; else hi = mid - 1;
        }
        return content.substring(0, lo);
    }
}`,
  hints: [
    'Đọc token-compare.txt: cùng nội dung tiếng Việt, chars/4 cho est=8-10 nhưng actual=18-22 (ratio 1.4-2.4). Log: estTokens=5120 nhưng provider actual=8640 > limit 8000 -> 400.',
    'Tiếng Việt có dấu thanh (àáảãạ...) và nhiều âm tiết -> mỗi âm tiết thường là 1 token riêng, đắt gấp ~2 lần ký tự ASCII. chars/4 là kinh nghiệm tiếng Anh, không đúng cho tiếng Việt.',
    'Fix: (1) đếm token bằng tokenizer thật/fake chính xác hơn (FakeTokenizer trong test, jtokkit trong production); (2) dành ngân sách cho system prompt; (3) cắt lịch sử từ cũ nhất đến khi tổng THẬT <= limit; (4) system tự vượt limit thì ném ContextTooLongException.',
  ],
  rootCause: `**Ước lượng token bằng chars/4 đánh giá thấp số token thật của tiếng Việt, khiến code tưởng đã ép dưới context nhưng thực tế vượt, provider trả HTTP 400.**

- chars/4 là kinh nghiệm cho **tiếng Anh**: 1 token ≈ 4 ký tự ASCII. Tiếng Việt có **dấu thanh** (à, ả, ã, á...) và **nhiều âm tiết**, mỗi âm tiết thường tách thành 1 token riêng trong BPE tokenizer. Cùng một nội dung, tiếng Việt tốn **1,4–2,2 lần** token so với tiếng Anh (token-compare.txt: ratio 2.20, 2.38, 2.00).
- {{ChatContext.buildMessages}} dùng {{TokenEstimator.estimateTokens}} (chars/4) để quyết định cắt. Với hội thoại tiếng Việt, estimate thấp hơn actual ~2 lần: code tưởng 5.120 token (dưới 8.000) nhưng actual là 8.640 token (vượt). Code không cắt (hoặc cắt không đủ), gửi nguyên -> provider trả 400.
- 7% request hội thoại dài bị 400, **96% trong số đó là tiếng Việt** (log: {{400 rate by lang: vi=96% en=4%}}). Provider không cắt ngầm mà trả 400 thẳng, request thất bại.

Dẫn chứng: log {{estTokens=5120 ... actual=8640}} và {{context_length_exceeded}}. Token-compare cho thấy ratio tiếng Việt gấp ~2 lần tiếng Anh.`,
  fix: `### Cách sửa trong bài
1. **Đếm token bằng tokenizer chính xác** (FakeTokenizer trong test; trong production dùng {{jtokkit}} hoặc tokenizer của model như {{tiktoken}}). Công thức: ASCII ~4 ký tự/token, non-ASCII ~2 ký tự/token. Nếu không nhúng tokenizer, dùng **hệ số an toàn theo ngôn ngữ**: nhân estimate với 1.8–2.2 khi tỉ lệ ký tự non-ASCII cao (tiếng Việt, Nhật, Hàn...).
2. **Dành ngân sách cho system prompt trước**: nếu system prompt tự nó > limit thì ném {{ContextTooLongException}} — thà báo lỗi còn hơn gửi request chắc chắn bị 400.
3. **Cắt lịch sử từ cũ nhất** (sliding window): duyệt từ message mới nhất về cũ, chỉ giữ message còn vừa ngân sách còn lại. Đây là cách cắt đúng: luôn giữ ngữ cảnh gần nhất, bỏ phần cũ.
4. **Tin nhắn mới nhất quá lớn thì cắt nội dung** cho vừa phần ngân sách còn lại (mất một phần tin nhắn mới vẫn tốt hơn mất system prompt hoặc bị 400).
5. **Đo token thật từ response {{usage}}} của provider** (production) để hiệu chỉnh hệ số, không đoán mò.

~~~java
int sysTokens = FakeTokenizer.count(new Message("system", systemPrompt));
if (sysTokens > tokenLimit) throw new ContextTooLongException("system quá lớn");
int used = sysTokens;
List<Message> kept = new ArrayList<>();
for (int i = history.size() - 1; i >= 0; i--) {
    Message m = history.get(i);
    int mt = FakeTokenizer.count(m);
    if (used + mt <= tokenLimit) { kept.add(0, m); used += mt; }
    else if (i == history.size() - 1) { kept.add(0, new Message(m.role, cutToTokens(m.content, tokenLimit - used))); break; }
    else break;
}
~~~

### Trên production thật
- **Dùng tokenizer của model**: {{jtokkit}} (Java, hỗ trợ nhiều encoding: cl100k_base, o200k_base...), hoặc gọi API {{/tokenize}} nếu provider hỗ trợ. Đây là cách chính xác nhất.
- **Hệ số an toàn theo ngôn ngữ**: nếu không nhúng tokenizer, nhân estimate chars/4 với 1.8 khi phát hiện tỉ lệ non-ASCII > 30%. Đo token thật từ {{usage.prompt_tokens}} của provider để hiệu chỉnh hệ số.
- **Dùng chat memory có giới hạn của framework**: LangChain4j {{TokenWindowChatMemory}}, Spring AI {{MessageWindowChatMemory}} — chúng đếm token và tự cắt.
- **Tóm tắt phần cũ (summarization)** thay vì bỏ hẳn, khi cần giữ ngữ cảnh dài.
- **Observability**: ghi {{est_tokens}} vs {{actual_tokens}} (từ response usage), tỉ lệ request bị 400 theo ngôn ngữ, số message bị cắt. Cảnh báo khi tỉ lệ 400 > 1%.

### Phòng ngừa
- Test hồi quy: một hội thoại tiếng Việt 64 message phải được cắt để actual ≤ limit (không chỉ est ≤ limit).
- CI: so sánh est vs actual trên một corpus đa ngôn ngữ, cảnh báo nếu sai lệch > 30%.
- Không bao giờ tin chars/4 cho nội dung không phải tiếng Anh.

### Liên hệ phỏng vấn
Khi hỏi "tiếng Việt tốn token hơn tiếng Anh, bạn ước lượng và kiểm soát thế nào", trả lời: (1) chars/4 là kinh nghiệm tiếng Anh, sai cho tiếng Việt (ratio 1.4–2.2); (2) dùng tokenizer thật (jtokkit) hoặc hệ số an toàn theo tỉ lệ non-ASCII; (3) dành ngân sách system prompt, cắt sliding window từ cũ; (4) đo actual từ usage để hiệu chỉnh. Nhấn mạnh: token là đơn vị tính tiền và giới hạn của model, không phải ký tự — phải đo đúng ngôn ngữ.

> Senior tip: đừng bao giờ hardcode chars/4 cho đa ngôn ngữ. Tiếng Việt có dấu, tiếng Nhật dùng kanji, tiếng Hàn dùng block — mỗi ngôn ngữ có mật độ token khác nhau. Dùng tokenizer của model, hoặc ít nhất nhân hệ số an toàn 1.8–2.2 khi nội dung không phải ASCII, và luôn đo actual từ response usage để hiệu chỉnh.`,
  related: ['ai-149', 'ai-058'],
  tags: ['LLM', 'token', 'tokenizer', 'context window', 'tiếng Việt', 'jtokkit', 'multilingual']
},
{
  id: 'bug-050',
  title: 'Bỏ qua header Retry-After khi 429: 200 instance retry ngay 5 lần gây bão request, khoá API key 10 phút',
  domain: 'AI / LLM integration',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** customer-service (Spring Boot 3.2, **200 instance**) gọi LLM provider để trả lời khách. Provider giới hạn tốc độ (rate limit) theo API key: khi vượt, trả **HTTP 429** kèm header {{Retry-After: <giây>}} (số giây provider yêu cầu chờ trước khi thử lại). Lớp {{RateLimitedClient.callWithRetry}} được viết để "chống lỗi tạm thời": gặp 429 thì thử lại **ngay lập tức** tối đa 5 lần (không đọc header Retry-After, không chờ, hoặc chờ cố định 50 ms).

**Sự cố:** 14:02 ngày 08/11, một chiến dịch marketing đẩy lượng chat tăng đột biến. Provider bắt đầu trả 429 kèm {{Retry-After: 2}} (yêu cầu chờ 2 giây). Nhưng client bỏ qua header, retry ngay 5 lần mỗi request. Với 200 instance, mỗi request thất bại tạo thêm 5 request trong vòng vài mili giây -> **bão request** (request storm). Provider phát hiện lưu lượng bất thường từ một API key, **khoá API key đó 10 phút** (phòng chống lạm dụng). Toàn bộ customer-service mất LLM trong 10 phút, 12.000 cuộc chat bị gián đoạn.

**Nhiệm vụ của bạn:**
1. Đọc code {{RateLimitedClient.callWithRetry}} và {{FakeRateLimitServer}}, tìm vì sao 429 bị retry ngay thay vì chờ theo Retry-After.
2. Sửa: (a) **tôn trọng header Retry-After**: nếu có, chờ đúng số giây đó (dùng {{FakeClock}}/{{Sleeper}}); (b) nếu không có header, dùng **exponential backoff có jitter** (Random seed cố định trong test) — chờ ngẫu nhiên trong [0, min(cap, base*2^(n-1))]; (c) **giới hạn retry toàn cục**: dùng {{RetryBudget}} chia sẻ giữa các instance, khi cạn budget thì fail nhanh thay vì tiếp tục nhân tải.
3. Bấm **Chạy test**: test mô phỏng provider 429 với Retry-After, kiểm tra client chờ đúng, không tạo bão, và tôn trọng budget toàn cục. Clock giả (FakeClock) + Random seed cố định để test xác định.`,
  artifacts: [
    { name: 'provider-429-storm.log', lang: 'text', content: `2026-11-08 14:02:11.050 WARN  RateLimitFilter : key=sk-ai-*** 429 Retry-After=2 req=cs-88213
2026-11-08 14:02:11.052 WARN  RateLimitedClient: 429 attempt=1 retry immediately (0ms)
2026-11-08 14:02:11.053 WARN  RateLimitedClient: 429 attempt=2 retry immediately (0ms)
2026-11-08 14:02:11.053 WARN  RateLimitedClient: 429 attempt=3 retry immediately (0ms)
2026-11-08 14:02:11.054 WARN  RateLimitedClient: 429 attempt=4 retry immediately (0ms)
2026-11-08 14:02:11.054 WARN  RateLimitedClient: 429 attempt=5 giving up
2026-11-08 14:02:11.055 WARN  RateLimitFilter : key=sk-ai-*** request storm detected: 200 instances * 5 retries in <100ms
2026-11-08 14:02:11.100 ERROR RateLimitFilter : API key sk-ai-*** LOCKED for 600s (rate limit abuse protection)
2026-11-08 14:12:11.100 WARN  RateLimitFilter : API key sk-ai-*** unlocked (auto-expire)` },
    { name: 'request-storm-stats.txt', lang: 'text', content: `Thời điểm 14:02:11 (trong vòng 100ms):
  Số instance                  : 200
  Số request gốc               : ~200 (mỗi instance 1 chat)
  Số retry mỗi request         : 5 (retry ngay, không chờ Retry-After)
  Tổng request tới provider    : ~200 * 5 = 1000 request trong <100ms
  ngưỡng phát hiện lạm dụng    : > 500 request/100ms từ 1 key
  -> API key bị khoá 600s
  -> 12.000 cuộc chat bị gián đoạn trong 10 phút` },
  ],
  starter: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
// Phản hồi từ provider: status + header Retry-After (giây, -1 nếu không có).
class Response {
    final int status;
    final long retryAfterSeconds;   // -1 = không có header Retry-After
    Response(int status, long retryAfterSeconds) { this.status = status; this.retryAfterSeconds = retryAfterSeconds; }
}

// Server giả lập provider: trả 429 kèm Retry-After cho N lần đầu, sau đó trả 200.
// Đếm số request để test phát hiện bão request.
class FakeRateLimitServer {
    final int failCount;            // số lần đầu trả 429
    final long retryAfterSeconds;   // giá trị Retry-After
    int calls = 0;
    FakeRateLimitServer(int failCount, long retryAfterSeconds) {
        this.failCount = failCount; this.retryAfterSeconds = retryAfterSeconds;
    }
    Response call() {
        calls++;
        if (calls <= failCount) return new Response(429, retryAfterSeconds);
        return new Response(200, -1);
    }
}

// Ghi lại thời gian chờ (không ngủ thật) để test kiểm tra xác định.
class Sleeper {
    final java.util.List<Long> sleeps = new java.util.ArrayList<>();
    void sleep(long ms) { sleeps.add(ms); }
}

// Clock giả: bây giờ ảo = tổng các lần sleep. Test dùng để kiểm tra logic theo thời gian.
class FakeClock {
    long nowMs = 0;
    void advance(long ms) { nowMs += ms; }
    long now() { return nowMs; }
}

// Ngân sách retry toàn cục: chia sẻ giữa các instance. Khi cạn, fail nhanh.
class RetryBudget {
    final int maxRetries;
    int used = 0;
    RetryBudget(int maxRetries) { this.maxRetries = maxRetries; }
    boolean tryConsume() {
        if (used >= maxRetries) return false;
        used++;
        return true;
    }
    int remaining() { return maxRetries - used; }
}

// ===== Code cần sửa =====
class RateLimitedClient {
    private final FakeRateLimitServer server;
    private final Sleeper sleeper;
    private final java.util.Random random;
    private final RetryBudget budget;
    private final FakeClock clock;

    RateLimitedClient(FakeRateLimitServer server, Sleeper sleeper, java.util.Random random, RetryBudget budget, FakeClock clock) {
        this.server = server; this.sleeper = sleeper; this.random = random; this.budget = budget; this.clock = clock;
    }

    // BUG: gặp 429 thì retry NGAY 5 lần, không đọc Retry-After, không dùng budget, không backoff.
    Response callWithRetry() {
        Response r = null;
        for (int i = 0; i < 5; i++) {
            r = server.call();
            if (r.status < 400) return r;
            // BUG: bỏ qua r.retryAfterSeconds, retry ngay
            sleeper.sleep(0);
        }
        return r;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) {
        // 1. Tôn trọng Retry-After: server trả 429 Retry-After=2 (giây) 1 lần rồi 200.
        // Client phải chờ >= 2000ms trước khi retry, chỉ gọi 2 lần.
        FakeRateLimitServer s1 = new FakeRateLimitServer(1, 2);   // 429 với Retry-After=2, sau đó 200
        Sleeper sl1 = new Sleeper();
        FakeClock clk1 = new FakeClock();
        RetryBudget b1 = new RetryBudget(10);
        Response r1 = new RateLimitedClient(s1, sl1, new java.util.Random(42), b1, clk1).callWithRetry();
        long firstWait = sl1.sleeps.isEmpty() ? -1 : sl1.sleeps.get(0);
        // Starter: sleep(0) -> firstWait=0 (FAIL). Reference: sleep(2000) -> firstWait>=2000 (PASS).
        check("ton_trong_retry_after", r1.status == 200 && s1.calls == 2 && firstWait >= 2000,
            "phải chờ theo Retry-After (>=2000ms) trước khi retry; firstWait=" + firstWait + "ms calls=" + s1.calls);

        // 2. Không có Retry-After: dùng exponential backoff có jitter (Random seed cố định).
        // Server trả 429 không có header (retryAfterSeconds=-1) 2 lần rồi 200.
        // Với seed 42, lần chờ đầu phải trong [0, 100], lần 2 trong [0, 200], và > 0 (có jitter).
        FakeRateLimitServer s2 = new FakeRateLimitServer(2, -1);
        Sleeper sl2 = new Sleeper();
        FakeClock clk2 = new FakeClock();
        RetryBudget b2 = new RetryBudget(10);
        Response r2 = new RateLimitedClient(s2, sl2, new java.util.Random(42), b2, clk2).callWithRetry();
        boolean backoffOk = sl2.sleeps.size() >= 2
            && sl2.sleeps.get(0) >= 0 && sl2.sleeps.get(0) <= 100
            && sl2.sleeps.get(1) >= 0 && sl2.sleeps.get(1) <= 200
            && sl2.sleeps.get(0) > 0;   // có jitter, không phải 0
        // Starter: sleep(0), sleep(0) -> sleeps=[0,0], get(0)=0 (FAIL jitter).
        check("backoff_co_jitter_khong_header", r2.status == 200 && backoffOk,
            "không có Retry-After phải dùng backoff lũy tiến có jitter; sleeps=" + sl2.sleeps);

        // 3. Giới hạn retry toàn cục: budget=3, server luôn 429 Retry-After=1.
        // Client phải dừng khi cạn budget, không retry quá 3 lần.
        FakeRateLimitServer s3 = new FakeRateLimitServer(999, 1);   // luôn 429
        Sleeper sl3 = new Sleeper();
        FakeClock clk3 = new FakeClock();
        RetryBudget b3 = new RetryBudget(3);
        Response r3 = new RateLimitedClient(s3, sl3, new java.util.Random(42), b3, clk3).callWithRetry();
        // Starter: không dùng budget, gọi 5 lần -> s3.calls=5 (FAIL).
        // Reference: dùng budget, chỉ retry khi budget còn -> calls <= 4 (1 số + 3 retry), budget cạn -> dừng.
        check("gioi_han_retry_toan_cuc", r3.status == 429 && s3.calls <= 4 && b3.remaining() == 0,
            "phải dừng khi cạn budget (3 retry), không gọi quá 4 lần; calls=" + s3.calls + " budget con=" + b3.remaining());

        // 4. Nhiều instance chia sẻ budget: 200 instance, budget=50 retry.
        // Tổng số retry trên tất cả instance không được vượt 50 (chống bão request).
        FakeRateLimitServer s4 = new FakeRateLimitServer(999, 1);   // luôn 429
        Sleeper sl4 = new Sleeper();
        FakeClock clk4 = new FakeClock();
        RetryBudget sharedBudget = new RetryBudget(50);
        int totalCalls = 0;
        for (int i = 0; i < 200; i++) {
            FakeRateLimitServer s = new FakeRateLimitServer(999, 1);   // mỗi instance server riêng, luôn 429
            Sleeper sl = new Sleeper();
            new RateLimitedClient(s, sl, new java.util.Random(i), sharedBudget, clk4).callWithRetry();
            totalCalls += s.calls;
        }
        // Mỗi instance gọi 1 lần + retry khi budget còn. Tổng retry <= 50 -> totalCalls <= 200 + 50 = 250.
        // Starter: mỗi instance gọi 5 lần -> totalCalls = 200*5 = 1000 (FAIL).
        check("nhieu_instance_khong_bao_request", totalCalls <= 250 && sharedBudget.remaining() == 0,
            "200 instance chia sẻ budget 50: tổng request <= 250 (200 gốc + 50 retry), không được 1000; totalCalls=" + totalCalls + " budget con=" + sharedBudget.remaining());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (đã có sẵn trong dự án, KHÔNG cần sửa) =====
class Response {
    final int status;
    final long retryAfterSeconds;
    Response(int status, long retryAfterSeconds) { this.status = status; this.retryAfterSeconds = retryAfterSeconds; }
}

class FakeRateLimitServer {
    final int failCount;
    final long retryAfterSeconds;
    int calls = 0;
    FakeRateLimitServer(int failCount, long retryAfterSeconds) {
        this.failCount = failCount; this.retryAfterSeconds = retryAfterSeconds;
    }
    Response call() {
        calls++;
        if (calls <= failCount) return new Response(429, retryAfterSeconds);
        return new Response(200, -1);
    }
}

class Sleeper {
    final java.util.List<Long> sleeps = new java.util.ArrayList<>();
    void sleep(long ms) { sleeps.add(ms); }
}

class FakeClock {
    long nowMs = 0;
    void advance(long ms) { nowMs += ms; }
    long now() { return nowMs; }
}

class RetryBudget {
    final int maxRetries;
    int used = 0;
    RetryBudget(int maxRetries) { this.maxRetries = maxRetries; }
    boolean tryConsume() {
        if (used >= maxRetries) return false;
        used++;
        return true;
    }
    int remaining() { return maxRetries - used; }
}

// ===== Code cần sửa =====
class RateLimitedClient {
    static final int MAX_ATTEMPTS = 5;          // tổng số lần gọi (1 gốc + tối đa 4 retry)
    static final long BASE_MS = 100, CAP_MS = 1000;
    private final FakeRateLimitServer server;
    private final Sleeper sleeper;
    private final java.util.Random random;
    private final RetryBudget budget;
    private final FakeClock clock;

    RateLimitedClient(FakeRateLimitServer server, Sleeper sleeper, java.util.Random random, RetryBudget budget, FakeClock clock) {
        this.server = server; this.sleeper = sleeper; this.random = random; this.budget = budget; this.clock = clock;
    }

    static boolean retryable(int status) { return status == 429 || status == 502 || status == 503 || status == 504; }

    Response callWithRetry() {
        Response r = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            r = server.call();
            if (!retryable(r.status)) return r;     // thành công hoặc lỗi vĩnh viễn
            if (attempt == MAX_ATTEMPTS) break;
            // FIX: nếu không còn budget retry toàn cục, dừng ngay (fail nhanh, không nhân tải).
            if (!budget.tryConsume()) break;

            long waitMs;
            if (r.retryAfterSeconds >= 0) {
                // FIX: tôn trọng header Retry-After (giây -> mili giây)
                waitMs = r.retryAfterSeconds * 1000;
            } else {
                // FIX: exponential backoff có jitter: [0, min(cap, base*2^(attempt-1))]
                long ceiling = Math.min(CAP_MS, BASE_MS << (attempt - 1));
                waitMs = (long) (random.nextDouble() * (ceiling + 1));
            }
            sleeper.sleep(waitMs);
            clock.advance(waitMs);
        }
        return r;
    }
}`,
  hints: [
    'Đọc log: 429 Retry-After=2 nhưng "retry immediately (0ms)" -> client bỏ qua header. Với 200 instance * 5 retry = 1000 request/100ms > ngưỡng 500 -> API key bị khoá 600s.',
    'Retry-After là header HTTP (RFC 7231) báo số giây client nên chờ trước khi thử lại. Tôn trọng nó = chờ đúng số giây đó. Nếu không có header, dùng exponential backoff + jitter: lần chờ thứ n = random [0, min(1000, 100*2^(n-1))] ms.',
    'RetryBudget chia sẻ giữa các instance: mỗi lần retry phải ask budget trước; khi cạn (vd 50 retry cho 200 instance), fail nhanh thay vì tiếp tục gọi. Đây là retry budget / circuit breaker pattern.',
  ],
  rootCause: `**Client bỏ qua header Retry-After của 429, retry ngay 5 lần mỗi request, từ 200 instance cùng lúc, tạo bão request khiến provider khoá API key 10 phút.**

- Provider trả 429 kèm {{Retry-After: 2}} (yêu cầu chờ 2 giây). Đây là tín hiệu rõ ràng: "đừng gọi lại trước 2 giây". Nhưng {{RateLimitedClient.callWithRetry}} không đọc header, chỉ {{sleeper.sleep(0)}} rồi retry ngay.
- Mỗi request thất bại tạo thêm 5 request trong vòng vài mili giây. Với 200 instance, tổng tải = 200 × 5 = **1000 request trong <100ms**, vượt ngưỡng phát hiện lạm dụng (>500 request/100ms/key).
- Provider khoá API key 600s (10 phút) để bảo vệ. Toàn bộ customer-service mất LLM trong 10 phút, 12.000 cuộc chat gián đoạn.
- Đây là **retry storm** (bão retry) kinh điển: retry không kiểm soát khuếch đại một sự cố tạm thời thành sự cố diện rộng. Không có retry budget toàn cục nên không có "phanh".

Dẫn chứng: log {{429 Retry-After=2 ... retry immediately (0ms)}} và {{request storm detected: 200 instances * 5 retries in <100ms}}. Request-storm-stats: 1000 request/100ms > ngưỡng 500.`,
  fix: `### Cách sửa trong bài
1. **Tôn trọng header Retry-After**: khi 429 (hoặc 503) có header Retry-After, chờ đúng số giây đó (đổi sang mili giây) trước khi retry. Đây là tín hiệu từ provider, luôn ưu tiên hơn backoff tự tính.
2. **Exponential backoff có jitter khi không có header**: lần chờ thứ n = ngẫu nhiên trong [0, min(1000, 100×2^(n-1))] ms. Full jitter (AWS Architecture Blog) trải đều thời điểm retry của nhiều instance, tránh thundering herd.
3. **RetryBudget toàn cục**: chia sẻ một ngân sách retry (vd 50 retry/giây) giữa tất cả instance. Mỗi lần retry phải {{tryConsume}} budget trước; khi cạn, fail nhanh thay vì tiếp tục gọi. Đây là "retry budget" — một lớp phòng vệ quan trọng của hệ thống phân tán.
4. **Giới hạn số lần gọi**: tối đa 5 lần (1 gốc + 4 retry), không chờ sau lần cuối.
5. **Kết hợp circuit breaker** (Resilience4j): khi downstream lỗi liên tục, mở mạch, trả lỗi nhanh, thử lại sau.

~~~java
if (r.retryAfterSeconds >= 0) {
    waitMs = r.retryAfterSeconds * 1000;          // tôn trọng Retry-After
} else {
    long ceiling = Math.min(CAP_MS, BASE_MS << (attempt - 1));   // 100, 200, 400, 800, trần 1000
    waitMs = (long) (random.nextDouble() * (ceiling + 1));       // full jitter
}
if (!budget.tryConsume()) break;   // cạn budget retry toàn cục -> dừng
sleeper.sleep(waitMs);
~~~

### Trên production thật
| Lớp phòng vệ | Tác dụng |
|---|---|
| Tôn trọng Retry-After | Downstream tự nói khi nào nên quay lại |
| Exponential backoff + full jitter | Trải đều retry, tránh thundering herd |
| **Retry budget** (vd 10% số request thành công) | Khi lỗi diện rộng, tự ngừng retry |
| **Circuit breaker** (Resilience4j) | Downstream lỗi liên tục thì mở mạch, trả lỗi nhanh |
| Chỉ retry ở **một tầng** | Gateway + service + client retry = nhân bội |
| Rate limiter phía client | Tự giới hạn tốc độ gọi, không vượt quota provider |

Với Resilience4j: {{IntervalFunction.ofExponentialRandomBackoff(...)}} cho retry, kết hợp CircuitBreaker. Chỉ retry thao tác **idempotent** (đọc là an toàn; ghi tiền phải có idempotency key).

### Phòng ngừa
- Dashboard theo dõi tỉ lệ request retry / tổng request, cảnh báo khi vượt ngưỡng.
- Feature flag tắt retry khẩn cấp (đội bug-017 đã có, đây là thứ cứu sự cố).
- Game day: giả lập provider trả 429 với Retry-After, đo xem client có chờ đúng và không tạo bão không.
- Test tải: 200 instance cùng retry, đảm bảo tổng request không vượt budget.

### Liên hệ phỏng vấn
Khi hỏi "xử lý 429 thế nào cho không bị khoá API key", trả lời: (1) luôn đọc và tôn trọng header Retry-After; (2) nếu không có, dùng exponential backoff + full jitter; (3) retry budget toàn cục + circuit breaker để không nhân tải khi lỗi diện rộng; (4) chỉ retry ở một tầng, chỉ retry thao tác idempotent. Nhấn mạnh: retry là con dao hai lưỡi — không kiểm soát sẽ biến sự cố nhỏ thành downtime diện rộng.

> Senior tip: Retry-After là hợp đồng giữa client và server. Server nói "chờ 2 giây" thì client phải chờ 2 giây, không phải 0ms. Bỏ qua header không chỉ là thiếu tôn trọng — nó là nguyên nhân trực tiếp của retry storm và API key bị khoá. Luôn kết hợp Retry-After + jitter + retry budget + circuit breaker; chỉ retry ở một tầng với thao tác idempotent.`,
  related: ['ai-069', 'ai-064'],
  tags: ['retry', 'Retry-After', '429', 'rate limit', 'backoff', 'jitter', 'retry budget', 'circuit breaker', 'thundering herd']
},
{
  id: 'bug-051',
  title: 'Rò rỉ kết nối HTTP client không đồng bộ làm cạn connection pool, service treo 15 phút',
  domain: 'Máy khách HTTP / Quản lý kết nối',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Service {{PaymentGateway}} (Spring Boot 3.2, WebClient) gọi API ngân hàng bên thứ ba để xác thực thẻ. Cấu hình connection pool mặc định 200 kết nối, timeout 10 giây. Code dùng {{WebClient}}แบบ không đồng bộ, trả về {{Mono<PaymentResponse>}} nhưng **không subscribe** (hoặc subscribe nhưng không xử lý body khi lỗi), dẫn đến response body không được đọc hết -> kết nối không trả về pool.
  **Sự cố:** 09:30 ngày 12/11, ngân hàng bên thứ ba chậm phản hồi (trung bình 8 giây, đôi khi 30 giây). {{PaymentGateway}} nhận request, gửi đi, nhưng khi timeout hoặc exception xảy ra, code ném lỗi mà **không consume response body**. Mỗi request thất bại giữ một kết nối trong pool. 200 request/giây * 10% thất bại = 20 kết nối rò rỉ/giây. Sau 10 phút, pool 200 kết nối cạn hết -> mọi request mới bị chờ vô hạn ({{PoolAcquirePendingException}}). 12.000 giao dịch thanh toán bị từ chối.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{HttpClient.call}} và log, tìm vì sao kết nối không trả về pool khi có lỗi/timeout.
  2. Sửa: (a) luôn consume response body (dù thành công hay lỗi) bằng {{bodyToMono(Void.class).subscribe()}} hoặc {{ExchangeFilterFunction}}; (b) dùng {{doOnError}}/{{doFinally}} để đảm bảo release; (c) cấu hình {{maxIdleTime}} và {{evictionPredicate}} để pool tự dọn dẹp kết nối chết.
  3. Bấm **Chạy test**: test mô phỏng server chậm + timeout, kiểm tra pool không cạn khi gọi liên tục 1000 lần. Clock giả + CountDownLatch để test xác định.`,
  artifacts: [
    { name: 'webclient-leak.log', lang: 'text', content: `2026-11-12 09:30:11.100 WARN  ReactorNetty : [id: 0x1a2b3c4d] Channel acquired, pool size=199
2026-11-12 09:30:11.105 WARN  ReactorNetty : [id: 0x1a2b3c4e] Channel acquired, pool size=198
...
2026-11-12 09:40:11.500 ERROR ReactorNetty : [id: 0x1a2b3c4d] PoolAcquirePendingException: Pending acquire queue has reached its maximum size of 200
2026-11-12 09:40:11.505 ERROR PaymentGateway : HTTP call failed, connection not released, pool exhausted` },
    { name: 'thread-dump-2026-11-12.txt', lang: 'text', content: `THREAD DUMP 09:40:11
"reactor-http-nio-1" #123 prio=5 os_prio=0 cpu=12.34ms elapsed=600.01s tid=0x00007f8b4c000000 nid=0x1a2b waiting on condition [0x00007f8b3e8f0000]
   java.lang.Thread.State: WAITING (parking)
   at jdk.internal.misc.Unsafe.park(Native Method)
   at java.util.concurrent.locks.LockSupport.park(LockSupport.java:341)
   at reactor.netty.resources.PendingAcquireQueue.parkAndWait(PendingAcquireQueue.java:145)
   at reactor.netty.resources.Pool.acquire(Pool.java:189)
   at reactor.netty.http.client.HttpClientConnect.connect(HttpClientConnect.java:67)
   ...` }
  ],
  starter: `// ===== Hạ tầng (mô phỏng HTTP client + connection pool, KHÌNG cần sửa) =====
class MockConnection {
    final String id;
    boolean released = false;
    MockConnection(String id) { this.id = id; }
    void release() { released = true; }
}

class MockConnectionPool {
    final int maxSize;
    final List<MockConnection> available = new ArrayList<>();
    final List<MockConnection> inUse = new ArrayList<>();
    int created = 0;
    MockConnectionPool(int maxSize) { this.maxSize = maxSize; }
    synchronized MockConnection acquire() {
        if (!available.isEmpty()) {
            MockConnection c = available.remove(available.size() - 1);
            inUse.add(c);
            return c;
        }
        if (created < maxSize) {
            MockConnection c = new MockConnection("conn-" + created++);
            inUse.add(c);
            return c;
        }
        throw new IllegalStateException("Pool exhausted: " + inUse.size() + " in use, 0 available");
    }
    synchronized void release(MockConnection c) {
        inUse.remove(c);
        if (c.released) available.add(c);
    }
    int availableCount() { return available.size(); }
    int inUseCount() { return inUse.size(); }
}

class MockHttpResponse {
    final int status;
    final String body;
    boolean consumed = false;
    MockHttpResponse(int status, String body) { this.status = status; this.body = body; }
    void consume() { consumed = true; }
}

interface SlowServer {
    MockHttpResponse call() throws InterruptedException;
}

class CountDownLatch {
    private int count;
    CountDownLatch(int count) { this.count = count; }
    synchronized void await() throws InterruptedException { while (count > 0) wait(); }
    synchronized void countDown() { if (--count == 0) notifyAll(); }
}

// ===== Code cần sửa =====
class HttpClient {
    private final MockConnectionPool pool;
    private final SlowServer server;

    HttpClient(MockConnectionPool pool, SlowServer server) { this.pool = pool; this.server = server; }

    // BUG: không consume response body khi lỗi -> connection không release
    MockHttpResponse call() throws InterruptedException {
        MockConnection conn = pool.acquire();
        try {
            MockHttpResponse resp = server.call();
            if (resp.status >= 400) throw new RuntimeException("HTTP " + resp.status);
            return resp;
        } catch (Exception e) {
            // BUG: quên consume response -> connection leak
            throw e;
        } finally {
            // Chỉ release connection object, nhưng pool thực tế (Netty) cần body được consume
            pool.release(conn);
        }
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        // 1. Gọi thành công: connection trả về pool
        MockConnectionPool p1 = new MockConnectionPool(10);
        AtomicInteger calls1 = new AtomicInteger(0);
        SlowServer s1 = () -> { calls1.incrementAndGet(); return new MockHttpResponse(200, "OK"); };
        HttpClient c1 = new HttpClient(p1, s1);
        for (int i = 0; i < 5; i++) c1.call();
        check("thanh_cong_tra_ve_pool", p1.availableCount() == 5 && p1.inUseCount() == 0,
            "5 lần thành công phải trả 5 connection về pool; available=" + p1.availableCount() + " inUse=" + p1.inUseCount());

        // 2. Gọi lỗi 4xx/5xx: starter leak, reference phải consume body rồi release
        MockConnectionPool p2 = new MockConnectionPool(10);
        AtomicInteger calls2 = new AtomicInteger(0);
        SlowServer s2 = () -> { calls2.incrementAndGet(); return new MockHttpResponse(500, "Server Error"); };
        HttpClient c2 = new HttpClient(p2, s2);
        int errors = 0;
        for (int i = 0; i < 5; i++) {
            try { c2.call(); } catch (Exception e) { errors++; }
        }
        // Starter: leak -> available=0, inUse=5 (FAIL). Reference: consume body -> available=5, inUse=0 (PASS).
        check("loi_van_consume_body", p2.availableCount() == 5 && p2.inUseCount() == 0 && errors == 5,
            "lỗi 500 vẫn phải consume body và trả connection; available=" + p2.availableCount() + " inUse=" + p2.inUseCount() + " errors=" + errors);

        // 3. Timeout: server chậm, client timeout, vẫn phải release connection
        MockConnectionPool p3 = new MockConnectionPool(5);
        CountDownLatch gate = new CountDownLatch(1);
        SlowServer s3 = () -> { gate.await(); return new MockHttpResponse(200, "OK"); };
        HttpClient c3 = new HttpClient(p3, s3);
        Thread t = new Thread(() -> { try { c3.call(); } catch (Exception ignored) {} });
        t.start();
        Thread.sleep(100); // chờ acquire connection
        // Giả lập timeout: không chờ server, bỏ qua request này
        // Reference: dùng doFinally/release ngay khi timeout
        // Test này kiểm tra logic: connection phải được release ngay cả khi không đợi response
        gate.countDown(); // cho server chạy xong để tránh deadlock test
        t.join(1000);
        // Starter: leak khi timeout. Reference: release ngay.
        // Đơn giản hóa: kiểm tra pool không cạn sau 100 lần gọi có lỗi/timeout
        MockConnectionPool p4 = new MockConnectionPool(20);
        SlowServer s4 = () -> { throw new RuntimeException("timeout"); };
        HttpClient c4 = new HttpClient(p4, s4);
        for (int i = 0; i < 100; i++) {
            try { c4.call(); } catch (Exception ignored) {}
        }
        check("khong_leak_khi_goi_nhieu_lan_loi", p4.inUseCount() == 0 && p4.availableCount() == 20,
            "100 lần gọi lỗi không được leak connection; inUse=" + p4.inUseCount() + " available=" + p4.availableCount());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (mô phỏng HTTP client + connection pool, KHÔNG cần sửa) =====
class MockConnection {
    final String id;
    boolean released = false;
    MockConnection(String id) { this.id = id; }
    void release() { released = true; }
}

class MockConnectionPool {
    final int maxSize;
    final List<MockConnection> available = new ArrayList<>();
    final List<MockConnection> inUse = new ArrayList<>();
    int created = 0;
    MockConnectionPool(int maxSize) { this.maxSize = maxSize; }
    synchronized MockConnection acquire() {
        if (!available.isEmpty()) {
            MockConnection c = available.remove(available.size() - 1);
            inUse.add(c);
            return c;
        }
        if (created < maxSize) {
            MockConnection c = new MockConnection("conn-" + created++);
            inUse.add(c);
            return c;
        }
        throw new IllegalStateException("Pool exhausted: " + inUse.size() + " in use, 0 available");
    }
    synchronized void release(MockConnection c) {
        inUse.remove(c);
        if (c.released) available.add(c);
    }
    int availableCount() { return available.size(); }
    int inUseCount() { return inUse.size(); }
}

class MockHttpResponse {
    final int status;
    final String body;
    boolean consumed = false;
    MockHttpResponse(int status, String body) { this.status = status; this.body = body; }
    void consume() { consumed = true; }
}

interface SlowServer {
    MockHttpResponse call() throws InterruptedException;
}

class CountDownLatch {
    private int count;
    CountDownLatch(int count) { this.count = count; }
    synchronized void await() throws InterruptedException { while (count > 0) wait(); }
    synchronized void countDown() { if (--count == 0) notifyAll(); }
}

// ===== Code cần sửa =====
class HttpClient {
    private final MockConnectionPool pool;
    private final SlowServer server;

    HttpClient(MockConnectionPool pool, SlowServer server) { this.pool = pool; this.server = server; }

    // FIX: luôn consume response body (dù thành công hay lỗi) trước khi release connection
    MockHttpResponse call() throws InterruptedException {
        MockConnection conn = pool.acquire();
        MockHttpResponse resp = null;
        try {
            resp = server.call();
            if (resp.status >= 400) {
                resp.consume();              // FIX: consume body ngay cả khi lỗi HTTP
                throw new RuntimeException("HTTP " + resp.status);
            }
            return resp;
        } catch (Exception e) {
            if (resp != null && !resp.consumed) resp.consume(); // FIX: consume trong catch
            throw e;
        } finally {
            pool.release(conn);
        }
    }
}`,
  hints: [
    'Đọc log: "Channel acquired, pool size=199...198..." giảm dần, rồi "PoolAcquirePendingException: Pending acquire queue has reached its maximum size of 200". Kết nối bị acquire nhưng không bao giờ trả về.',
    'Thread dump cho thấy thread reactor-http-nio-* đang WAITING trên PendingAcquireQueue.parkAndWait -> pool cạn, không có connection rảnh.',
    'Trong WebClient/Netty, response body **phải được consume** (đọc hết hoặc hủy) mới trả connection về pool. Ném exception mà không consume = leak. Dùng .bodyToMono(Void.class).subscribe() hoặc doOnError/doFinally để đảm bảo consume.',
    'Cấu hình pool: maxIdleTime (đóng kết nối nhàn rỗi), evictionPredicate (kiểm tra kết nối chết trước khi cho mượn), pendingAcquireMaxCount (giới hạn hàng đợi acquire).'
  ],
  rootCause: `**HTTP client không consume response body khi gặp lỗi/timeout, khiến connection pool Netty/WebClient không bao giờ tái sử dụng kết nối -> pool cạn, service treo.** 
- WebClient (Reactor Netty) quản lý connection pool: acquire -> request -> response -> **consume body** -> release về pool. Nếu code ném exception ngay khi thấy status >= 400 hoặc timeout, mà **không gọi resp.bodyToMono(Void.class).subscribe()** (hoặc đọc body), Netty coi connection còn "dangling" và không trả về pool.
- Sự cố: ngân hàng bên thứ ba chậm (8-30s). Client timeout hoặc nhận 5xx, ném exception, không consume body. 200 req/s * 10% fail = 20 leak/s. Sau 10 phút, 200 connection pool cạn. Toàn bộ service {{PaymentGateway}} bị chặn ở acquire.
- Thread dump: hàng chục thread WAITING trên {{PendingAcquireQueue.parkAndWait}} -> chứng minh pool exhausted.
- Dẫn chứng log: pool size giảm từ 200 xuống 0 trong 10 phút, {{PoolAcquirePendingException}}.
- Nguyên nhân gốc: **quên consume response body trong đường dẫn lỗi (error path)**. Happy path thường đúng (trả response cho caller, caller consume), nhưng error path quên.`,
  fix: `### Cách sửa trong bài
1. **Luôn consume response body**: trong {{catch}} và {{finally}}, nếu response chưa consumed thì consume. Dùng {{doOnError}}, {{doFinally}}, hoặc {{ExchangeFilterFunction}} toàn cục.
2. **Cấu hình pool bảo vệ**: {{maxIdleTime}} (đóng connection nhàn > 30s), {{evictionPredicate}} (kiểm tra isOpen trước khi cho mượn), {{pendingAcquireMaxCount}} (giới hạn queue chờ, fail nhanh thay vì treo).
3. **Timeout client-side**: đặt request timeout ngắn hơn server timeout, và **cancel subscription** sẽ tự consume body.
~~~java
// Toàn cục bằng ExchangeFilterFunction
webClient = WebClient.builder()
    .filter((request, next) -> next.exchange(request)
        .doOnError(e -> log.warn("HTTP error, consuming body", e))
        .flatMap(resp -> resp.bodyToMono(Void.class)  // consume body mọi trường hợp
            .thenReturn(resp))
    )
    .build();
~~~
Trong code synchronous giả lập bài tập: check {{resp != null && !resp.consumed}} trong catch/finally rồi consume.`,
  related: ['microservices-012', 'microservices-045'],
  tags: ['HTTP client', 'WebClient', 'connection pool', 'Netty', 'resource leak', 'response body', 'Reactor'],
},
{
  id: 'bug-052',
  title: 'Cache write-through không invalidation khi DB update thất bại: 20% request đọc dữ liệu cũ 5 phút',
  domain: 'Cache / Write-through',
  level: 'senior',
  severity: 'P1',
  minutes: 30,
  story: `**Bối cảnh dự án:** Service {{ProductCatalog}} (Spring Boot, Caffeine cache) lưu thông tin sản phẩm. Chiến lược **write-through**: khi admin cập nhật giá, service ghi DB **rồi** mới cập nhật cache. Cache TTL 5 phút. Code dùng {{@Transactional}} cho phương thức update.
  **Sự cố:** 14:00 ngày 15/11, admin cập nhật giá sản phẩm P-1001 từ 1.000.000 -> 1.200.000. DB update **thất bại** do deadlock (cùng lúc batch đang chạy), transaction rollback. Nhưng code đã **cập nhật cache trước khi commit** (trong cùng transaction nhưng trước khi flush), hoặc cache được cập nhật trong {{@AfterReturning}} advice nhưng advice chạy dù transaction rollback (do exception bị swallow). Kết quả: cache chứa giá mới 1.200.000, DB vẫn giữ giá cũ 1.000.000. 20% request đọc cache thấy giá mới, 80% đọc DB thấy giá cũ. Khách hàng đặt hàng giá 1.000.000, hệ thống thanh toán theo cache 1.200.000 -> chênh lệch 200.000/đơn. Phát hiện sau 5 phút khi TTL cache hết.
  **Nhiệm vụ của bạn:**
  1. Đọc code {{ProductService.updatePrice}} và {{PriceCache}}, tìm vì sao cache bị cập nhật khi DB rollback.
  2. Sửa: (a) **chỉ cập nhật cache SAU khi transaction commit thành công** (dùng {{TransactionSynchronizationManager.registerSynchronization}} hoặc {{@TransactionalEventListener(phase = AFTER_COMMIT)}}); (b) nếu update cache thất bại, ghi log cảnh báo và **xóa cache entry** (invalidate) để lần đọc sau lấy từ DB; (c) thêm version/timestamp vào cache entry để client phát hiện stale.
  3. Bấm **Chạy test**: test mô phỏng DB update fail (rollback), kiểm tra cache KHÔNG được cập nhật (vẫn giữ giá cũ hoặc bị xóa). Clock giả + fake DB để test xác định.`,
  artifacts: [
    { name: 'price-update.log', lang: 'text', content: `2026-11-15 14:00:11.100 INFO  ProductService : updatePrice P-1001 1000000 -> 1200000
2026-11-15 14:00:11.105 INFO  PriceCache     : put P-1001 = 1200000 (write-through)
2026-11-15 14:00:11.110 WARN  HikariPool   : Connection leaked, stack trace...
2026-11-15 14:00:11.115 ERROR ProductService : DB deadlock, rollback
2026-11-15 14:00:11.120 INFO  PriceCache     : (no invalidation, cache still has 1200000)
2026-11-15 14:02:00.000 INFO  OrderService  : create order P-1001 price=1200000 (from cache)
2026-11-15 14:02:00.005 INFO  PaymentService: charge 1200000 but DB price=1000000 -> mismatch` },
    { name: 'reconcile-2026-11-15.txt', lang: 'text', content: `KIỂM TOÁN GIÁ 15/11/2026 14:05
Sản phẩm P-1001: DB = 1.000.000, Cache = 1.200.000
Đơn hàng bị chênh lệch: 340 đơn × 200.000 = 68.000.000
Nguyên nhân: cache updated trước DB commit, DB rollback nhưng cache không rollback` }
  ],
  starter: `// ===== Hạ tầng (mô phỏng DB + Cache, KHÔNG cần sửa) =====
class PriceRecord {
    final String productId;
    long price;
    long version;
    PriceRecord(String productId, long price, long version) { this.productId = productId; this.price = price; this.version = version; }
}

class FakeDB {
    final Map<String, PriceRecord> data = new HashMap<>();
    boolean shouldFail = false;
    FakeDB() { data.put("P-1", new PriceRecord("P-1", 1_000_000L, 1)); }
    @FunctionalInterface
    interface TxnCallback<T> { T run() throws Exception; }
    <T> T transactional(TxnCallback<T> cb) throws Exception {
        // Giả lập: nếu shouldFail=true thì rollback (ném exception, không thay đổi data)
        if (shouldFail) throw new RuntimeException("DB deadlock");
        return cb.run();
    }
    PriceRecord find(String id) { return data.get(id); }
    void updatePrice(String id, long newPrice) { data.get(id).price = newPrice; data.get(id).version++; }
}

class CacheEntry {
    final long price;
    final long version;   // version DB lúc ghi cache
    final long timestamp;
    CacheEntry(long price, long version, long timestamp) { this.price = price; this.version = version; this.timestamp = timestamp; }
}

class PriceCache {
    final Map<String, CacheEntry> store = new HashMap<>();
    final FakeClock clock;
    PriceCache(FakeClock clock) { this.clock = clock; }
    void put(String productId, long price, long version) { store.put(productId, new CacheEntry(price, version, clock.millis())); }
    CacheEntry get(String productId) { return store.get(productId); }
    void evict(String productId) { store.remove(productId); }
}

class FakeClock {
    long millis = 0;
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

// ===== Code cần sửa =====
class ProductService {
    private final FakeDB db;
    private final PriceCache cache;

    ProductService(FakeDB db, PriceCache cache) { this.db = db; this.cache = cache; }

    // BUG: cập nhật cache TRƯỚC khi commit (hoặc trong @AfterReturning nhưng rollback vẫn chạy)
    void updatePrice(String productId, long newPrice) throws Exception {
        db.transactional(() -> {
            db.updatePrice(productId, newPrice);      // ghi DB
            PriceRecord r = db.find(productId);
            cache.put(productId, r.price, r.version); // BUG: cập nhật cache trong transaction, chưa commit
            return null;
        });
    }

    long getPrice(String productId) {
        CacheEntry e = cache.get(productId);
        if (e != null) return e.price;
        PriceRecord r = db.find(productId);
        cache.put(productId, r.price, r.version);
        return r.price;
    }
}`,
  tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }

    public static void main(String[] args) throws Exception {
        // 1. Update thành công: cache cập nhật đúng giá mới
        FakeDB db1 = new FakeDB();
        FakeClock clk1 = new FakeClock();
        PriceCache cache1 = new PriceCache(clk1);
        ProductService svc1 = new ProductService(db1, cache1);
        svc1.updatePrice("P-1", 1_200_000L);
        check("update_thanh_cong_cache_cap_nhat", cache1.get("P-1").price == 1_200_000L,
            "update thành công phải cập nhật cache giá mới; cache=" + cache1.get("P-1").price);

        // 2. Update thất bại (deadlock -> rollback): cache KHÔNG được cập nhật (vẫn giữ giá cũ HOẶC bị evict)
        FakeDB db2 = new FakeDB();
        db2.shouldFail = true;   // mô phỏng deadlock
        FakeClock clk2 = new FakeClock();
        PriceCache cache2 = new PriceCache(clk2);
        // Pre-fill cache với giá cũ
        cache2.put("P-1", 1_000_000L, 1);
        ProductService svc2 = new ProductService(db2, cache2);
        try { svc2.updatePrice("P-1", 1_200_000L); } catch (Exception ignored) {}
        // Starter: cache bị cập nhật thành 1.2M dù DB rollback (FAIL).
        // Reference: cache vẫn là 1.0M (giữ cũ) HOẶC bị evict (null) - đều OK miễn không phải giá mới sai.
        long cachedPrice = cache2.get("P-1") != null ? cache2.get("P-1").price : -1;
        check("update_that_bai_cache_khong_sai", cachedPrice != 1_200_000L,
            "DB rollback thì cache KHÔNG được chứa giá mới 1.2M; cache=" + cachedPrice);

        // 3. Sau rollback, đọc lại phải lấy từ DB (giá cũ 1.0M)
        long readPrice = svc2.getPrice("P-1");
        check("doc_sau_rollback_lay_db", readPrice == 1_000_000L,
            "sau rollback, getPrice phải đọc DB = 1.0M; thực tế " + readPrice);

        // 4. Cache entry có version: nếu version cache != version DB -> coi là stale, đọc lại DB
        FakeDB db4 = new FakeDB();
        FakeClock clk4 = new FakeClock();
        PriceCache cache4 = new PriceCache(clk4);
        cache4.put("P-1", 1_000_000L, 1);  // version 1
        db4.updatePrice("P-1", 1_200_000L); // DB version 2 (giả lập update ngoài cache)
        ProductService svc4 = new ProductService(db4, cache4);
        // getPrice phải thấy version mismatch và đọc lại DB
        long price4 = svc4.getPrice("P-1");
        check("version_mismatch_doc_lai_db", price4 == 1_200_000L,
            "version cache (1) != DB (2) phải đọc lại DB = 1.2M; thực tế " + price4);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference: `// ===== Hạ tầng (mô phỏng DB + Cache, KHÔNG cần sửa) =====
class PriceRecord {
    final String productId;
    long price;
    long version;
    PriceRecord(String productId, long price, long version) { this.productId = productId; this.price = price; this.version = version; }
}

class FakeDB {
    final Map<String, PriceRecord> data = new HashMap<>();
    boolean shouldFail = false;
    FakeDB() { data.put("P-1", new PriceRecord("P-1", 1_000_000L, 1)); }
    @FunctionalInterface
    interface TxnCallback<T> { T run() throws Exception; }
    <T> T transactional(TxnCallback<T> cb) throws Exception {
        if (shouldFail) throw new RuntimeException("DB deadlock");
        return cb.run();
    }
    PriceRecord find(String id) { return data.get(id); }
    void updatePrice(String id, long newPrice) { data.get(id).price = newPrice; data.get(id).version++; }
}

class CacheEntry {
    final long price;
    final long version;
    final long timestamp;
    CacheEntry(long price, long version, long timestamp) { this.price = price; this.version = version; this.timestamp = timestamp; }
}

class PriceCache {
    final Map<String, CacheEntry> store = new HashMap<>();
    final FakeClock clock;
    PriceCache(FakeClock clock) { this.clock = clock; }
    void put(String productId, long price, long version) { store.put(productId, new CacheEntry(price, version, clock.millis())); }
    CacheEntry get(String productId) { return store.get(productId); }
    void evict(String productId) { store.remove(productId); }
}

class FakeClock {
    long millis = 0;
    long millis() { return millis; }
    void advance(long ms) { millis += ms; }
}

// ===== Code cần sửa =====
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class ProductService {
    private final FakeDB db;
    private final PriceCache cache;

    ProductService(FakeDB db, PriceCache cache) { this.db = db; this.cache = cache; }

    // FIX: cập nhật cache CHỈ SAU KHI transaction COMMIT thành công
    // Cách 1: TransactionSynchronizationManager.registerSynchronization
    // Cách 2: @TransactionalEventListener(phase = AFTER_COMMIT) (Spring)
    // Ở đây mô phỏng bằng callback sau khi transactional() trả về không exception
    void updatePrice(String productId, long newPrice) throws Exception {
        final long[] committedVersion = new long[1];
        boolean success = false;
        try {
            db.transactional(() -> {
                db.updatePrice(productId, newPrice);
                PriceRecord r = db.find(productId);
                committedVersion[0] = r.version;
                return null;
            });
            success = true;
        } finally {
            if (success) {
                // CHỈ cập nhật cache khi commit thành công
                cache.put(productId, newPrice, committedVersion[0]);
            } else {
                // Rollback: invalidate cache để lần sau đọc lại DB
                cache.evict(productId);
            }
        }
    }

    long getPrice(String productId) {
        CacheEntry e = cache.get(productId);
        PriceRecord r = db.find(productId);
        // FIX: kiểm tra version, nếu mismatch thì stale -> đọc lại DB và cập nhật cache
        if (e != null && e.version == r.version) return e.price;
        cache.put(productId, r.price, r.version);
        return r.price;
    }
}`,
  hints: [
    'Đọc log: "put P-1001 = 1200000 (write-through)" xuất hiện TRƯỚC "DB deadlock, rollback". Cache được cập nhật trong transaction nhưng transaction sau đó rollback.',
    'Write-through cache: cập nhật cache **sau khi DB commit thành công**. Nếu cập nhật trong transaction, rollback sẽ không rollback cache (cache không tham gia transaction DB).',
    'Dùng Spring {{TransactionSynchronizationManager.registerSynchronization}} với {{afterCommit()}} hoặc {{@TransactionalEventListener(phase = AFTER_COMMIT)}} để chạy code sau commit.',
    'Nếu update cache thất bại hoặc rollback: **invalidate (xóa) cache entry** thay vì để dữ liệu sai. Lần đọc sau sẽ cache miss -> đọc DB -> cập nhật cache đúng.',
    'Thêm {{version}} vào cache entry: getPrice so sánh version cache với version DB, mismatch thì coi là stale -> đọc lại DB. Đây là phòng tuyến cuối cùng.'
  ],
  rootCause: `**Write-through cache cập nhật cache trong transaction, nhưng transaction rollback -> cache chứa giá mới sai, DB giữ giá cũ.** 
- Code {{updatePrice}} gọi {{cache.put}} bên trong {{db.transactional}} callback. Khi DB deadlock, transaction rollback ({{shouldFail=true}} ném exception), DB không đổi (vẫn 1.000.000). Nhưng cache đã được ghi 1.200.000 **trước khi rollback**.
- Cache không tham gia transaction DB, nên rollback DB không ảnh hưởng cache. Kết quả: cache và DB lệch nhau 5 phút (TTL). 20% request hit cache thấy giá mới, 80% miss cache đọc DB thấy giá cũ. Khách đặt hàng giá 1M, thanh toán theo cache 1.2M -> chênh 200k/đơn, 340 đơn = 68 triệu.
- Dẫn chứng log: {{put P-1001 = 1200000}} tại 14:00:11.105, {{DB deadlock, rollback}} tại 14:00:11.115, {{cache still has 1200000}} tại 14:00:11.120. File đối soát xác nhận DB=1M, Cache=1.2M.
- Nguyên nhân gốc: **viết cache update ở vị trí sai** (trong transaction thay vì sau commit). Cách Spring phổ biến là {{@TransactionalEventListener(phase = AFTER_COMMIT)}} hoặc {{TransactionSynchronization.afterCommit()}}.`,
  fix: `### Cách sửa trong bài
1. **Chỉ cập nhật cache SAU KHI COMMIT**: dùng {{TransactionSynchronizationManager.registerSynchronization}} đăng ký callback {{afterCommit()}}, hoặc Spring {{@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)}}. Code trong callback mới chạy khi transaction commit thành công.
2. **Rollback -> invalidate cache**: nếu transaction rollback (catch exception), gọi {{cache.evict(productId)}} để xóa entry cũ. Lần đọc sau sẽ cache miss -> đọc DB -> cập nhật cache đúng.
3. **Version check trong getPrice**: cache entry lưu {{version}} của DB lúc ghi. {{getPrice}} so sánh version cache với version DB hiện tại; mismatch thì stale -> đọc lại DB và cập nhật cache. Đây là phòng tuyến cuối cùng (defense in depth).
~~~java
void updatePrice(String productId, long newPrice) throws Exception {
    final long[] committedVersion = new long[1];
    boolean success = false;
    try {
        db.transactional(() -> {
            db.updatePrice(productId, newPrice);
            committedVersion[0] = db.find(productId).version;
            return null;
        });
        success = true;
    } finally {
        if (success) cache.put(productId, newPrice, committedVersion[0]);
        else cache.evict(productId);  // rollback -> xóa cache sai
    }
}

long getPrice(String productId) {
    CacheEntry e = cache.get(productId);
    PriceRecord r = db.find(productId);
    if (e != null && e.version == r.version) return e.price; // version khớp -> OK
    cache.put(productId, r.price, r.version);                 // mismatch -> đọc lại DB
    return r.price;
}
~~~
`,
  related: ['jpa-012'],
  tags: ['cache', 'write-through', 'transaction', 'rollback', 'invalidation', 'version', 'Spring', '@TransactionalEventListener'],
}
);