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

);
