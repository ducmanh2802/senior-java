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
        for (Future<?> f : fs) f.get(10, TimeUnit.SECONDS);
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
}
);
