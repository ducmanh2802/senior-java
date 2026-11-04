/*
 * Mô phỏng vòng đời phát triển phần mềm (SDLC) end-to-end → window.SDLC (view #/sdlc).
 * Mỗi kịch bản đi qua đủ 8 giai đoạn theo đúng thứ tự STAGE_KEYS (scripts/validate.js kiểm tra),
 * rồi phần interview: kể lại dự án trong phỏng vấn. Không backtick, không ${ trong template literal.
 */
(window.SDLC = window.SDLC || []).push(
{
  id: 'sdlc-001',
  title: 'Chuyển tiền nội bộ có hạn mức theo ngày',
  level: 'senior',
  domain: 'Ngân hàng số',
  context: `Bạn là **Senior Java Developer** trong squad Payments của một ngân hàng số (app mobile ~2 triệu khách hàng hoạt động).
Squad gồm: 1 PO, 1 BA, 4 dev backend (Java 21, Spring Boot 3, PostgreSQL 16, Kafka), 2 QA, 1 DevOps dùng chung. Làm Scrum sprint 2 tuần; môi trường DEV → SIT → UAT → PROD trên Kubernetes; release production thứ Ba và thứ Năm, có change request.

Hệ thống liên quan:
- {{transfer-service}} (squad bạn sở hữu): nhận lệnh chuyển tiền từ app.
- {{core-banking}}: hệ thống lõi (của vendor) thực hiện ghi nợ/ghi có, API HTTP, p99 khoảng 800 ms, đôi khi timeout.
- {{notification-service}}: gửi push/SMS qua Kafka.

> Đi lần lượt từng giai đoạn. Ở mỗi giai đoạn: đọc tình huống + artifact, tự làm phần "Việc của bạn" (viết ra, càng cụ thể càng tốt), rồi mới mở đáp án mẫu hoặc nhờ AI chấm.`,
  stages: [
    {
      key: 'requirement',
      title: 'Nhận requirement',
      role: 'PO gửi ticket, bạn cùng BA làm rõ',
      story: `Thứ Hai đầu sprint, PO đưa ticket vào backlog với độ ưu tiên cao vì **Ngân hàng Nhà nước yêu cầu áp hạn mức chuyển tiền theo ngày** từ đầu quý sau. Buổi refinement kéo dài 45 phút, bạn là người review kỹ thuật.

Ticket viết rất ngắn, đúng kiểu ticket thật: mô tả mong muốn, không có tiêu chí nghiệm thu, không nói gì về lỗi, đồng thời hay số liệu tải.`,
      artifacts: [
        { name: 'PAY-1423.txt', lang: 'text', content: `PAY-1423  [Story]  Hạn mức chuyển tiền nội bộ theo ngày
Priority: High        Reporter: PO Payments       Sprint: 2026-S22
Labels: compliance, transfer

Mô tả:
  Là khách hàng cá nhân, tôi chỉ được chuyển tiền nội bộ tối đa 500.000.000 VND mỗi ngày
  để tuân thủ quy định mới và giảm thiệt hại khi tài khoản bị chiếm quyền.
  Khi vượt hạn mức thì báo lỗi cho khách.

Ghi chú:
  - Khách VIP có thể có hạn mức khác (sẽ bổ sung sau)
  - Deadline: go-live trước 01/01

Acceptance criteria:
  (chưa có)` }
      ],
      task: `Trước khi team ước lượng, bạn phải biến ticket này thành thứ dev và QA làm được.
1. Liệt kê **ít nhất 8 câu hỏi làm rõ** bạn sẽ hỏi PO/BA (nghiệp vụ, kỹ thuật, phi chức năng).
2. Viết **acceptance criteria** dạng Given/When/Then cho ít nhất 4 tình huống quan trọng.`,
      answer: `**Tóm tắt:** ticket mới nói "cái gì", chưa nói "khi nào tính, tính cho ai, lỗi thì sao, tải bao nhiêu". Senior hỏi để lộ ra edge case và yêu cầu phi chức năng **trước khi ước lượng**, vì chính chúng quyết định thiết kế.

### Câu hỏi làm rõ nên hỏi
| Nhóm | Câu hỏi | Vì sao quan trọng |
|---|---|---|
| Phạm vi | Hạn mức tính theo **khách hàng** hay theo **từng tài khoản**? Khách có 3 tài khoản thì sao? | Quyết định khoá chính của bảng đếm hạn mức |
| Thời gian | "Ngày" là ngày lịch theo giờ Việt Nam (0h00 reset)? Hay 24 giờ trượt? | 24h trượt phức tạp hơn nhiều (phải lưu từng giao dịch) |
| Lỗi | Giao dịch **thất bại / bị đảo** có hoàn lại hạn mức không? Giao dịch **chưa rõ kết quả** (core timeout) tính thế nào? | Đây là nguồn bug lớn nhất (xem giai đoạn Fix bug) |
| Đồng thời | Khách bấm 2 lệnh cùng lúc trên 2 thiết bị thì sao? | Race condition làm vượt hạn mức → vi phạm quy định |
| Retry | App retry khi mất mạng có bị trừ hạn mức 2 lần không? | Cần idempotency key |
| VIP | Hạn mức khác nhau lấy từ đâu, ai cấu hình, có hiệu lực ngay không? | Thiết kế cấu hình, không hard-code 500 triệu |
| Trải nghiệm | Có hiển thị "hạn mức còn lại hôm nay" trước khi chuyển không? Thông báo lỗi chính xác là gì? | Thêm API đọc, text đa ngôn ngữ |
| Phi chức năng | TPS đỉnh (ngày trả lương)? Latency cho phép thêm bao nhiêu ms? | Chọn cách khoá và index |
| Audit | Có cần lưu vết thay đổi hạn mức cho thanh tra? Giữ bao lâu? | Bảng audit, retention |
| Liên thông | Chuyển liên ngân hàng (Napas) có dùng chung hạn mức không? | Phạm vi story, tránh làm lại |

### Acceptance criteria mẫu
- **AC1 – Trong hạn mức:** Given khách đã chuyển 300 triệu hôm nay, When chuyển thêm 200 triệu, Then giao dịch thành công và hạn mức còn lại = 0.
- **AC2 – Vượt hạn mức:** Given đã chuyển 450 triệu, When chuyển 60 triệu, Then bị từ chối với mã {{LIMIT_EXCEEDED}}, không gọi core banking, số dư không đổi.
- **AC3 – Reset theo ngày:** Given đã dùng hết hạn mức lúc 23:59:59 giờ VN, When chuyển lúc 00:00:01 hôm sau, Then được chuyển.
- **AC4 – Đồng thời:** Given còn 100 triệu, When 2 lệnh 80 triệu đến cùng lúc, Then đúng 1 lệnh thành công.
- **AC5 – Thất bại hoàn hạn mức:** Given core banking từ chối giao dịch, Then hạn mức đã giữ được trả lại.
- **AC6 – Idempotent:** Given app gửi lại cùng {{Idempotency-Key}}, Then không trừ hạn mức lần 2 và trả lại kết quả lần đầu.

### Pitfall thực tế
- Dev ước lượng ngay khi ticket còn mơ hồ → story "3 điểm" thành 13 điểm giữa sprint.
- Bỏ qua câu "thất bại thì sao" → bug production đúng ngày cao điểm.

> Senior tip: ghi các câu trả lời của PO ngay vào ticket (mục "Decisions"), kèm ngày và người quyết định. Ba tháng sau khi có tranh cãi "ai bảo làm thế", đó là bằng chứng duy nhất.`,
      pitfalls: ['Ước lượng khi chưa có acceptance criteria', 'Không hỏi về giao dịch lỗi / chưa rõ kết quả', 'Hard-code 500 triệu trong code']
    },
    {
      key: 'analysis',
      title: 'Phân tích & ước lượng',
      role: 'Bạn cùng BA chia story, ước lượng, nêu rủi ro',
      story: `PO đã trả lời: hạn mức **theo khách hàng**, ngày lịch giờ VN, giao dịch thất bại **phải** hoàn hạn mức, VIP lấy từ bảng cấu hình, chuyển liên ngân hàng làm ở sprint sau. Latency thêm tối đa 30 ms ở p95.

DevOps gửi số liệu tải. Bạn cần chia việc để vừa 1 sprint và nêu rủi ro cho PO trước khi cam kết.`,
      artifacts: [
        { name: 'traffic-oct.txt', lang: 'text', content: `transfer-service  /api/v1/transfers (POST)  tháng 10/2026
  ngày thường    : avg 35 TPS,  peak 120 TPS (12:00-12:30)
  ngày 25 (lương): avg 160 TPS, peak 820 TPS (09:00-09:20)
  p95 latency    : 410 ms (trong đó core-banking 330 ms)
  tỉ lệ core timeout (>5s): 0.04% ngày thường, 0.6% ngày 25
  khách chuyển >= 2 lệnh trong cùng 1 giây: ~1.900 lần/ngày 25` },
        { name: 'schema.sql', lang: 'sql', content: `CREATE TABLE transfer (
  id             UUID PRIMARY KEY,
  customer_id    BIGINT       NOT NULL,
  from_account   VARCHAR(20)  NOT NULL,
  to_account     VARCHAR(20)  NOT NULL,
  amount         NUMERIC(18,0) NOT NULL,
  status         VARCHAR(16)  NOT NULL,   -- PENDING, SUCCESS, FAILED
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_transfer_customer ON transfer(customer_id, created_at);` }
      ],
      task: `1. Chia PAY-1423 thành các story/task nhỏ (mỗi cái ≤ 3 ngày), có thứ tự phụ thuộc.
2. Từ số liệu tải, nêu **3 rủi ro kỹ thuật lớn nhất** và cách giảm.
3. Có nên tính hạn mức bằng {{SUM(amount)}} trên bảng transfer mỗi lần chuyển không? Vì sao?`,
      answer: `**Tóm tắt:** chia theo lát cắt có thể demo được (đọc hạn mức → kiểm tra + giữ hạn mức → hoàn hạn mức → cấu hình VIP), và nói thẳng với PO rằng rủi ro lớn nhất là **đồng thời** và **giao dịch chưa rõ kết quả**, không phải code CRUD.

### Chia việc
1. **Bảng hạn mức + cấu hình** (Flyway migration, bảng {{limit_config}}, {{daily_limit_usage}}): 1 ngày.
2. **API đọc hạn mức còn lại** {{GET /api/v1/limits/today}}: 1 ngày, demo được sớm cho team mobile.
3. **Giữ hạn mức khi chuyển** (atomic, idempotent): 3 ngày, việc khó nhất, giao người có kinh nghiệm concurrency.
4. **Hoàn hạn mức khi thất bại + xử lý timeout** (trạng thái UNKNOWN, job đối soát): 3 ngày.
5. **VIP override + audit**: 2 ngày.
6. **Test hiệu năng ngày lương + test đồng thời**: 2 ngày (QA + dev).
Phụ thuộc: 1 → 2, 3 → 4; 5 song song.

### Rủi ro và cách giảm
| Rủi ro | Dấu hiệu trong số liệu | Giảm thiểu |
|---|---|---|
| Vượt hạn mức do race | 1.900 lần/ngày khách gửi ≥ 2 lệnh trong 1 giây | UPDATE có điều kiện nguyên tử, test đồng thời tự động |
| Hạn mức bị "giữ" oan khi core timeout | 0.6% timeout ngày 25, khoảng 3.000 giao dịch | Trạng thái RESERVED/UNKNOWN + đối soát với core theo idempotency key |
| Hot row / lock contention | peak 820 TPS | Khoá theo từng khách (1 dòng/khách/ngày), không có khoá toàn cục; transaction ngắn, không gọi HTTP trong lúc giữ khoá |

### Vì sao không dùng SUM mỗi lần
- {{SUM}} trên bảng transfer rồi mới insert là **check-then-act**: 2 request cùng đọc "đã dùng 450 triệu" và cùng được phép → vượt hạn mức. Muốn đúng phải khoá (SERIALIZABLE hoặc advisory lock) → chậm.
- Chi phí đọc tăng theo số giao dịch trong ngày; một dòng đếm sẵn ({{used_amount}}) đọc O(1).
- Nhưng giữ bảng transfer làm **nguồn sự thật** để đối soát: job cuối ngày so {{SUM}} với {{used_amount}}.

> Senior tip: khi PO hỏi "xong trong 1 sprint không", trả lời bằng phương án: "Story 1–3 chắc chắn xong; story 4 phụ thuộc API tra cứu của core banking, nếu vendor chưa có thì cần thêm 1 tuần". Cam kết có điều kiện tốt hơn hứa chung chung rồi trễ.`
    },
    {
      key: 'design',
      title: 'Thiết kế kỹ thuật',
      role: 'Bạn review design doc của một dev mid',
      story: `Một dev mid trong team viết bản thiết kế đầu tiên cho story 3 (giữ hạn mức). Tech lead nhờ bạn review trước buổi design review chiều nay. Bản thiết kế "chạy đúng khi test bằng tay".`,
      artifacts: [
        { name: 'design-draft.md', lang: 'text', content: `Luồng POST /api/v1/transfers  (@Transactional toàn bộ method)
  1. limit = limitConfigRepo.findLimit(customerId)                 // 500.000.000
  2. used  = usageRepo.findByCustomerAndDate(customerId, today())  // SELECT
  3. if (used + amount > limit) throw LimitExceededException
  4. usageRepo.save(used + amount)                                 // UPDATE
  5. result = coreBankingClient.transfer(req)                      // HTTP, timeout 30s
  6. if (result.failed) usageRepo.save(used)                        // trả lại
  7. transferRepo.save(...status = result.status)
  8. kafkaTemplate.send("transfer-events", event)

  today() = LocalDate.now()
  Bảng daily_limit_usage(customer_id, biz_date, used_amount)  -- chưa có unique key` }
      ],
      task: `Liệt kê **mọi vấn đề** trong bản thiết kế (ít nhất 5), sắp theo mức nghiêm trọng, và đề xuất thiết kế đã sửa: SQL giữ hạn mức, ranh giới transaction, xử lý timeout, idempotency, gửi event.`,
      answer: `**Tóm tắt:** bản nháp đúng khi một người bấm, sai khi có đồng thời, timeout hoặc retry. Thiết kế đúng tách làm **3 transaction ngắn**: giữ hạn mức (UPDATE có điều kiện) → gọi core **ngoài transaction** → chốt hoặc hoàn hạn mức; kèm idempotency key và outbox.

### Vấn đề, theo mức nghiêm trọng
1. **Race condition (bước 2–4):** đọc rồi ghi. Hai request cùng đọc 450 triệu, cùng ghi 530 triệu → vượt hạn mức (và lost update: dòng thứ hai ghi đè).
2. **Gọi HTTP 30 giây trong transaction (bước 5):** giữ DB connection + row lock suốt thời gian gọi core. Ngày lương 820 TPS × vài giây → cạn connection pool (Hikari mặc định 10), toàn service treo.
3. **Timeout không có trạng thái:** core timeout → exception → rollback cả hạn mức lẫn bản ghi transfer, nhưng **core có thể đã trừ tiền**. Mất dấu giao dịch.
4. **Không idempotent:** app retry → chuyển tiền 2 lần.
5. **today() theo timezone của JVM:** Pod chạy UTC → "ngày" reset lúc 7h sáng giờ VN.
6. **Thiếu unique (customer_id, biz_date):** hai request đầu ngày cùng INSERT → 2 dòng.
7. **Kafka send trong transaction DB:** DB rollback nhưng event đã gửi, hoặc ngược lại → dùng outbox.

### Thiết kế đã sửa
~~~sql
-- tx1: giữ hạn mức nguyên tử (1 câu, không cần đọc trước)
INSERT INTO daily_limit_usage(customer_id, biz_date, used_amount)
VALUES (:cid, :bizDate, 0) ON CONFLICT (customer_id, biz_date) DO NOTHING;

UPDATE daily_limit_usage
   SET used_amount = used_amount + :amount
 WHERE customer_id = :cid AND biz_date = :bizDate
   AND used_amount + :amount <= :limit;      -- 0 dòng bị sửa = vượt hạn mức
-- cùng tx1: INSERT transfer(id = idempotency key, status = 'RESERVED')
~~~
- **Gọi core ngoài transaction**, timeout 5 s (không phải 30 s), gửi kèm idempotency key.
- **tx2:** thành công → status SUCCESS; thất bại rõ ràng → status FAILED + {{used_amount = used_amount - :amount}}; timeout → status **UNKNOWN**, không hoàn, để job đối soát hỏi core theo key rồi chốt.
- **bizDate** = {{LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))}} lấy từ một {{Clock}} inject được (để test AC3).
- Event ghi vào bảng **outbox** cùng tx2; relay đẩy sang Kafka.

| Phương án khoá | Ưu | Nhược |
|---|---|---|
| UPDATE có điều kiện (chọn) | 1 round-trip, khoá dòng rất ngắn | Cần INSERT trước cho dòng đầu ngày |
| SELECT FOR UPDATE | Dễ đọc | 2 round-trip, dễ quên khoá ở chỗ khác |
| Optimistic (version) | Không khoá | Nhiều retry khi 1 khách bấm dồn dập |
| Redis INCRBY | Rất nhanh | Thêm hệ thống, phải đối soát với DB |

> Senior tip: trong design review, đừng chỉ nói "có race condition". Viết kịch bản 2 dòng thời gian (T1, T2) cạnh nhau cho thấy số tiền sai cụ thể; người viết bản nháp sẽ hiểu ngay và không thấy bị chỉ trích.`
    },
    {
      key: 'dev',
      title: 'Phát triển',
      role: 'Bạn code phần giữ hạn mức + unit test',
      story: `Thiết kế đã chốt. Bạn nhận story 3. Team quy ước: Spring Data JPA, test tích hợp với Testcontainers PostgreSQL, mọi PR cần test cho cả nhánh lỗi. Dưới đây là repository đã có; bạn viết service.`,
      artifacts: [
        { name: 'LimitUsageRepository.java', lang: 'java', content: `public interface LimitUsageRepository extends JpaRepository<LimitUsage, LimitUsageId> {

    @Modifying
    @Query(value = """
        INSERT INTO daily_limit_usage(customer_id, biz_date, used_amount)
        VALUES (:cid, :d, 0) ON CONFLICT (customer_id, biz_date) DO NOTHING""", nativeQuery = true)
    void ensureRow(@Param("cid") long customerId, @Param("d") LocalDate bizDate);

    @Modifying
    @Query(value = """
        UPDATE daily_limit_usage SET used_amount = used_amount + :amt
         WHERE customer_id = :cid AND biz_date = :d AND used_amount + :amt <= :lim""", nativeQuery = true)
    int tryReserve(@Param("cid") long customerId, @Param("d") LocalDate bizDate,
                   @Param("amt") BigDecimal amount, @Param("lim") BigDecimal limit);

    @Modifying
    @Query(value = """
        UPDATE daily_limit_usage SET used_amount = used_amount - :amt
         WHERE customer_id = :cid AND biz_date = :d""", nativeQuery = true)
    int release(@Param("cid") long customerId, @Param("d") LocalDate bizDate, @Param("amt") BigDecimal amount);
}` }
      ],
      task: `1. Viết {{LimitService.reserve(customerId, amount)}} (giữ hạn mức trong 1 transaction, ném {{LimitExceededException}} khi vượt) và {{release(...)}}.
2. Liệt kê các test bạn sẽ viết (tên test + kiểm tra gì), trong đó có **test đồng thời**.`,
      answer: `**Tóm tắt:** service mỏng, toàn bộ tính đúng nằm trong câu UPDATE có điều kiện; điều quan trọng là **ngày theo Clock inject được**, transaction ngắn, và test chứng minh được tính đúng khi đồng thời.

~~~java
@Service
@RequiredArgsConstructor
public class LimitService {
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private final LimitUsageRepository usage;
    private final LimitConfigService config;   // hạn mức theo khách (VIP override), có cache
    private final Clock clock;                 // inject để test được 23:59:59 / 00:00:01

    @Transactional                             // transaction ngắn: 2 câu SQL, không gọi HTTP
    public LocalDate reserve(long customerId, BigDecimal amount) {
        LocalDate bizDate = LocalDate.now(clock.withZone(VN));
        usage.ensureRow(customerId, bizDate);   // idempotent, an toàn khi đồng thời
        int updated = usage.tryReserve(customerId, bizDate, amount, config.limitOf(customerId));
        if (updated == 0) throw new LimitExceededException(customerId, amount);
        return bizDate;                         // trả về để release đúng ngày đã giữ
    }

    @Transactional
    public void release(long customerId, LocalDate bizDate, BigDecimal amount) {
        usage.release(customerId, bizDate, amount);   // dùng bizDate lúc giữ, KHÔNG dùng hôm nay
    }
}
~~~
Chú ý {{release}} nhận **bizDate lúc giữ**: giao dịch giữ lúc 23:59:58 thất bại lúc 00:00:03 phải hoàn vào ngày hôm trước.

### Test nên viết
| Test | Kiểm tra |
|---|---|
| reserve_withinLimit_increasesUsage | dùng 300 + 200 = 500 → OK |
| reserve_overLimit_throwsAndKeepsUsage | 450 + 60 → exception, used vẫn 450 |
| reserve_exactlyAtLimit_ok | biên: = 500 triệu được phép |
| reserve_resetsAtVietnamMidnight | Clock cố định 16:59:59Z và 17:00:01Z (= 0h VN) |
| release_usesReservationDate | hoàn đúng ngày cũ khi qua nửa đêm |
| vipLimit_overridesDefault | cấu hình 2 tỷ |
| **concurrentReserve_neverExceedsLimit** | Testcontainers PG thật, 20 thread × 80 triệu, hạn mức 500 triệu → đúng 6 thành công, used = 480 triệu |

Test đồng thời dùng {{ExecutorService}} + {{CountDownLatch}} để các thread bắt đầu cùng lúc; lặp 50 lần để lỗi race (nếu có) lộ ra ổn định. Không dùng H2 cho test này: H2 không có {{ON CONFLICT}} giống PostgreSQL và khoá dòng khác.

> Senior tip: viết test đồng thời **trước**, chạy với bản check-then-act của bản nháp để thấy nó fail (đỏ), rồi mới sửa. Đưa ảnh chụp kết quả đỏ → xanh vào PR, người review tin ngay.`
    },
    {
      key: 'review',
      title: 'Code review & CI',
      role: 'Bạn review PR của đồng đội, CI báo đỏ',
      story: `Đồng đội mở PR cho story 4 (xử lý kết quả core banking). Pipeline CI (GitHub Actions: build → unit test → Testcontainers → SonarQube → build image → Trivy scan) vừa chạy xong.`,
      artifacts: [
        { name: 'PR-812.diff', lang: 'java', content: `+    public TransferResult execute(TransferCommand cmd) {
+        LocalDate d = limitService.reserve(cmd.customerId(), cmd.amount());
+        log.info("transfer {} from {} to {} amount {}", cmd.id(), cmd.fromAccount(),
+                 cmd.toAccount(), cmd.amount());
+        try {
+            CoreResponse r = coreClient.transfer(cmd);
+            if (r.isSuccess()) {
+                transferRepo.markSuccess(cmd.id());
+            } else {
+                limitService.release(cmd.customerId(), d, cmd.amount());
+                transferRepo.markFailed(cmd.id(), r.code());
+            }
+            return TransferResult.of(r);
+        } catch (Exception e) {
+            limitService.release(cmd.customerId(), d, cmd.amount());
+            transferRepo.markFailed(cmd.id(), "ERROR");
+            return TransferResult.failed();
+        }
+    }` },
        { name: 'ci-run-4471.log', lang: 'text', content: `[test] TransferFlowIT > concurrentReserve_neverExceedsLimit  PASSED (3.2s)
[test] TransferFlowIT > coreTimeout_marksFailed                 PASSED
[sonar] Quality gate: FAILED
        - Coverage on new code: 61.4% (required >= 80%)
        - 1 Security Hotspot: "Make sure logging this data is safe" (TransferExecutor.java:14)
[trivy] ghcr.io/bank/transfer-service:sha-9f2c1e
        HIGH  CVE-2026-xxxx  libexpat 2.5.0-1  (base image eclipse-temurin:21-jre-jammy)
Result: FAILED (quality gate, vulnerability HIGH)` }
      ],
      task: `Viết các comment review bạn sẽ để lại trên PR (ghi rõ **blocker** hay **nit**), và nói cần làm gì để CI xanh mà không "tắt kiểm tra".`,
      answer: `**Tóm tắt:** PR có một blocker nghiệp vụ nghiêm trọng (timeout bị coi là thất bại → hoàn hạn mức và báo khách thất bại trong khi core có thể đã trừ tiền), một vấn đề bảo mật (log số tài khoản), và test đang **xác nhận hành vi sai**. CI đỏ là đúng; sửa nguyên nhân, không hạ ngưỡng.

### Comment review
1. **[Blocker] catch Exception gộp timeout với lỗi:** {{SocketTimeoutException}}/{{ReadTimeout}} nghĩa là *không biết* core đã trừ tiền chưa. Đánh FAILED + hoàn hạn mức → khách chuyển lại → **chuyển 2 lần, vượt hạn mức**. Đề xuất: timeout → {{markUnknown}}, không hoàn; job đối soát chốt sau. Test {{coreTimeout_marksFailed}} đang khẳng định hành vi sai, cần đổi thành {{coreTimeout_marksUnknown_keepsReservation}}.
2. **[Blocker] Log PII:** số tài khoản nguồn/đích ghi thẳng vào log (đúng hotspot Sonar báo). Log chỉ {{transferId}} và tài khoản đã mask ({{****1234}}); số tiền tuỳ chính sách.
3. **[Major] Thứ tự release/mark:** nếu {{markFailed}} lỗi sau khi đã {{release}} thì hạn mức hoàn nhưng trạng thái vẫn RESERVED. Gộp release + đổi trạng thái vào **cùng một transaction** (một method {{@Transactional}} ở bean khác, tránh self-invocation).
4. **[Major] Kết quả core không xác định code lỗi:** phân biệt lỗi nghiệp vụ (số dư không đủ → FAILED) và lỗi kỹ thuật 5xx (có thể retry an toàn vì có idempotency key).
5. **[Nit]** {{TransferResult.failed()}} mất mã lỗi → app không hiển thị được lý do.

### Làm CI xanh đúng cách
- **Coverage 61%:** thêm test cho các nhánh còn thiếu (5xx, timeout, lỗi nghiệp vụ, markFailed lỗi). Không thêm {{@Generated}} hay loại file khỏi Sonar để lách.
- **Security hotspot:** sửa log như trên, rồi đánh dấu reviewed.
- **CVE HIGH trong base image:** nâng {{eclipse-temurin:21-jre}} lên bản vá mới nhất (rebuild image); nếu chưa có bản vá thì đánh giá có bị ảnh hưởng không và ghi ngoại lệ có hạn ({{.trivyignore}} kèm ngày hết hạn + ticket), được security đồng ý.

> Senior tip: comment blocker nên kèm **kịch bản thất bại cụ thể** ("core trả timeout sau khi đã trừ tiền → …") và gợi ý sửa. Review kiểu "code này không ổn" chỉ tạo tranh cãi; review kèm kịch bản thì người viết tự thấy.`
    },
    {
      key: 'test',
      title: 'Kiểm thử (SIT / UAT / hiệu năng)',
      role: 'Bạn cùng QA lập kế hoạch test, đọc báo cáo load test',
      story: `Code đã merge vào nhánh chính, deploy lên **SIT**. QA hỏi bạn: "Story này test những gì ngoài happy path?". Song song, DevOps chạy load test k6 mô phỏng ngày lương trên môi trường perf.`,
      artifacts: [
        { name: 'k6-summary.txt', lang: 'text', content: `scenario: payday  (ramp 0 -> 900 VU trong 5m, giữ 10m)
http_req_duration{endpoint:transfer} ... p(95)=1.92s  p(99)=6.40s
http_req_failed ......................... 3.81%
  - 503 (hikari: Connection is not available, request timed out after 30000ms): 3.1%
  - 422 LIMIT_EXCEEDED: 0.7% (kỳ vọng)
db: active connections 10/10 suốt 9 phút; pg_stat_activity: 46 phiên "idle in transaction"
transfer-service config: spring.datasource.hikari.maximum-pool-size=10, replicas=4` }
      ],
      task: `1. Lập danh sách test case cho QA (chức năng, biên, đồng thời, lỗi tích hợp, dữ liệu) — ít nhất 10 case.
2. Đọc kết quả k6: chỉ ra nguyên nhân gốc khả dĩ nhất và cách kiểm chứng, **trước khi** ai đó đề xuất "tăng pool lên 100".`,
      answer: `**Tóm tắt:** test phải bao các biên tiền, biên thời gian (nửa đêm giờ VN), đồng thời, idempotency và lỗi core (timeout/5xx/lỗi nghiệp vụ). Load test cho thấy connection bị giữ lâu ("idle in transaction") → gần như chắc có một transaction đang bao quanh lời gọi HTTP tới core; tăng pool chỉ dời điểm sập.

### Test case
| # | Loại | Case |
|---|---|---|
| 1 | Biên | Chuyển đúng 500.000.000 khi chưa dùng → thành công |
| 2 | Biên | 500.000.001 → LIMIT_EXCEEDED |
| 3 | Biên thời gian | Dùng hết lúc 23:59:59 VN, chuyển lại 00:00:01 → được |
| 4 | Biên thời gian | Giữ hạn mức 23:59:58, core thất bại 00:00:03 → hoàn vào ngày cũ |
| 5 | Đồng thời | 2 thiết bị cùng chuyển 80 triệu khi còn 100 triệu → đúng 1 thành công |
| 6 | Idempotency | Gửi lại cùng key → cùng kết quả, không trừ 2 lần |
| 7 | Lỗi core | Số dư không đủ → FAILED, hạn mức hoàn |
| 8 | Lỗi core | Timeout → UNKNOWN, hạn mức giữ; job đối soát chốt đúng |
| 9 | Lỗi core | 503 rồi retry thành công → chỉ trừ 1 lần |
| 10 | Cấu hình | VIP 2 tỷ có hiệu lực, đổi cấu hình giữa ngày |
| 11 | Hiển thị | API hạn mức còn lại khớp sau mỗi giao dịch |
| 12 | Audit | Mỗi thay đổi hạn mức có bản ghi audit |
| 13 | Hồi quy | Chuyển liên ngân hàng không bị ảnh hưởng |

### Đọc kết quả k6
- **Triệu chứng:** pool 10/10 suốt 9 phút, 46 phiên {{idle in transaction}}, 503 do Hikari chờ 30 s.
- **Ý nghĩa:** "idle in transaction" = đã BEGIN, không chạy SQL nào nhưng chưa COMMIT → ứng dụng đang **làm việc khác trong transaction**, điển hình là gọi HTTP tới core (p99 vài giây).
- **Kiểm chứng:** thread dump lúc tải cao ({{jcmd <pid> Thread.print}}): thấy thread HTTP đang chờ socket core trong stack có {{TransactionInterceptor}}; bật {{spring.jpa.open-in-view=false}} và kiểm tra lại (OSIV mặc định bật cũng giữ connection cả request); metrics {{hikaricp_connections_usage_seconds}}.
- **Sửa:** đưa lời gọi core ra ngoài transaction (đúng thiết kế đã chốt, có thể bị phá khi merge), tắt OSIV, timeout core 5 s. Chạy lại k6 rồi mới cân nhắc pool size theo công thức (số core DB, số replica): 4 replica × 10 = 40 connection là hợp lý cho DB 8 vCPU.

> Senior tip: con số "tăng pool" là thuốc giảm đau. Với 4 replica, pool 100 = 400 connection vào PostgreSQL, mỗi connection là một process (~10 MB) → DB sập thay cho app. Luôn tìm xem **ai đang giữ connection và vì sao** trước.`
    },
    {
      key: 'deploy',
      title: 'Deploy lên production',
      role: 'Bạn viết kế hoạch release và chạy canary',
      story: `Sau UAT, PO duyệt. Release vào thứ Ba. Thay đổi gồm: migration tạo bảng mới + cột {{status}} thêm giá trị RESERVED/UNKNOWN, code mới, cấu hình hạn mức, job đối soát. App mobile cũ vẫn chạy (không gửi Idempotency-Key).`,
      artifacts: [
        { name: 'rollout.txt', lang: 'text', content: `$ kubectl argo rollouts get rollout transfer-service -n payments
Name:            transfer-service
Status:          ॥ Paused   (canary step 2/6: setWeight 10, pause 15m)
Images:          ghcr.io/bank/transfer-service:sha-9f2c1e (stable)
                 ghcr.io/bank/transfer-service:sha-b71d03 (canary)
Replicas:        Desired 8  Current 9  Updated 1  Ready 9

Grafana (10 phút gần nhất)        stable     canary
  error rate 5xx                   0.08%      0.11%
  p95 latency                      402 ms     431 ms
  LIMIT_EXCEEDED / phút            -          14
  transfer UNKNOWN / phút          -          0` }
      ],
      task: `1. Viết kế hoạch release: thứ tự migration/code/cấu hình, feature flag, các bước canary, **tiêu chí dừng/rollback** bằng số.
2. Với số liệu canary hiện tại: tiếp tục hay dừng? Vì sao?
3. Làm sao để rollback code không bị migration chặn?`,
      answer: `**Tóm tắt:** tách release thành các bước có thể đảo ngược: migration **chỉ thêm** (expand) chạy trước, code mới đứng sau feature flag, canary tăng dần với tiêu chí dừng định lượng, và chỉ xoá cái cũ (contract) ở release sau.

### Kế hoạch
1. **T-1 ngày:** migration expand bằng Flyway: tạo {{daily_limit_usage}}, {{limit_config}}, {{outbox}}; cột status chỉ thêm giá trị mới, không đổi kiểu. Code đang chạy không bị ảnh hưởng.
2. **Release:** image mới, flag {{limit.enforce=false}} (chỉ đếm, không chặn: "shadow mode") trong 1 ngày → so sánh số liệu đếm với SUM thực tế.
3. **Bật flag** theo phần trăm khách: 1% nhân viên nội bộ → 10% → 50% → 100%.
4. **Canary** (Argo Rollouts): 10% → 25% → 50% → 100%, mỗi bước 15 phút, kèm analysis tự động.
5. **App cũ không gửi key:** server tự sinh key từ (customerId, clientRequestId nếu có) hoặc chấp nhận không idempotent cho app cũ đến hạn bắt buộc cập nhật; ghi rõ rủi ro cho PO.

### Tiêu chí dừng (tự động rollback)
| Chỉ số | Ngưỡng |
|---|---|
| 5xx canary | > 0.5% hoặc > 2× stable trong 5 phút |
| p95 | > stable + 30 ms (đúng NFR) trong 10 phút |
| UNKNOWN | > 0.1% giao dịch |
| Đối soát | used_amount lệch SUM bất kỳ khách nào |

### Số liệu hiện tại
5xx 0.11% so với 0.08% (dưới ngưỡng), p95 +29 ms (sát ngưỡng 30 ms) → **tiếp tục nhưng theo dõi p95**; LIMIT_EXCEEDED 14/phút là hành vi mới đúng kỳ vọng (cần đối chiếu với số khách thực sự vượt trong shadow mode). UNKNOWN = 0.

### Rollback không bị migration chặn
- Migration chỉ **thêm** bảng/cột nullable → image cũ vẫn chạy với schema mới.
- Không đổi tên/xoá cột trong cùng release (làm ở release sau, khi chắc không quay lại).
- Rollback = đổi image về stable + tắt flag; dữ liệu trong bảng mới giữ nguyên để điều tra.

> Senior tip: viết **runbook rollback trước** khi deploy (lệnh cụ thể, ai bấm, mất bao lâu) và tập rollback trên UAT. Lúc sự cố xảy ra 9h sáng ngày lương, không ai nên phải nghĩ.`
    },
    {
      key: 'bugfix',
      title: 'Sự cố production & fix bug',
      role: 'Bạn trực on-call ngày 25',
      story: `Ngày 25, 09:40. Tổng đài nhận 37 phản ánh: "chưa chuyển được đồng nào mà app báo hết hạn mức hôm nay". Khách bức xúc vì phải trả lương cho nhân viên. Bạn là on-call.`,
      artifacts: [
        { name: 'logs-0912.txt', lang: 'text', content: `2026-12-25T09:12:03.118+07:00 INFO  [transfer-service-7c9d-x2k] TransferExecutor : reserved transferId=4f1e..a9 customer=88120431 amount=300000000 bizDate=2026-12-25
2026-12-25T09:12:08.121+07:00 WARN  [transfer-service-7c9d-x2k] CoreBankingClient : core timeout after 5000ms transferId=4f1e..a9
2026-12-25T09:12:08.125+07:00 INFO  [transfer-service-7c9d-x2k] TransferExecutor : status=UNKNOWN transferId=4f1e..a9
2026-12-25T09:12:41.530+07:00 INFO  [transfer-service-7c9d-x2k] TransferExecutor : reserved transferId=b210..5c customer=88120431 amount=200000000 bizDate=2026-12-25
2026-12-25T09:12:46.533+07:00 WARN  [transfer-service-7c9d-x2k] CoreBankingClient : core timeout after 5000ms transferId=b210..5c
2026-12-25T09:12:46.534+07:00 INFO  [transfer-service-7c9d-x2k] TransferExecutor : status=UNKNOWN transferId=b210..5c
2026-12-25T09:13:10.002+07:00 INFO  [transfer-service-7c9d-x2k] TransferExecutor : LIMIT_EXCEEDED customer=88120431 amount=50000000 used=500000000
2026-12-25T09:15:00.004+07:00 INFO  [reconcile-job] ReconcileJob : start, unknown=1843
2026-12-25T09:15:00.211+07:00 ERROR [reconcile-job] ReconcileJob : core inquiry failed status=429 Too Many Requests (rate limit 20 rps)
2026-12-25T09:15:00.212+07:00 INFO  [reconcile-job] ReconcileJob : end, resolved=0 failed=1843` },
        { name: 'core-inquiry.txt', lang: 'text', content: `GET /core/v2/transfers?clientRef=4f1e..a9   -> 404 NOT_FOUND   (core chưa từng nhận)
GET /core/v2/transfers?clientRef=b210..5c   -> 404 NOT_FOUND
(core-banking: tỉ lệ timeout 09:00-09:30 = 7.9%, vendor xác nhận quá tải hàng đợi đầu vào)` }
      ],
      task: `1. Nguyên nhân gốc là gì? Dẫn chứng từ log.
2. Việc làm **ngay trong 30 phút** để khách chuyển được tiền (an toàn, có kiểm soát).
3. Sửa dài hạn và các mục cho postmortem.`,
      answer: `**Tóm tắt:** thiết kế UNKNOWN đúng (không hoàn mù), nhưng **job đối soát không chạy được** dưới tải: nó gọi core 1.843 lần một lúc, bị rate limit 20 rps → 429 → không chốt được giao dịch nào → hạn mức của khách bị giữ oan cả buổi sáng.

### Nguyên nhân gốc và dẫn chứng
- Khách 88120431: giữ 300 triệu (09:12:03) + 200 triệu (09:12:41), cả hai **timeout → UNKNOWN**, hạn mức dùng 500 triệu, lệnh 50 triệu bị LIMIT_EXCEEDED (09:13:10).
- Core trả **404** cho cả hai clientRef → core chưa từng nhận, hạn mức lẽ ra phải được hoàn.
- 09:15:00 job đối soát: 1.843 UNKNOWN, tất cả lỗi **429** vì gọi dồn vượt 20 rps; không có retry/backoff → resolved=0.
- Gốc rễ sâu hơn: core quá tải (timeout 7.9%), và giả định "UNKNOWN hiếm" (0.6%) sai ngày lương.

### Trong 30 phút
1. **Thông báo sự cố** (status page nội bộ, tổng đài có kịch bản trả lời), chỉ định 1 người chỉ huy.
2. **Chạy đối soát có giới hạn tốc độ** bằng tay: 15 rps (dưới ngưỡng 20), ưu tiên giao dịch cũ nhất; 404 → FAILED + hoàn hạn mức trong cùng transaction; SUCCESS → chốt. 1.843 bản ghi xong khoảng 2 phút.
3. Nếu core vẫn không trả lời được: **tạm nới** — flag "giao dịch UNKNOWN quá 10 phút không tính vào hạn mức" cho đến khi đối soát xong, được PO/compliance đồng ý (ghi vào ticket sự cố).
4. Theo dõi: số UNKNOWN giảm về gần 0, phản ánh tổng đài dừng.

### Sửa dài hạn
- Job đối soát: rate limiter (Resilience4j/Bucket4j) + backoff có jitter, xử lý theo lô, chạy mỗi phút, chạy lại an toàn (idempotent).
- Gọi core: circuit breaker; khi mở thì **từ chối sớm** ("hệ thống bận, thử lại sau") thay vì tạo thêm UNKNOWN.
- Alert: số UNKNOWN > 100 hoặc tuổi UNKNOWN > 5 phút; lỗi 429 từ job.
- Test tải có kịch bản core timeout 8% (lần trước chỉ test 0.6%).
- Trên app: hiển thị "giao dịch đang xử lý" thay vì "hết hạn mức".

### Postmortem (không đổ lỗi)
Timeline có giờ phút, impact (bao nhiêu khách, bao lâu), nguyên nhân gốc theo 5 Whys, điều làm tốt (UNKNOWN đã ngăn chuyển trùng), điều cần cải thiện, action item có **người phụ trách + hạn**.

> Senior tip: khi kể sự cố trong phỏng vấn, nhấn vào quyết định khó: "tôi không hoàn hạn mức hàng loạt mà đối soát từng giao dịch, vì hoàn mù có thể khiến khách chuyển trùng 300 triệu". Đó là thứ phân biệt Senior với người chỉ biết restart pod.`
    }
  ],
  interview: {
    story: `### Kể lại theo STAR (khoảng 2 phút)
- **Situation:** ngân hàng số 2 triệu khách, quy định mới bắt buộc hạn mức chuyển tiền 500 triệu/ngày, deadline cố định; ngày lương tải 820 TPS.
- **Task:** tôi chịu trách nhiệm kỹ thuật phần giữ hạn mức: đúng tuyệt đối khi đồng thời, không làm chậm quá 30 ms p95, không làm hỏng luồng chuyển tiền đang chạy.
- **Action:** làm rõ 10 câu hỏi nghiệp vụ trước khi ước lượng (đặc biệt "giao dịch timeout tính thế nào"); thiết kế UPDATE có điều kiện nguyên tử thay vì check-then-act, tách lời gọi core ra ngoài transaction, trạng thái UNKNOWN + đối soát; viết test đồng thời với Testcontainers; release bằng shadow mode → flag theo % → canary có tiêu chí rollback bằng số.
- **Result:** go-live đúng hạn, 0 trường hợp vượt hạn mức sau 3 tháng, p95 tăng 24 ms. Sự cố ngày 25 (job đối soát bị rate limit) xử lý trong 25 phút; sau đó thêm rate limiter + circuit breaker, ngày lương tháng sau 0 phản ánh.
- **Bài học:** tính đúng của hệ thống tiền nằm ở các trạng thái "không chắc chắn", và mọi job bù trừ đều phải được test dưới tải.`,
    questions: [
      { q: 'Vì sao bạn không dùng SELECT FOR UPDATE hay Redis cho hạn mức?', a: `UPDATE có điều kiện cho cùng tính đúng với **một round-trip** và khoá dòng rất ngắn; SELECT FOR UPDATE cần 2 câu và dễ có chỗ quên khoá. Redis nhanh hơn nhưng thêm một nguồn dữ liệu phải đối soát với DB, trong khi PostgreSQL ở 820 TPS chỉ khoá **một dòng mỗi khách**, không có điểm nóng chung. Tôi đo trên môi trường perf: p95 câu UPDATE dưới 3 ms. Nếu tải tăng 10 lần hoặc hạn mức cần chia sẻ giữa nhiều hệ thống, tôi mới cân nhắc Redis (INCRBY kèm Lua kiểm tra hạn mức) với đối soát định kỳ.` },
      { q: 'Nếu core banking trả timeout, bạn có hoàn hạn mức cho khách không?', a: `Không hoàn ngay. Timeout nghĩa là **không biết**: core có thể đã trừ tiền. Hoàn ngay sẽ cho khách chuyển lại → chuyển trùng và vượt hạn mức. Tôi đánh dấu UNKNOWN, giữ hạn mức, rồi job đối soát hỏi core theo idempotency key: core không có → FAILED + hoàn; core có → SUCCESS. Bài học từ sự cố là job này phải có rate limit, backoff và alert theo tuổi của UNKNOWN, nếu không khách bị giữ hạn mức oan.` },
      { q: 'Làm sao bạn chứng minh code không vượt hạn mức khi đồng thời?', a: `Bằng test tích hợp trên PostgreSQL thật (Testcontainers): 20 thread, mỗi thread 80 triệu, hạn mức 500 triệu, dùng CountDownLatch cho các thread bắt đầu cùng lúc, lặp 50 lần; kỳ vọng đúng 6 thành công và used = 480 triệu. Tôi chạy test đó với bản check-then-act cũ trước để thấy nó fail, rồi mới sửa. Trên production có thêm job đối soát used_amount với SUM giao dịch thành công mỗi đêm, lệch là alert.` },
      { q: 'Bạn release thay đổi rủi ro như vậy thế nào để có thể quay lại?', a: `Migration chỉ thêm (expand), chạy trước 1 ngày, code cũ vẫn chạy được. Code mới đi sau feature flag: 1 ngày shadow mode chỉ đếm không chặn để so sánh số liệu, rồi bật theo % khách. Canary Argo Rollouts 10 → 25 → 50 → 100% với analysis tự động: 5xx, p95, tỉ lệ UNKNOWN. Rollback = đổi image + tắt flag, đã tập trên UAT; xoá cột cũ để release sau.` },
      { q: 'Nếu làm lại, bạn sẽ làm gì khác?', a: `Hai điều. Một: test tải với **tỉ lệ lỗi của hệ thống phụ thuộc** ở mức xấu nhất từng ghi nhận (core timeout 8%), không phải mức trung bình; lỗi job đối soát sẽ lộ trước go-live. Hai: thống nhất với vendor core banking một API tra cứu theo lô và hạn mức gọi riêng cho đối soát ngay từ giai đoạn phân tích, vì đó là phụ thuộc ngoài team, cần thời gian thương lượng.` }
    ]
  },
  tags: ['payments', 'concurrency', 'idempotency', 'canary', 'incident']
},
{
  id: 'sdlc-002',
  title: 'Flash voucher giới hạn lượt dùng cho đêm sale 11.11',
  level: 'senior',
  domain: 'Thương mại điện tử',
  context: `Bạn là **Senior Java Developer** trong squad Promotion của một sàn thương mại điện tử (~8 triệu người dùng hoạt động mỗi tháng; đêm 11.11 năm ngoái có khoảng 1,2 triệu người online lúc 00:00).
Squad gồm: 1 PO, 1 BA, 5 dev backend (Java 21, Spring Boot 3.3), 2 QA, 1 SRE. Sprint 2 tuần; môi trường DEV → STG → PERF → PROD trên **EKS**, deploy bằng Argo CD + Argo Rollouts. Toàn sàn **code freeze từ 09/11**, mọi ngoại lệ phải được PO và SRE duyệt.

Hệ thống liên quan:
- {{promotion-service}} (squad bạn sở hữu): quản lý voucher, kiểm tra điều kiện, giữ và trả lượt dùng. Dữ liệu ở PostgreSQL 16 ({{promo-db}}, RDS) và Redis 7 ({{promo-redis}}, ElastiCache cluster mode, 3 shard, bật in-transit encryption; cluster này **dùng chung** với cache giỏ hàng của {{cart-service}}).
- {{order-service}}: tạo đơn, gọi promotion-service **đồng bộ** để giữ lượt voucher; phát sự kiện đơn hàng lên Kafka topic {{order-events}} (24 partition, key = orderId).
- {{payment-service}}: thanh toán; đơn chưa thanh toán sau 15 phút bị order-service huỷ tự động (sự kiện {{ORDER_EXPIRED}}).

> Đi lần lượt từng giai đoạn. Ở mỗi giai đoạn: đọc tình huống + artifact, tự làm phần "Việc của bạn" (viết ra, càng cụ thể càng tốt), rồi mới mở đáp án mẫu hoặc nhờ AI chấm.`,
  stages: [
    {
      key: 'requirement',
      title: 'Nhận requirement',
      role: 'PO gửi ticket, bạn cùng BA làm rõ trước khi ước lượng',
      story: `Ngày 20/10, ba tuần trước 11.11. Marketing chốt "mồi câu" của đêm sale: **50.000 mã FLASH1111 giảm 100.000đ** cho đơn từ 300.000đ, mở đúng 00:00. PO đưa ticket vào sprint với nhãn must-have.

Năm ngoái một chương trình tương tự (do team khác làm, đếm lượt bằng một dòng trong bảng PostgreSQL) bị **phát vượt 3.100 lượt** và tạo đơn chậm gần 10 giây trong 4 phút đầu. CTO dặn: "năm nay không được vượt một lượt nào". Buổi refinement có 40 phút.`,
      artifacts: [
        { name: 'PROMO-2207.txt', lang: 'text', content: `PROMO-2207  [Story]  Flash voucher 11.11 - FLASH1111
Priority: Highest       Reporter: PO Promotion       Sprint: 2026-S43
Labels: campaign-1111, voucher, must-have

Mô tả:
  Mở lúc 00:00:00 ngày 11/11, số lượng có hạn 50.000 lượt.
  Giảm 100.000đ cho đơn từ 300.000đ (trước phí ship).
  Hết lượt thì hiện "Đã hết lượt" trên trang voucher và ở giỏ hàng.
  Banner hiển thị thanh "đã dùng X%" để tạo hiệu ứng khan hiếm.

Ghi chú từ Marketing:
  - Ngân sách: 5 tỷ (= 50.000 x 100.000đ), KHÔNG được vượt
  - Mỗi khách chỉ nên dùng 1 lần?? (confirm lại)
  - Có thể mở thêm đợt 2 lúc 12:00 nếu hết sớm

Acceptance criteria:
  - Không phát vượt 50.000 lượt
  - Chịu được tải 11.11` }
      ],
      task: `1. Liệt kê **ít nhất 8 câu hỏi làm rõ** (nghiệp vụ, vòng đời của một lượt voucher, phi chức năng, vận hành) và giải thích vì sao mỗi câu ảnh hưởng tới thiết kế.
2. Viết **acceptance criteria** Given/When/Then cho ít nhất 5 tình huống, trong đó bắt buộc có: huỷ đơn / hết hạn thanh toán, và gọi lại (retry).`,
      answer: `**Tóm tắt:** "50.000 lượt" chưa phải requirement. Phải định nghĩa **một lượt bị trừ lúc nào, được trả lại lúc nào** (áp mã, đặt đơn, thanh toán, huỷ, hoàn hàng), giới hạn theo ai, và tải bao nhiêu. Mỗi câu trả lời thay đổi thiết kế, nên phải hỏi trước khi ước lượng.

### Câu hỏi làm rõ
| Nhóm | Câu hỏi | Vì sao quan trọng |
|---|---|---|
| Vòng đời | Lượt bị trừ lúc **áp mã vào giỏ**, lúc **đặt đơn** hay lúc **thanh toán thành công**? | Trừ lúc áp mã → bot giữ hết lượt mà không mua; trừ lúc thanh toán → 10.000 người cùng đặt đơn với lượt cuối, phát vượt |
| Vòng đời | Đơn chưa thanh toán bị huỷ sau 15 phút hoặc thanh toán thất bại: **có trả lượt** không? | Cần luồng trả lượt theo sự kiện, và luồng đó phải idempotent |
| Vòng đời | Đơn đã giao rồi **hoàn hàng / hoàn tiền**: có trả lượt? Có thu hồi tiền giảm? | Ảnh hưởng kế toán và luồng refund |
| Giới hạn | **Một khách dùng mấy lần**? Tính theo userId, số điện thoại hay thiết bị? | Chống lạm dụng nhiều tài khoản; quyết định key per-user |
| Ngân sách | "Không vượt 5 tỷ" là cứng tuyệt đối hay chấp nhận sai số (ví dụ ≤ 0,1%)? | Quyết định phải nguyên tử tuyệt đối hay được đếm gần đúng |
| Đơn tách | Giỏ nhiều shop bị tách thành nhiều đơn con: voucher áp vào đâu, huỷ một đơn con thì sao? | Bẫy kinh điển của sàn, dễ trả lượt sai |
| Hiển thị | "Đã dùng X%" cần chính xác đến đâu, trễ bao nhiêu giây chấp nhận được? | Chấp nhận trễ 1–2 giây thì được cache, giảm tải hàng chục lần |
| Tải | Bao nhiêu người online lúc 00:00? Có số liệu năm ngoái không? | Định cỡ Redis, DB, số pod |
| Chống bot | Có captcha / rate limit theo user không? | Bot có thể vét 50.000 lượt trong vài giây |
| Vận hành | Ai được dừng khẩn cấp (kill switch)? Đợt 2 lúc 12:00 cấu hình thế nào? | Cấu hình động, không deploy giữa đêm sale |

### Quyết định của PO (ghi vào ticket)
- 1 tài khoản đúng 1 lượt. Lượt được **giữ khi đặt đơn** (RESERVED), **chốt khi thanh toán** (USED), **trả lại** khi đơn bị huỷ trước thanh toán, thanh toán thất bại hoặc hết hạn 15 phút (RELEASED).
- Hoàn hàng sau khi giao: **không** trả lượt. Ngân sách là giới hạn cứng.
- Voucher áp cho đơn tổng trước khi tách. Thanh % được trễ tối đa 2 giây.

### Acceptance criteria mẫu
- **AC1 – Lượt cuối:** Given còn 1 lượt, When 2 khách cùng đặt đơn, Then đúng 1 đơn được giảm, đơn kia nhận {{VOUCHER_SOLD_OUT}} và vẫn đặt được đơn không voucher.
- **AC2 – Một lần mỗi khách:** Given khách A đã có lượt RESERVED hoặc USED, When A đặt đơn thứ hai với FLASH1111, Then bị từ chối {{VOUCHER_ALREADY_USED}}.
- **AC3 – Trả lượt:** Given đơn của A hết hạn thanh toán, Then còn lượt tăng 1 và A được đặt lại.
- **AC4 – Retry:** Given order-service gọi giữ lượt 2 lần cùng orderId (lần 1 timeout), Then chỉ trừ 1 lượt và lần 2 trả về đúng kết quả lần 1.
- **AC5 – Sự kiện giao trùng:** Given sự kiện {{ORDER_EXPIRED}} của một đơn được xử lý 2 lần, Then lượt chỉ được trả **đúng 1 lần**.
- **AC6 – Hoàn hàng:** Given đơn đã giao bị hoàn, Then lượt không được trả.
- **AC7 – Chưa mở:** Given 23:59:59 ngày 10/11, When áp mã, Then {{VOUCHER_NOT_STARTED}}.

### Pitfall thực tế
- Coi "50.000" là một con số đếm đơn giản, quên các trạng thái trung gian (đã đặt, chưa trả tiền).
- Không viết AC cho "sự kiện đến 2 lần": Kafka giao **ít nhất một lần**, nên trùng là chuyện bình thường, không phải ngoại lệ.

> Senior tip: vẽ state machine của một lượt voucher (AVAILABLE → RESERVED → USED hoặc RELEASED) ngay trong buổi refinement. PO hiểu ngay câu hỏi "trừ lúc nào, trả lúc nào", và hình đó đi thẳng vào design doc, test case và dashboard đối soát.`,
      pitfalls: ['Trừ lượt lúc áp mã vào giỏ (bot giữ hết lượt)', 'Không hỏi chuyện trả lượt khi huỷ / hết hạn thanh toán', 'Không có AC cho sự kiện giao trùng']
    },
    {
      key: 'analysis',
      title: 'Phân tích tải & ước lượng',
      role: 'Bạn định cỡ hệ thống, chia việc, nêu rủi ro',
      story: `SRE gửi số liệu đêm 11.11 năm ngoái và kết quả đo nhanh trên môi trường PERF. Trong buổi họp, tech lead nói: "luồng trả lượt chỉ vài chục event mỗi giây, tải nhẹ, không cần load test riêng, tập trung vào đường đặt đơn". Bạn cần định cỡ, chọn nơi đếm lượt và chia việc vừa 2 sprint.`,
      artifacts: [
        { name: 'traffic-1111-2025.txt', lang: 'text', content: `Đêm 11.11/2025 - chương trình FS2025 (20.000 lượt, đếm bằng 1 dòng PostgreSQL)
  người dùng online lúc 00:00         : ~1.200.000
  POST /api/v1/vouchers/{code}/apply  : peak 18.000 RPS (00:00:00-00:00:20), 92% là bấm lặp
  POST /api/v1/orders (tạo đơn)       : peak 2.400 RPS (00:00:05-00:01:30)
  thời gian hết lượt                  : 38 giây
  đơn chưa thanh toán sau 15 phút     : 18,7% -> bị huỷ dồn trong 00:15-00:17
  sự cố: phát vượt 3.100 lượt; p99 tạo đơn 9,8 s trong 4 phút đầu` },
        { name: 'perf-quick-bench.txt', lang: 'text', content: `PERF promo-db (db.r6g.2xlarge, PostgreSQL 16) - pgbench custom script, 30s
  UPDATE voucher SET used = used + 1 WHERE id = 9001 AND used < quota;
  clients=50   tps=1083   latency avg 46 ms
  clients=400  tps=912    latency avg 438 ms   p99 2.31 s
  pg_stat_activity: 381/400 phiên wait_event_type=Lock

PERF promo-redis (cache.r7g.large, 1 shard, TLS) - redis-benchmark, script reserve.lua
  -c 400: 71.400 req/s   p99 2.9 ms` }
      ],
      task: `1. Định cỡ: tính tải lên Redis và PostgreSQL cho từng luồng (áp mã, đặt đơn, trả lượt).
2. Đếm lượt ở PostgreSQL hay Redis? Lập luận **bằng số liệu** trong artifact.
3. Chia việc thành task ≤ 3 ngày, có phụ thuộc. Nêu 4 rủi ro lớn nhất. Bạn có đồng ý với nhận định của tech lead về luồng trả lượt không?`,
      answer: `**Tóm tắt:** một dòng PostgreSQL chỉ chịu ~900–1.100 UPDATE/s và p99 2,3 s khi 400 phiên tranh nhau, trong khi tạo đơn đỉnh 2.400 RPS. Vì vậy: **đếm lượt bằng Redis (Lua nguyên tử), PostgreSQL làm sổ cái** (mỗi lượt giữ thành công là một dòng riêng), và tách đường "áp thử" 18.000 RPS khỏi đường "giữ lượt". Luồng trả lượt tải nhẹ nhưng **rủi ro về tính đúng** cao nhất.

### Định cỡ từng luồng
| Luồng | Tải đỉnh | Chạm vào đâu | Nhận xét |
|---|---|---|---|
| Áp thử ({{apply}}) | 18.000 RPS, 92% bấm lặp | Chỉ cần đọc | Không được ghi; nếu mỗi lần đều đọc cùng 1 key Redis → nguy cơ **hot key** |
| Giữ lượt (tạo đơn) | 2.400 RPS | Redis Lua 2.400/s | Benchmark 71.400/s trên 1 shard → dư ~30 lần |
| Ghi sổ cái | ~50.000 lượt trong ~40 s ≈ 1.250 INSERT/s | promo-db | Mỗi INSERT một dòng khác nhau → **không có hot row** |
| Trả lượt | 18,7% × 50.000 ≈ 9.350 sự kiện dồn trong 00:15–00:17 ≈ 75/s, đi theo đợt mỗi phút | Kafka → DB + Redis | Tải nhẹ, nhưng là chỗ dễ sai nhất |

### PostgreSQL hay Redis
- Bảng năm ngoái: mọi request cùng {{UPDATE}} **một dòng** → khoá dòng xếp hàng tuần tự; 400 phiên chờ Lock, p99 2,3 s, và 912 TPS < 2.400 RPS cần. Thêm CPU không giúp được vì nút thắt là **khoá trên một dòng**, không phải tài nguyên.
- Redis đơn luồng thực thi Lua **nguyên tử**: kiểm tra còn lượt + kiểm tra user + trừ trong một bước, không có race; 1 lệnh vài micro giây.
- Nhưng Redis replication bất đồng bộ: failover có thể mất vài lệnh vừa ghi. Vì vậy Redis là **bộ đếm nhanh**, còn PostgreSQL là **nguồn sự thật**: luôn tính lại được {{quota - count(RESERVED, USED)}} để đối soát và dựng lại Redis.

### Chia việc
1. Schema sổ cái + migration Flyway (1 ngày).
2. Lua giữ lượt + service + test đồng thời (3 ngày), giao người vững concurrency.
3. Luồng trả lượt từ {{order-events}}, idempotent (2 ngày).
4. API trạng thái "đã dùng X%" có cache (1 ngày).
5. Job pre-warm Redis + job đối soát + alert (2 ngày).
6. Kill switch, cấu hình đợt 2 (1 ngày). 7. Load test PERF (2 ngày, QA + SRE).
Phụ thuộc: 1 → 2 → 3; 4, 6 song song; 5 sau 2; 7 sau tất cả.

### Rủi ro lớn nhất
| Rủi ro | Dấu hiệu | Giảm thiểu |
|---|---|---|
| Phát vượt do race | Năm ngoái vượt 3.100 lượt | Lua nguyên tử + unique index trên sổ cái + test đồng thời |
| Hot key Redis ở đường áp thử | 18.000 RPS dồn vào 1 key, 1 shard | Cache cục bộ trong pod, chỉ đường giữ lượt chạm Redis |
| Trả lượt 2 lần | Kafka at-least-once, đợt huỷ dồn 00:15 | Trả lượt theo CAS trên sổ cái, test "sự kiện trùng" và "lỗi giữa chừng rồi retry" |
| Redis failover mất lệnh | Replication bất đồng bộ | Kill switch, dựng lại bộ đếm từ DB trước khi mở lại |

### Về nhận định của tech lead
Đồng ý tải nhẹ (~75 sự kiện/s), **không đồng ý** bỏ khỏi load test: đây là luồng có side effect (cộng lượt), chạy theo đợt dồn đúng lúc hệ thống còn nóng, và mọi lỗi ở đây trực tiếp làm **phát vượt ngân sách**. Ít nhất phải có một kịch bản 9.350 sự kiện {{ORDER_EXPIRED}} trong 2 phút, chạy song song tải đặt đơn, rồi đối soát số lượt.

> Senior tip: khi bác bỏ ý kiến cấp trên trong cuộc họp, đừng nói "em nghĩ cần test". Nói bằng rủi ro có giá: "nếu luồng này cộng thừa 1% thì là 500 lượt, tức 50 triệu ngoài ngân sách; một kịch bản k6 mất nửa ngày". Ghi quyết định cuối cùng vào ticket, kể cả khi ý của bạn không được chọn.`,
      pitfalls: ['Tăng CPU DB để chữa hot row', 'Coi Redis là nguồn sự thật duy nhất', 'Bỏ luồng trả lượt ra khỏi load test vì "tải nhẹ"']
    },
    {
      key: 'design',
      title: 'Thiết kế kỹ thuật',
      role: 'Bạn review design doc của dev mid trước buổi design review',
      story: `Một dev mid viết bản thiết kế đầu tiên cho luồng giữ và trả lượt. Bản này đã được demo trên máy local với 1 người bấm và "chạy đúng". Tech lead nhờ bạn review và đề xuất bản sửa trước buổi design review chiều thứ Năm (23/10).`,
      artifacts: [
        { name: 'flash-voucher-design-v1.md', lang: 'text', content: `Flash voucher - thiết kế v1 (@minh.dv)

POST /internal/vouchers/{code}/reserve   (order-service gọi khi tạo đơn)
  1. remaining = redis.get("voucher:FLASH1111:remaining")
  2. if remaining <= 0 -> SOLD_OUT
  3. if redis.sismember("voucher:FLASH1111:users", userId) -> ALREADY_USED
  4. redis.decr("voucher:FLASH1111:remaining")
  5. redis.sadd("voucher:FLASH1111:users", userId)
  6. reservationRepo.save(status = RESERVED)            // @Transactional
  7. kafkaTemplate.send("voucher-events", RESERVED)

Trả lượt: @KafkaListener("order-events") ORDER_CANCELLED | PAYMENT_FAILED | ORDER_EXPIRED
  -> redis.incr(remaining); redis.srem(users, userId);
     reservationRepo.updateStatus(orderId, RELEASED)

GET /api/v1/vouchers/{code}/status -> remaining / quota  (đọc thẳng Redis)

Redis là nguồn sự thật, bảng voucher_reservation chỉ để báo cáo.
Key không đặt TTL. Khởi tạo: SET remaining 50000 bằng tay lúc 23:59.` }
      ],
      task: `Liệt kê **mọi vấn đề** của bản v1 (ít nhất 6), xếp theo mức nghiêm trọng. Đề xuất thiết kế đã sửa: script giữ lượt, cách đặt key trên Redis cluster, schema sổ cái, luồng trả lượt idempotent, đối soát, khởi tạo. So sánh với ít nhất một phương án chỉ dùng PostgreSQL.`,
      answer: `**Tóm tắt:** bản v1 dùng Redis nhưng **mất tính nguyên tử** vì tách 4 lệnh rời (GET → SISMEMBER → DECR → SADD), trả lượt không idempotent, và coi Redis là nguồn sự thật. Bản sửa: **một Lua script** giữ lượt, key cùng hash slot, sổ cái PostgreSQL có unique index, trả lượt bằng **CAS trên sổ cái rồi mới cộng Redis sau commit**, cộng job đối soát.

### Vấn đề, theo mức nghiêm trọng
1. **Check-then-act (bước 1–5):** còn 1 lượt, 300 request cùng GET thấy 1, cùng DECR → remaining = -299, phát vượt 299 lượt. Bước 3 và 5 cũng race: cùng một user bấm 2 tab → 2 lượt.
2. **Trả lượt không idempotent:** Kafka giao ít nhất một lần (rebalance, retry của error handler) → INCR 2 lần → cộng thừa lượt, vượt ngân sách.
3. **Redis là nguồn sự thật:** ElastiCache replication bất đồng bộ; primary chết ngay sau DECR → replica lên thay chưa có lệnh đó → lượt "sống lại". Không có gì để đối chiếu.
4. **Cluster mode:** hai key không cùng hash slot → không thể đặt vào một Lua script (lỗi CROSSSLOT).
5. **Khởi tạo bằng tay lúc 23:59:** gõ nhầm, chậm, hoặc chạy lại giữa đêm sale → đặt lại 50.000 → phát vượt.
6. **Kafka send cạnh transaction DB:** DB rollback nhưng event đã gửi, hoặc ngược lại.
7. **Status đọc thẳng Redis mỗi request:** 18.000 RPS vào cùng một key.
8. **Không TTL:** key campaign nằm mãi trong Redis dùng chung.

### Thiết kế đã sửa
Key dùng **hash tag** để cùng slot: {v:FLASH1111}:remaining và {v:FLASH1111}:users (phần trong ngoặc nhọn quyết định slot).
~~~text
-- reserve.lua   KEYS[1]=remaining  KEYS[2]=users  ARGV[1]=userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return -2 end  -- đã có lượt
local r = tonumber(redis.call('GET', KEYS[1]) or '-1')  -- chưa pre-warm = coi như đóng
if r <= 0 then return -1 end                                -- <= 0, không phải == 0
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return r - 1
~~~
~~~sql
CREATE TABLE voucher_reservation (
  id          BIGSERIAL   PRIMARY KEY,
  voucher_id  BIGINT      NOT NULL REFERENCES voucher(id),
  user_id     BIGINT      NOT NULL,
  order_id    VARCHAR(32) NOT NULL UNIQUE,          -- idempotency cho retry của order-service
  status      VARCHAR(10) NOT NULL,                 -- RESERVED, USED, RELEASED
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- chốt chặn thứ hai: 1 khách chỉ có 1 lượt đang hiệu lực, kể cả khi Redis sai
CREATE UNIQUE INDEX uq_resv_active ON voucher_reservation(voucher_id, user_id)
  WHERE status IN ('RESERVED', 'USED');
~~~
- **Giữ lượt:** Lua → INSERT sổ cái (transaction 1 câu). INSERT lỗi → gọi release.lua để bù.
- **Trả lượt:** tx { {{UPDATE ... SET status = 'RELEASED' WHERE order_id = ? AND status = 'RESERVED'}} } → **commit** → nếu đúng 1 dòng bị đổi thì mới gọi release.lua (SREM + INCR). Sự kiện trùng → 0 dòng → không cộng. Không gọi Redis **bên trong** transaction: nếu commit lỗi sau khi đã INCR, lần retry sẽ cộng thêm lần nữa.
- **Đối soát** mỗi 5 phút: {{expected = quota - count(RESERVED, USED)}} so với Redis; lệch quá 20 (giao dịch đang bay) thì alert. Chỉ cảnh báo, không tự sửa.
- **Pre-warm** bằng job, dựng từ DB, {{SET ... NX}}, đặt EXPIRE 3 ngày; failover Redis → bật kill switch, dựng lại rồi mới mở.
- **Status:** cache cục bộ trong pod 1 giây (PO cho phép trễ 2 giây).

### So sánh phương án
| Phương án | Ưu | Nhược |
|---|---|---|
| Redis Lua + sổ cái PG (chọn) | Nhanh, nguyên tử, ít tranh chấp | Hai nơi lưu, cần đối soát |
| PG một dòng {{used < quota}} | Đơn giản, đúng | Hot row, ~900 TPS (đã đo) |
| PG sinh sẵn 50.000 dòng, {{FOR UPDATE SKIP LOCKED}} | Chỉ một hệ thống, không hot row | Nhiều IO hơn, phải sinh trước, khó đổi số lượng |

> Senior tip: mọi side effect ngoài DB (Redis, HTTP, email) gắn với một transaction phải trả lời được câu hỏi "**nếu commit thất bại sau dòng này thì sao, và nếu message được giao lại thì sao?**". Viết câu hỏi đó vào checklist design review của team.`,
      pitfalls: ['Tách GET và DECR thành hai lệnh', 'Hai key không cùng hash slot trong Lua', 'Gọi Redis bên trong @Transactional', 'Coi r == 0 là hết lượt (bộ đếm âm thì sao?)']
    },
    {
      key: 'dev',
      title: 'Phát triển',
      role: 'Bạn code luồng giữ lượt + test đồng thời',
      story: `Thiết kế đã chốt theo bản sửa. Bạn nhận task giữ lượt; đồng đội Minh làm luồng trả lượt (listener Kafka). Quy ước của team: Spring Data Redis ({{StringRedisTemplate}}), Lua nạp sẵn dưới dạng {{RedisScript}}, test tích hợp bằng Testcontainers (PostgreSQL 16 + Redis 7). Dưới đây là phần đã có.`,
      artifacts: [
        { name: 'release.lua', lang: 'text', content: `-- release.lua   KEYS[1] = {v:CODE}:remaining   KEYS[2] = {v:CODE}:users   ARGV[1] = userId
-- CHỈ được gọi khi sổ cái đã chuyển RESERVED -> RELEASED thành công (CAS, 1 dòng)
redis.call('SREM', KEYS[2], ARGV[1])
return redis.call('INCR', KEYS[1])` },
        { name: 'ReservationRepository.java', lang: 'java', content: `public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByOrderId(String orderId);

    @Modifying
    @Query(value = """
        UPDATE voucher_reservation SET status = 'RELEASED', updated_at = now()
         WHERE order_id = :orderId AND status = 'RESERVED'""", nativeQuery = true)
    int markReleased(@Param("orderId") String orderId);   // 0 = đã trả / đã dùng / không có
}` }
      ],
      task: `1. Viết {{VoucherReservationService.reserve(code, userId, orderId, orderAmount)}}: kiểm tra điều kiện, gọi reserve.lua, ghi sổ cái, xử lý retry cùng orderId (AC4) và bù Redis khi ghi DB lỗi.
2. Liệt kê các test bạn sẽ viết (tên test + kiểm tra gì), trong đó có **test đồng thời** và test cho AC5.`,
      answer: `**Tóm tắt:** tính đúng nằm ở Lua (nguyên tử) và unique index (chốt chặn thứ hai). Service chỉ cần làm đúng ba việc: kiểm tra điều kiện **trước** khi chạm Redis, coi "user đã có lượt" + "cùng orderId" là retry thành công, và **bù Redis** khi sổ cái không ghi được.

~~~java
@Service
@RequiredArgsConstructor
public class VoucherReservationService {
    private final StringRedisTemplate redis;
    private final RedisScript<Long> reserveScript;   // nạp 1 lần; Spring gửi EVALSHA, NOSCRIPT thì tự EVAL
    private final RedisScript<Long> releaseScript;
    private final ReservationWriter writer;          // @Transactional, 1 câu INSERT
    private final ReservationRepository repo;
    private final VoucherRules rules;                // giờ mở, đơn tối thiểu: cache cục bộ, không chạm Redis

    public ReserveResult reserve(String code, long userId, String orderId, long orderAmount) {
        rules.check(code, orderAmount);              // ném NOT_STARTED / MIN_ORDER_NOT_MET
        List<String> keys = List.of("{v:" + code + "}:remaining", "{v:" + code + "}:users");
        Long r = redis.execute(reserveScript, keys, String.valueOf(userId));
        if (r == -1) return ReserveResult.soldOut();
        if (r == -2) return repo.findByOrderId(orderId)          // retry cùng orderId = thành công (AC4)
                .map(ReserveResult::ok).orElseGet(ReserveResult::alreadyUsed);
        try {
            return ReserveResult.ok(writer.insertReserved(code, userId, orderId));
        } catch (RuntimeException e) {                          // gồm DataIntegrityViolationException
            redis.execute(releaseScript, keys, String.valueOf(userId)); // bù: trả lại lượt vừa trừ
            throw e;                                             // order-service retry hoặc báo lỗi
        }
    }
}
~~~
Lưu ý khi đọc code:
- Chuỗi key là Java thường nên viết ngoặc nhọn được; đây chính là **hash tag** để hai key cùng slot.
- Lua trả {{-2}} cho cả "user đã dùng" lẫn "order-service gọi lại sau timeout"; phân biệt bằng sổ cái theo orderId. Còn một khe nhỏ: lần retry đến **trong lúc** lần đầu chưa commit INSERT → trả {{alreadyUsed}} oan. Chấp nhận được vì order-service chỉ retry sau timeout 2 giây; ghi rõ vào PR.
- Pod chết giữa Lua và INSERT → Redis đã trừ, sổ cái không có dòng → **thiếu** lượt (phát ít hơn), là hướng an toàn; job đối soát sẽ báo lệch âm để xử lý tay.
- Không đặt {{@Transactional}} trên {{reserve}}: không muốn giữ DB connection trong lúc gọi Redis.

### Test nên viết
| Test | Kiểm tra |
|---|---|
| reserve_lastSlot_twoUsers_onlyOneWins | remaining = 1, 2 user cùng lúc → đúng 1 ok |
| **reserve_concurrent_neverOversells** | quota 50, 500 thread × 500 user khác nhau, CountDownLatch cho cùng xuất phát, lặp 30 lần → đúng 50 ok, Redis = 0, DB 50 dòng RESERVED |
| reserve_sameUserTwoTabs_onlyOne | 20 thread cùng userId, orderId khác nhau → 1 ok, 19 alreadyUsed |
| reserve_retrySameOrder_returnsFirstResult | gọi 2 lần cùng orderId → cùng reservation, Redis chỉ trừ 1 |
| reserve_dbInsertFails_compensatesRedis | giả lập INSERT lỗi → remaining trở lại, user bị SREM |
| reserve_notStarted / belowMinOrder | không chạm Redis (kiểm tra bằng MONITOR hoặc spy) |
| release_duplicateEvent_releasesOnce (AC5) | cùng ORDER_EXPIRED xử lý 2 lần → INCR đúng 1 lần |
| reserve_counterNegative_rejects | đặt remaining = -5 → từ chối, không DECR thêm |

Testcontainers chạy Redis **một node**, nên không bắt được lỗi CROSSSLOT của cluster mode: thêm một smoke test trên STG (cluster mode thật) gọi cả hai script.

> Senior tip: test AC5 bằng cách "xử lý 2 lần liên tiếp" mới chỉ là một nửa. Nửa còn lại là **"lỗi giữa chừng rồi được giao lại"**: cho DB ném exception sau bước cộng Redis và để error handler của Kafka retry. Đó là kiểu trùng lặp xảy ra thật trên production, và hiếm ai viết test cho nó.`,
      pitfalls: ['Đặt @Transactional bao cả lời gọi Redis', 'Quên bù Redis khi INSERT sổ cái lỗi', 'Chỉ test đồng thời trên Redis một node']
    },
    {
      key: 'review',
      title: 'Code review & CI',
      role: 'Bạn review PR của đồng đội, CI xanh nhưng bước perf-smoke có số lạ',
      story: `Ngày 30/10. Đồng đội mở PR-1142 cho task "API trạng thái cho banner đã dùng X%" kèm sửa job pre-warm. Pipeline (GitHub Actions: build → unit + Testcontainers → Sonar → build image → deploy STG → Gatling perf-smoke 60 giây) báo **SUCCESS**, vì perf-smoke chỉ mang tính tham khảo, không chặn merge.`,
      artifacts: [
        { name: 'PR-1142.diff', lang: 'java', content: `PR-1142  Voucher status API cho banner "đã dùng X%"  (+182 -9)

--- a/src/main/resources/application.yml
+spring:
+  cache:
+    type: redis

--- a/src/main/java/com/shop/promo/status/VoucherStatusService.java
+    @Cacheable(cacheNames = "voucher-status", key = "#code")
+    public VoucherStatus status(String code) {
+        Voucher v = voucherRepo.findByCode(code).orElseThrow();
+        long active = reservationRepo.countActive(v.getId());  // SELECT count(*) ... IN ('RESERVED','USED')
+        return new VoucherStatus(code, v.getQuota(), active, v.getStartAt());
+    }

--- a/src/main/java/com/shop/promo/reserve/VoucherReservationService.java
+    @CacheEvict(cacheNames = "voucher-status", key = "#code")   // để % luôn đúng
     public ReserveResult reserve(String code, long userId, String orderId, long orderAmount) {

--- a/src/main/java/com/shop/promo/ops/PrewarmJob.java
+        long active = reservationRepo.countActive(v.getId());
+        redis.opsForValue().set(remainingKey(code), String.valueOf(v.getQuota() - active));
+        redis.opsForSet().add(usersKey(code), activeUserIds(v.getId()).toArray(String[]::new));` },
        { name: 'ci-run-7310.log', lang: 'text', content: `[build]   ./gradlew build                                       BUILD SUCCESSFUL in 3m 12s
[test]    VoucherReservationIT > reserve_concurrent_neverOversells    PASSED (4.1s)
[test]    VoucherStatusServiceTest > status_afterReserve_updatesPercent PASSED
[test]    PrewarmJobTest > prewarm_setsRemainingFromDb                PASSED
[sonar]   Quality gate: PASSED (coverage on new code 84.2%)
[gatling] perf-smoke STG, 60s: 3.000 rps GET /api/v1/vouchers/FLASH1111/status + 300 rps reserve
          status   p50=6 ms   p95=640 ms   p99=1.94 s   KO=2.1%
          cache voucher-status::FLASH1111  hit ratio 77.1%
          promo-db pg_stat_statements: SELECT count(*) FROM voucher_reservation ...
                   calls=41233 / 60s   mean=31 ms
Result: SUCCESS  (perf-smoke: informational, non-blocking)` }
      ],
      task: `Viết các comment review (ghi rõ **blocker / major / nit**), giải thích bằng số liệu trong log CI. Đề xuất cách sửa cụ thể cho API trạng thái và job pre-warm. Có nên đổi perf-smoke thành bước chặn merge không?`,
      answer: `**Tóm tắt:** CI xanh nhưng PR có hai blocker: **cache stampede** do xoá cache ở mỗi lần giữ lượt (log đã cho thấy 41.233 câu {{count(*)}} trong 60 giây ở mức tải chỉ bằng 1/6 đêm sale), và **job pre-warm chạy lại giữa đêm sale có thể đặt lại bộ đếm sai**. Cộng thêm thiếu TTL ở cả cache lẫn key campaign.

### Comment review
1. **[Blocker] @CacheEvict trên reserve gây stampede.** Mỗi lần reserve (300 rps trên STG, 2.400 RPS đêm sale) xoá cache; giữa lúc xoá và lúc nạp lại, mọi request status đều miss và cùng chạy {{count(*)}}. Số liệu: 3.000 rps × (1 - 0,771) ≈ 687 câu/giây = 41.233 câu/60 s, mean 31 ms, p99 status 1,94 s. Đêm sale status chịu khoảng 18.000 RPS → ước tính hơn 4.000 câu {{count(*)}}/giây vào promo-db, đúng lúc DB đang ghi sổ cái. Thêm nữa: {{@CacheEvict}} mặc định chạy sau khi method trả về bình thường, nên cả các lần bị từ chối {{SOLD_OUT}} (trả về object, không ném exception) cũng xoá cache.
2. **[Blocker] Pre-warm không an toàn khi chạy lại.** {{set}} ghi đè vô điều kiện. Chạy lại lúc 00:05 thì {{quota - active}} tính từ DB **chưa gồm** các lượt Redis đã trừ nhưng INSERT chưa commit; nặng hơn, nếu ai đó chạy nhầm bản cũ chỉ {{set quota}} thì mở lại 50.000 lượt. Job phải từ chối chạy sau {{start_at}} (trừ khi có cờ {{--force}} kèm bật kill switch), và dùng {{SET ... NX}}.
3. **[Major] Thiếu TTL.** {{spring.cache.type=redis}} với cấu hình mặc định thì entry **không bao giờ hết hạn**. Key remaining/users của campaign cũng không có EXPIRE, nằm mãi trong cluster dùng chung với cart-service.
4. **[Major] Status không cần DB.** PO cho phép trễ 2 giây: mỗi pod giữ một giá trị cục bộ, làm mới **1 lần/giây** bằng GET key remaining. 40 pod = 40 lệnh GET/giây thay cho hàng nghìn câu SQL.
5. **[Nit]** SADD với mảng rỗng (chưa ai có lượt) làm Redis báo lỗi sai số tham số: kiểm tra rỗng trước khi gọi.

~~~java
@Component
class VoucherStatusCache {
    private final LoadingCache<String, VoucherStatus> cache = Caffeine.newBuilder()
        .refreshAfterWrite(Duration.ofSeconds(1))   // làm mới nền, request không phải chờ
        .expireAfterWrite(Duration.ofSeconds(10))   // Redis chết lâu thì thôi hiển thị số cũ
        .build(this::loadFromRedis);                 // 1 lần nạp/key/pod: không stampede trong pod
    VoucherStatus get(String code) { return cache.get(code); }
}
~~~
Caffeine đảm bảo mỗi key chỉ có **một** lần nạp đang chạy trong một JVM; còn {{@Cacheable(sync = true)}} cũng chỉ khoá trong một JVM, 40 pod vẫn là 40 lần nạp, nhưng như thế là chấp nhận được.

### Có nên chặn merge bằng perf-smoke?
Có, nhưng bằng **ngưỡng tương đối** để không bị flaky: chặn khi p99 tăng hơn 50% so với nhánh chính, hoặc số câu SQL trên mỗi request tăng (lấy từ pg_stat_statements). Số tuyệt đối trên STG dao động nhiều, chặn cứng sẽ khiến team tắt bước này sau một tuần.

> Senior tip: "CI xanh" chỉ chứng minh những gì có test. Khi review PR có cache, hãy luôn hỏi ba câu: **khi nào hết hạn, ai nạp lại, bao nhiêu request cùng nạp lại một lúc**. Câu thứ ba là nơi stampede trốn.`,
      pitfalls: ['Tin CI xanh mà không đọc bước non-blocking', '@CacheEvict trên đường ghi tần suất cao', 'Job vận hành không idempotent khi chạy lại']
    },
    {
      key: 'test',
      title: 'Kiểm thử tải & chức năng',
      role: 'Bạn cùng QA và SRE đọc kết quả load test trên PERF',
      story: `Ngày 05/11, PERF chạy kịch bản k6 {{flash_1111}} trên bản sha-2b77a0 (đã sửa theo review). Kịch bản gồm áp mã và đặt đơn; **kịch bản đợt huỷ 00:15 bị hoãn** vì hết thời gian chuẩn bị dữ liệu. Không oversell, nhưng cart-service, team không liên quan, kêu API giỏ hàng chậm đúng lúc chạy test.`,
      artifacts: [
        { name: 'k6-flash_1111.txt', lang: 'text', content: `scenario flash_1111 (k6, 3 load generator, sha-2b77a0, 40 pod promotion-service)
  apply : ramping-arrival-rate 0 -> 18000 iters/s trong 10s, giữ 60s
  order : constant-arrival-rate 2400 iters/s, 90s
  1.000.000 userId giả, mỗi user bấm apply ~15 lần

     ✓ no_oversell (reserved_total <= 50000)
     ✗ apply status is 200
      ↳  93% — ✓ 1004312 / ✗ 75688

     http_req_duration{api:apply}......: avg=212ms  p(95)=890ms  p(99)=2.41s
     http_req_duration{api:order}......: avg=340ms  p(95)=1.21s  p(99)=3.02s
     http_req_duration{api:cart_get}...: avg=96ms   p(95)=610ms  p(99)=1.88s   (bình thường p99 45ms)
     http_req_failed..................: 6.82%
     reserved_total...................: 50000` },
        { name: 'redis-metrics.txt', lang: 'text', content: `CloudWatch promo-redis (cùng cửa sổ 05/11 14:02-14:04)
  node                 EngineCPUUtilization   CurrConnections   NetworkBytesOut
  promo-redis-0001-001        11%                 1210             38 MB/s
  promo-redis-0002-001        97%                 1240            412 MB/s
  promo-redis-0003-001         9%                 1195             35 MB/s

$ redis-cli -c -h promo-redis-0002-001... --tls --hotkeys   (PERF, maxmemory-policy=allkeys-lfu)
[00.00%] Hot key '"{v:FLASH1111}:remaining"' found so far with counter 255
[00.00%] Hot key '"{v:FLASH1111}:users"' found so far with counter 250
[00.00%] Hot key '"cart:1882031"' found so far with counter 12

apply handler (sha-2b77a0): GET remaining + SISMEMBER users   -> 2 lệnh Redis / request
promo-redis-0002 cũng chứa ~31% key cart:* của cart-service` }
      ],
      task: `1. Đọc artifact: nguyên nhân gốc của lỗi apply 7% và cart chậm là gì? Dẫn chứng bằng số.
2. Đề xuất cách sửa (ít nhất 2 phương án, có trade-off) và tiêu chí để coi lần chạy lại là đạt.
3. Kế hoạch test chức năng ngoài happy path cho QA (≥ 8 case), và bạn nói gì về việc kịch bản đợt huỷ bị hoãn?`,
      answer: `**Tóm tắt:** không oversell (Lua đúng), nhưng lộ **hot key**: hai key FLASH1111 nằm cùng slot (do hash tag, cố ý) nên toàn bộ ~36.000 lệnh/giây của đường apply dồn vào **một shard** (CPU 97%, 412 MB/s ra), kéo theo các key {{cart:*}} cùng shard. Sửa bằng cách cho đường apply **không chạm Redis mỗi request**, không phải bằng thêm shard.

### Đọc số liệu
- Shard 0002 CPU 97% trong khi 0001/0003 ở 9–11%: tải không phân tán được. Thêm shard **không giúp**, vì một key chỉ nằm trên một slot của một shard.
- {{--hotkeys}} xác nhận hai key FLASH1111 nóng nhất (bộ đếm LFU bão hoà 255).
- 18.000 apply/s × 2 lệnh = 36.000 lệnh/s, cộng TLS và 1.200+ connection → CPU một luồng của Redis bão hoà; p99 apply 2,41 s, 7% lỗi timeout.
- cart p99 1,88 s (bình thường 45 ms): **noisy neighbor**, vì 31% key giỏ hàng nằm trên cùng shard.
- Đường order 2.400 RPS cũng chậm (p99 3,02 s) chỉ vì xếp hàng sau apply, dù bản thân Lua rất nhẹ.

### Phương án sửa
| Phương án | Cách làm | Trade-off |
|---|---|---|
| **Snapshot cục bộ (chọn)** | Mỗi pod đọc remaining 2 lần/giây (40 pod → 80 GET/s), giữ cờ "hết lượt" cục bộ; apply trả kết quả từ snapshot, **không** SISMEMBER | Apply chỉ là gợi ý gần đúng (trễ ≤ 0,5 s); "đã dùng rồi" chỉ báo ở bước đặt đơn, nơi Lua kiểm tra chính xác. PO đã cho phép trễ 2 s |
| Đọc từ replica | Lettuce {{ReadFrom.REPLICA_PREFERRED}} cho lệnh đọc | Chỉ chia tải được 2 lần (1 replica), dữ liệu có thể cũ, vẫn là hot key |
| Chia bộ đếm thành N bucket | 10 key x 5.000, user vào bucket theo hash(userId) | Bucket này hết khi bucket kia còn → khách bị báo hết oan; per-user phải cùng bucket |
| Tách cluster riêng cho flash sale | Không ảnh hưởng cart | Chi phí, thêm cấu hình; không chữa được hot key |
| Rate limit apply theo user ở gateway | 1 req/s/user | Giảm bấm lặp (92%) nhưng không đủ một mình |

Chọn snapshot cục bộ + rate limit ở gateway; tách cluster đưa vào backlog sau 11.11.

**Tiêu chí đạt khi chạy lại:** shard nóng nhất CPU < 50%, apply p99 < 150 ms, order p99 < 800 ms, cart p99 < 80 ms trong cùng cửa sổ, reserved_total = 50.000, đối soát lệch 0. (Lần chạy lại 07/11: CPU 34%, apply p99 38 ms, order p99 410 ms, cart p99 52 ms → đạt.)

### Test chức năng cho QA
| # | Case |
|---|---|
| 1 | Lượt cuối, 2 khách cùng đặt → 1 thành công |
| 2 | Cùng user 2 thiết bị → 1 lượt |
| 3 | order-service retry cùng orderId → không trừ 2 lần |
| 4 | Đơn hết hạn 15 phút → trả lượt, user đặt lại được |
| 5 | Thanh toán thất bại → trả lượt |
| 6 | Đơn đã giao bị hoàn → không trả lượt |
| 7 | Sự kiện huỷ giao 2 lần → trả 1 lần |
| 8 | Lỗi DB **sau** bước cộng Redis trong luồng trả lượt, Kafka retry → vẫn chỉ cộng 1 |
| 9 | 23:59:59 → NOT_STARTED; 00:00:00 → mở |
| 10 | Kill switch bật → mọi reserve trả VOUCHER_PAUSED, đơn vẫn đặt được không voucher |
| 11 | Redis failover trên STG → bật kill switch, dựng lại bộ đếm từ DB, đối soát lệch 0 |

### Về kịch bản đợt huỷ bị hoãn
Ghi thành **rủi ro mở** trong báo cáo test, kèm con số: ~9.350 sự kiện trong 2 phút, chạy song song với đợt mua lại các lượt vừa được trả. Đề nghị PO và tech lead ký nhận nếu go-live mà không chạy, và lên lịch chạy trước 09/11.

> Senior tip: hash tag giải quyết tính nguyên tử nhưng **tạo ra** hot key: đó là trade-off cố ý, phải được đo. Mỗi lần thiết kế dồn dữ liệu vào một key, hãy tự hỏi "bao nhiêu request/giây chạm vào key này, và có cần chạm thật không?"`,
      pitfalls: ['Thêm shard để chữa hot key', 'Bỏ qua cảnh báo từ team khác (noisy neighbor)', 'Hoãn kịch bản test mà không ghi thành rủi ro']
    },
    {
      key: 'deploy',
      title: 'Deploy & chuẩn bị đêm sale',
      role: 'Bạn review kế hoạch go-live và trạng thái hệ thống lúc 23:35 ngày 10/11',
      story: `Bản sha-2b77a0 đã qua PERF ngày 07/11 và lên production ngày 06/11 bằng canary (flag tắt). Ngày 10/11, PO xin ngoại lệ freeze cho PR-1187: "marketing cần dashboard số lượt giữ/trả theo thời gian thực" (thêm hai cột đếm vào bảng {{voucher}}); SRE duyệt vì "chỉ là UPDATE một cột". 23:35 ngày 10/11, bạn kiểm tra lần cuối.`,
      artifacts: [
        { name: 'golive-check-2335.txt', lang: 'text', content: `$ argocd app history promotion-service-prod
ID  DATE                            REVISION
41  2026-11-06 14:02:11 +0700 +07   sha-2b77a0   (canary 10>25>50>100, flag off)
42  2026-11-10 16:20:47 +0700 +07   sha-4c1d9e   (PR-1187 marketing dashboard counters)

$ kubectl -n promotion get hpa promotion-service
NAME                REFERENCE                   TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
promotion-service   Rollout/promotion-service   cpu: 21%/60%  40        120       40         212d

$ kubectl -n promotion logs job/flash1111-prewarm
23:30:00.412 INFO  PrewarmJob : voucher=FLASH1111 quota=50000 db_active=0 start_at=2026-11-11T00:00+07:00
23:30:00.431 INFO  PrewarmJob : SET {v:FLASH1111}:remaining 50000 NX EX 259200 -> OK
23:30:00.433 INFO  PrewarmJob : users set empty, skip SADD; EXPIRE set at first SADD
23:30:01.950 INFO  PrewarmJob : warm-up 40/40 pods, 2000 req/pod on FLASH-TEST -> OK

flags: promo.flash1111.enabled=true (kill switch)   promo.flash.apply-snapshot=true
       PR-1187 không có flag riêng
k6 flash_1111 cuối cùng: 07/11 trên sha-2b77a0. Kịch bản đợt huỷ 00:15: CHƯA CHẠY` }
      ],
      task: `1. Viết kế hoạch đêm go-live: mốc thời gian từ T-3 ngày đến T+1 giờ, ai làm gì, các chỉ số theo dõi và **tiêu chí bật kill switch** bằng số.
2. Đọc artifact lúc 23:35: có gì khiến bạn lo? Bạn đề xuất gì với PO, và nếu PO vẫn giữ nguyên thì giảm rủi ro thế nào?`,
      answer: `**Tóm tắt:** hạ tầng đã sẵn sàng (40 pod trước, Redis pre-warm có NX + TTL, kill switch), nhưng **bản đang chạy (sha-4c1d9e) không phải bản đã load test** (sha-2b77a0), PR-1187 thêm UPDATE vào **một dòng chung** ngay trên luồng trả lượt, không có flag, và đúng luồng mà kịch bản đợt huỷ chưa từng chạy. Đề xuất: quay về sha-2b77a0 trước 00:00; nếu PO giữ, phải có biện pháp giảm rủi ro cụ thể.

### Kế hoạch đêm go-live
| Mốc | Việc | Người |
|---|---|---|
| T-3 ngày | Code freeze; bản cuối qua PERF; runbook kill switch + dựng lại bộ đếm đã tập trên STG | Squad + SRE |
| T-1 ngày | Canary xong, flag tắt; dashboard: lượt còn, lệch đối soát, CPU từng shard, consumer lag {{order-events}} | SRE |
| 23:00 | Nâng HPA minReplicas 6 → 40 **bằng commit GitOps** (sửa tay bằng kubectl sẽ bị Argo CD self-heal trả lại); kiểm tra node đủ trước | SRE |
| 23:30 | Job pre-warm (NX, EX 3 ngày), warm-up JIT bằng voucher FLASH-TEST | Bạn |
| 23:50 | War room: PO, on-call dev, SRE, CS; xác nhận người có quyền bật kill switch | Tất cả |
| 00:00 | Voucher tự mở theo {{start_at}} (không ai phải bấm gì) | — |
| 00:15–00:20 | Theo dõi riêng đợt huỷ: consumer lag, lỗi listener, lệch đối soát | Bạn |
| T+1 giờ | Báo cáo nhanh; giữ minReplicas đến 02:00 | SRE |

### Tiêu chí bật kill switch
| Chỉ số | Ngưỡng |
|---|---|
| Lệch đối soát (expected - Redis) | khác 0 ở 2 lần chạy liên tiếp, hoặc lệch > 20 một lần |
| CPU shard Redis nóng nhất | > 85% trong 2 phút |
| p99 tạo đơn (order-service) | > 1,5 s trong 3 phút |
| Lỗi listener trả lượt | > 1% hoặc lag > 5.000 |
Kill switch chỉ dừng voucher, khách vẫn đặt được đơn không voucher: dừng một tính năng tốt hơn sập luồng đặt hàng.

### Điều đáng lo lúc 23:35
1. **sha-4c1d9e ≠ sha-2b77a0.** Mọi kết luận của k6 ngày 07/11 không còn áp dụng nguyên vẹn.
2. **PR-1187 thêm hot row.** Phân tích ban đầu đã đo: UPDATE một dòng chịu ~900 TPS và xếp hàng khi tranh chấp. Đợt huỷ 00:15 có ~9.350 sự kiện theo đợt, 24 consumer song song, cộng với đặt đơn mua lại lượt vừa trả: tất cả cùng UPDATE dòng {{voucher}} id 9001.
3. **Không có flag** để tắt riêng phần đếm; muốn bỏ phải rollback image giữa đêm sale.
4. **Kịch bản đợt huỷ chưa chạy**, đúng luồng PR-1187 sửa.

### Đề xuất với PO
- Phương án A (khuyến nghị): rollback về sha-2b77a0 ngay bây giờ (Argo Rollouts, ~6 phút, đã có trong history), dashboard marketing lấy số từ sổ cái mỗi 10 giây bằng truy vấn đọc, không ghi thêm.
- Phương án B (PO giữ): đọc lại code PR-1187 ngay (UPDATE nằm ở đâu, có trong cùng transaction với bước cộng Redis không), chuẩn bị sẵn lệnh rollback, thêm alert lỗi listener và lag, chạy đối soát mỗi 1 phút trong 00:10–00:30 thay vì 5 phút. Ghi quyết định và người chấp nhận rủi ro vào ticket.

> Senior tip: "chỉ là UPDATE một cột" là câu nguy hiểm nhất trước đêm sale. Câu đúng phải là: **dòng nào, bao nhiêu lần mỗi giây, nằm trong transaction nào, và đã được load test chưa**. Freeze tồn tại để bảo vệ thứ đã được kiểm chứng, không phải để cấm thay đổi.`,
      pitfalls: ['Sửa HPA bằng kubectl khi đang dùng Argo CD self-heal', 'Go-live bằng bản khác bản đã load test', 'Ngoại lệ freeze không có flag tắt riêng']
    },
    {
      key: 'bugfix',
      title: 'Sự cố production & fix bug',
      role: 'Bạn là on-call dev trong war room đêm 11.11',
      story: `PO chọn phương án B: giữ sha-4c1d9e. 00:00:41, FLASH1111 hết lượt lần đầu, mọi chỉ số xanh. **00:20:30**, alert {{voucher_counter_mismatch}} kêu. Lượt đã hết lần hai lúc 00:18:12. Marketing hỏi trong war room: "vậy rốt cuộc mình đã phát bao nhiêu mã?".`,
      artifacts: [
        { name: 'promotion-service-0015.log', lang: 'text', content: `2026-11-11T00:15:01.204+07:00 INFO  [promotion-service-5f8b7-k2m9q] [rel-3] VoucherReleaseListener : release orderId=O-261111-0004417 user=55120873 voucher=FLASH1111 offset=order-events-7@1834562
2026-11-11T00:15:01.207+07:00 DEBUG [promotion-service-5f8b7-k2m9q] [rel-3] VoucherRedis : release.lua user=55120873 remaining=1
2026-11-11T00:15:02.209+07:00 WARN  [promotion-service-5f8b7-k2m9q] [rel-3] SqlExceptionHelper : SQL Error: 0, SQLState: 55P03
2026-11-11T00:15:02.209+07:00 ERROR [promotion-service-5f8b7-k2m9q] [rel-3] SqlExceptionHelper : ERROR: canceling statement due to lock timeout
  Where: while updating tuple (0,7) in relation "voucher"
2026-11-11T00:15:02.211+07:00 ERROR [promotion-service-5f8b7-k2m9q] [rel-3] VoucherReleaseListener : release failed offset=order-events-7@1834562 org.springframework.dao.PessimisticLockingFailureException
2026-11-11T00:15:02.214+07:00 INFO  [promotion-service-5f8b7-k2m9q] [rel-3] VoucherReleaseListener : release orderId=O-261111-0004417 user=55120873 voucher=FLASH1111 offset=order-events-7@1834562
2026-11-11T00:15:02.216+07:00 DEBUG [promotion-service-5f8b7-k2m9q] [rel-3] VoucherRedis : release.lua user=55120873 remaining=2
2026-11-11T00:15:02.231+07:00 INFO  [promotion-service-5f8b7-k2m9q] [rel-3] VoucherReleaseListener : released orderId=O-261111-0004417
...
2026-11-11T00:17:40.902+07:00 INFO  [promotion-service-5f8b7-x8t2c] [rel-11] metrics : listener errors 00:15:00-00:17:40 = 1284 (PessimisticLockingFailureException), records retried = 1071
2026-11-11T00:20:00.012+07:00 INFO  [reconcile-1] VoucherReconcileJob : voucher=FLASH1111 quota=50000 redis_remaining=0 db_reserved=8114 db_used=43170 expected_remaining=-1284 diff=1284
2026-11-11T00:20:00.013+07:00 WARN  [reconcile-1] VoucherReconcileJob : ALERT voucher_counter_mismatch diff=1284 threshold=20` },
        { name: 'VoucherReleaseListener.java (git blame)', lang: 'java', content: `PR-1093 (28/10) @KafkaListener(topics = "order-events", groupId = "promotion-release", concurrency = "12")
PR-1093 (28/10) @Transactional
PR-1093 (28/10) public void onOrderEvent(OrderEvent e) {
PR-1093 (28/10)     if (!e.type().releasesVoucher()) return;
PR-1093 (28/10)     int n = reservationRepo.markReleased(e.orderId());       // CAS: WHERE status = 'RESERVED'
PR-1093 (28/10)     if (n == 1) {
PR-1093 (28/10)         voucherRedis.release(e.voucherCode(), e.userId());   // release.lua: SREM + INCR
PR-1187 (10/11)         voucherRepo.incrementReleased(e.voucherId());        // UPDATE voucher SET released_count = released_count + 1 WHERE id = ?
PR-1093 (28/10)     }
PR-1093 (28/10) }

application.yml:  spring.datasource.hikari.connection-init-sql: SET lock_timeout = '1s'
Kafka: DefaultErrorHandler mặc định (FixedBackOff interval 0, tối đa 9 lần retry)
promo-db 00:15-00:17: CommitLatency p99 38 ms (bình thường 3 ms)` },
        { name: 'ledger-0021.sql', lang: 'sql', content: `promo=> SELECT status, count(*) FROM voucher_reservation WHERE voucher_id = 9001 GROUP BY status;
  status  | count
----------+-------
 RELEASED |  9655
 RESERVED |  8114
 USED     | 43170
(3 rows)
-- RESERVED + USED = 51284  >  quota 50000  -> đã phát vượt 1284 lượt` }
      ],
      task: `1. Nguyên nhân gốc là gì? Dẫn chứng bằng dòng log cụ thể, và chỉ ra quyết định / giả định nào ở các giai đoạn trước đã dẫn tới đây.
2. Việc làm **ngay trong 15 phút** (an toàn, có kiểm soát), kể cả câu trả lời cho marketing.
3. Sửa dài hạn và các mục cho postmortem.`,
      answer: `**Tóm tắt:** luồng trả lượt gọi Redis (INCR) **bên trong** transaction DB. PR-1187 thêm một UPDATE vào dòng {{voucher}} chung ngay sau đó; đợt huỷ 00:15 làm dòng này tranh chấp, lock timeout 1 s → transaction rollback (CAS trên sổ cái bị hoàn tác) nhưng **INCR trên Redis thì không**. Kafka error handler retry → CAS lại thành công → INCR lần nữa. 1.284 lần cộng thừa đã bị mua lại hết: phát **51.284** lượt, vượt 1.284 lượt (tối đa 128,4 triệu ngoài ngân sách).

### Dẫn chứng
- Offset {{order-events-7@1834562}}: release.lua chạy lúc 00:15:01.207 (remaining=1), lock timeout trên {{relation "voucher"}} lúc 00:15:02.209, retry 00:15:02.216 chạy release.lua **lần hai** (remaining=2) cho **cùng** user và orderId.
- 00:17:40: 1.284 lỗi {{PessimisticLockingFailureException}} trên 1.071 record (có record retry nhiều lần), khớp chính xác diff=1284 của đối soát.
- Sổ cái: RESERVED 8.114 + USED 43.170 = 51.284; {{expected_remaining = -1284}}: bộ đếm "âm" theo nghĩa kế toán.
- CommitLatency p99 tăng từ 3 ms lên 38 ms: mỗi transaction giữ khoá dòng 9001 lâu hơn, vài chục transaction xếp hàng là quá 1 s.

### Chuỗi quyết định dẫn tới sự cố
1. Phân tích: "luồng trả lượt tải nhẹ, không cần load test" → kịch bản đợt huỷ bị hoãn (giai đoạn test) và không bao giờ chạy.
2. Thiết kế yêu cầu gọi release.lua **sau commit**; PR-1093 đặt trong {{@Transactional}}. Test AC5 chỉ thử "xử lý 2 lần", không thử "lỗi sau INCR rồi retry". Lỗi tiềm ẩn từ 28/10.
3. PR-1187 thêm hot row đúng sau INCR: thành **trigger**. Được duyệt ngoại lệ freeze, không flag, không load test.

### Trong 15 phút
1. **Chặn cộng thừa thêm:** mọi lần trả lượt tới đây vẫn INCR. Chạy {{DECRBY}} key remaining đi 1.284 (một lệnh nguyên tử, không SET đè giá trị đang thay đổi) → remaining = -1.284. reserve.lua dùng {{r <= 0}} nên từ chối; 1.284 lần trả lượt tiếp theo chỉ "trả nợ" về 0. Chạy đối soát ngay để xác nhận lệch về 0.
2. **Gỡ trigger:** rollback về sha-2b77a0 (Argo Rollouts, image cũ đã có trên node); không cần đổi schema vì PR-1187 chỉ thêm cột.
3. **Marketing / tài chính:** đã phát 51.284 lượt, trong đó 43.170 đã thanh toán; thiệt hại tối đa 128,4 triệu nếu cả 1.284 lượt thừa đều thanh toán. Đề xuất **giữ nguyên đơn của khách** (huỷ voucher sau khi khách đã đặt gây khiếu nại và rủi ro pháp lý); PO và tài chính quyết, ghi vào ticket sự cố.

### Sửa dài hạn
- Đưa release.lua ra **sau commit** ({{TransactionSynchronization.afterCommit}} hoặc tách method), và làm **chính lệnh Redis idempotent**: release.lua đặt một key đánh dấu theo orderId với {{SET NX EX}} (cùng hash tag) trước khi INCR; trùng thì bỏ qua.
- Bỏ hot row: số liệu dashboard tính từ sổ cái theo lô mỗi 10 s.
- Error handler: backoff có tăng dần, không retry vô hạn, đẩy sang DLT; alert khi lỗi listener > 0,1%.
- Đối soát mỗi 1 phút trong campaign; khi lệch dương thì tự {{DECRBY}} bằng đúng số lệch (hướng an toàn), lệch âm chỉ cảnh báo.
- Test: kịch bản đợt huỷ 9.350 sự kiện + lỗi DB chèn vào sau bước Redis; load test bắt buộc chạy lại cho mọi ngoại lệ freeze.

### Postmortem (không đổ lỗi)
Timeline theo phút (00:15 → 00:20:30 alert → 00:31 ổn định), impact bằng tiền, lỗi tiềm ẩn + trigger, điều làm tốt (đối soát bắt được trong 5 phút, sổ cái giúp đếm chính xác), action item có người phụ trách và hạn.

> Senior tip: phân biệt rõ **lỗi tiềm ẩn** (Redis trong transaction, có từ 28/10) và **trigger** (hot row ngày 10/11). Nếu postmortem chỉ sửa trigger ("bỏ cột đếm") thì lỗi tiềm ẩn chờ lần lock timeout tiếp theo. Interviewer đánh giá Senior ở chỗ bạn tìm được tầng thứ hai này.`,
      pitfalls: ['SET đè bộ đếm bằng tay khi hệ thống vẫn đang ghi', 'Chỉ sửa trigger mà bỏ qua lỗi tiềm ẩn', 'Huỷ voucher của khách đã đặt đơn']
    }
  ],
  interview: {
    story: `### Kể lại theo STAR (khoảng 2 phút)
- **Situation:** sàn thương mại điện tử 8 triệu người dùng, đêm 11.11 có 1,2 triệu người online lúc 00:00; flash voucher 50.000 lượt (ngân sách 5 tỷ). Năm trước hệ thống cũ phát vượt 3.100 lượt vì đếm trên một dòng PostgreSQL.
- **Task:** tôi chịu trách nhiệm kỹ thuật cho luồng giữ và trả lượt: không phát vượt, chịu 18.000 RPS áp mã và 2.400 RPS đặt đơn.
- **Action:** làm rõ vòng đời một lượt (RESERVED / USED / RELEASED) trước khi ước lượng; chọn Redis Lua nguyên tử + sổ cái PostgreSQL có unique index; tìm và sửa hot key ở load test (cache cục bộ trong pod, CPU shard từ 97% xuống 34%); pre-warm có NX + TTL, kill switch, đối soát mỗi 5 phút.
- **Result:** 50.000 lượt hết trong 41 giây, p99 đặt đơn 410 ms, không sập. Có một sự cố: luồng trả lượt cộng thừa 1.284 lượt (2,6%) do Redis nằm trong transaction + retry Kafka; đối soát phát hiện sau 5 phút, xử lý trong 11 phút bằng DECRBY và rollback, thiệt hại tối đa 128 triệu. Sau đó team đưa "side effect sau commit + idempotent" vào checklist review.
- **Bài học:** luồng "tải nhẹ" vẫn phải load test nếu nó có side effect với tiền; và mọi ngoại lệ freeze phải chạy lại load test.`,
    questions: [
      { q: 'Vì sao chọn Redis Lua mà không dùng PostgreSQL cho bộ đếm lượt?', a: `Vì nút thắt là **khoá trên một dòng**, không phải CPU. Chúng tôi đo trên PERF: UPDATE có điều kiện trên một dòng chỉ đạt ~900–1.100 TPS, p99 2,3 s khi 400 phiên tranh nhau, trong khi đặt đơn đỉnh 2.400 RPS. Redis thực thi Lua nguyên tử trên một luồng, kiểm tra user + kiểm tra lượt + trừ trong một bước, benchmark 71.000 lần/giây. Nhưng Redis replication bất đồng bộ nên tôi không coi nó là nguồn sự thật: mỗi lượt thành công là một dòng trong sổ cái PostgreSQL có unique index, đối soát mỗi 5 phút và dựng lại được bộ đếm sau failover. Nếu không muốn thêm Redis, phương án PostgreSQL thuần tốt nhất là sinh sẵn 50.000 dòng và lấy bằng FOR UPDATE SKIP LOCKED.` },
      { q: 'Hot key là gì và bạn đã xử lý thế nào?', a: `Hot key là một key nhận phần lớn traffic; trong Redis cluster nó nằm trên đúng một slot của một shard nên thêm shard không giúp. Chúng tôi cố ý đặt hai key FLASH1111 cùng hash tag để Lua nguyên tử được, và load test cho thấy cái giá: shard đó CPU 97%, 412 MB/s ra, p99 áp mã 2,4 s, kéo theo cả giỏ hàng của team khác cùng shard. Cách sửa là để đường áp mã (18.000 RPS, 92% bấm lặp) **không chạm Redis mỗi request**: mỗi pod đọc bộ đếm 2 lần/giây và giữ cờ hết lượt cục bộ, chỉ đường đặt đơn mới chạy Lua. Sau sửa CPU shard 34%, p99 áp mã 38 ms. Các phương án khác như đọc replica hay chia bucket tôi đã cân nhắc nhưng có trade-off về độ chính xác.` },
      { q: 'Kể về sự cố cộng thừa lượt: nguyên nhân gốc và bạn học được gì?', a: `Listener trả lượt chạy CAS trên sổ cái rồi gọi Redis INCR, tất cả trong một @Transactional. Một PR ngoại lệ freeze thêm UPDATE vào một dòng chung ngay sau INCR. Đợt huỷ 00:15 làm dòng đó tranh chấp, lock timeout 1 s, transaction rollback nhưng INCR đã xảy ra; DefaultErrorHandler của Spring Kafka retry, CAS lại thành công, INCR lần nữa. Kết quả 1.284 lượt thừa. Bài học kỹ thuật: side effect ngoài DB phải chạy sau commit và **tự nó** phải idempotent (key đánh dấu theo orderId với SET NX). Bài học quy trình: phân biệt lỗi tiềm ẩn và trigger, và luồng có side effect với tiền phải được load test dù tải nhỏ.` },
      { q: 'Khi phát hiện lệch 1.284 lượt lúc nửa đêm, vì sao bạn dùng DECRBY mà không SET lại bộ đếm?', a: `Vì hệ thống vẫn đang chạy: listener vẫn trả lượt và đặt đơn vẫn giữ lượt trong lúc tôi thao tác. SET một giá trị tính từ DB là đọc-rồi-ghi, giữa hai bước đó có thể có hàng chục thay đổi bị ghi đè. DECRBY 1284 là một lệnh nguyên tử, chỉ dịch bộ đếm đúng bằng số lệch đã xác định, không đè lên thay đổi khác. Bộ đếm thành -1.284, và vì reserve.lua kiểm tra r <= 0 (không phải == 0) nên mọi lần giữ lượt bị từ chối cho đến khi 1.284 lần trả lượt tiếp theo đưa nó về 0. Sau đó tôi chạy đối soát ngay để xác nhận lệch bằng 0.` },
      { q: 'Làm sao đảm bảo idempotent khi order-service gọi lại hoặc Kafka giao trùng?', a: `Có ba lớp. Một: orderId là UNIQUE trong sổ cái, nên order-service retry cùng orderId thì Lua trả "user đã có lượt", service tra sổ cái theo orderId và trả lại đúng kết quả lần đầu. Hai: unique index một phần trên (voucher_id, user_id) với status RESERVED/USED chặn trường hợp Redis sai. Ba: trả lượt đi qua CAS {{WHERE status = 'RESERVED'}}, giao trùng thì 0 dòng đổi và không cộng. Sau sự cố tôi thêm lớp thứ tư: chính release.lua đánh dấu orderId bằng SET NX trước khi INCR, vì CAS trên DB không bảo vệ được side effect nằm ngoài DB khi transaction rollback.` }
    ]
  },
  tags: ['ecommerce', 'redis', 'lua', 'kafka', 'idempotency', 'hot-key', 'incident']
},
{
  id: 'sdlc-003',
  title: 'Nâng cấp service Java 8 trên VM lên Java 21 + Spring Boot 3 trên Kubernetes',
  level: 'senior',
  domain: 'Bảo hiểm',
  context: `Bạn là **Senior Java Developer** trong team Policy Platform của một công ty bảo hiểm nhân thọ (1,8 triệu hợp đồng đang hiệu lực, 2.300 nhân viên, kênh đại lý dùng app tính phí mỗi ngày).
Team gồm: 1 EM, 4 dev backend, 1 QA, dùng chung 2 DevOps với các team khác. Release mỗi 2 tuần, có CAB (change advisory board) duyệt thay đổi production.

Hệ thống liên quan:
- {{policy-service}} (team bạn sở hữu): tra cứu hợp đồng, tính phí, cập nhật thông tin; ~220 RPS giờ cao điểm. Hiện chạy **Java 8u202 (Oracle JDK) + Spring Boot 2.3.12** dưới dạng fat jar trên **4 VM RHEL 7.9** (8 vCPU, 16 GB), sau F5 load balancer; deploy bằng Jenkins job chạy script ssh.
- Batch **in thư tái tục**: ngày 25 hằng tháng, crontab trên một VM gọi endpoint nội bộ, sinh PDF bằng JasperReports cho các hợp đồng sắp đến hạn rồi đẩy sang đơn vị in qua SFTP trước 07:00.
- {{core-policy}}: hệ thống lõi cũ, gọi qua SOAP (Apache CXF). PostgreSQL 14 on-prem dùng chung.
- Đích đến: cụm Kubernetes on-prem của công ty (RKE2, Kubernetes 1.29) cùng datacenter, GitLab CI, Ingress NGINX.

> Đi lần lượt từng giai đoạn. Ở mỗi giai đoạn: đọc tình huống + artifact, tự làm phần "Việc của bạn" (viết ra, càng cụ thể càng tốt), rồi mới mở đáp án mẫu hoặc nhờ AI chấm.`,
  stages: [
    {
      key: 'requirement',
      title: 'Nhận requirement',
      role: 'EM giao epic nâng cấp, bạn làm rõ phạm vi và tiêu chí thành công',
      story: `Ngày 05/10/2026, EM chuyển cho bạn một epic do Head of Engineering tạo. Không có tính năng mới nào, nên PO nghiệp vụ hỏi thẳng: "nâng cấp xong khách hàng được gì, và có làm chậm roadmap quý 1 không?". Bạn được giao làm technical owner, phải chốt phạm vi và tiêu chí nghiệm thu trong tuần.`,
      artifacts: [
        { name: 'PLAT-318.txt', lang: 'text', content: `PLAT-318  [Epic]  Nâng cấp policy-service: Java 21 + Spring Boot 3 + Kubernetes
Reporter: Head of Engineering        Due: 31/03/2027 (hạn khắc phục audit)
Labels: security, tech-debt, audit-2026

Bối cảnh:
  - Audit ISO 27001 (09/2026), finding #7: "Phần mềm hết hỗ trợ trong hệ thống xử lý
    dữ liệu khách hàng" -> policy-service (Java 8u202, Spring Boot 2.3.12)
  - Pentest Q3: 9 lỗ hổng CRITICAL trong thư viện (đính kèm trivy-jar.txt)
  - Báo giá gia hạn Oracle Java SE (tính theo tổng số nhân viên): 7,8 tỷ VND/năm
  - 4 VM RHEL 7.9 (đã hết maintenance từ 30/06/2024), CPU trung bình 9%

Yêu cầu:
  - Lên Java 21, Spring Boot 3, chạy trên cụm Kubernetes của công ty
  - CI/CD tự động thay cho Jenkins job + script ssh
  - Không ảnh hưởng nghiệp vụ

Acceptance criteria: (chưa có)` },
        { name: 'trivy-jar.txt', lang: 'text', content: `policy-service-3.14.2.jar (jar)
Total: 61 (LOW: 6, MEDIUM: 21, HIGH: 25, CRITICAL: 9)

Library                                       Vulnerability    Severity  Installed  Fixed Version
log4j:log4j (qua acme-audit-common 1.4)       CVE-2019-17571   CRITICAL  1.2.17     (không có, EOL)
org.springframework:spring-beans              CVE-2022-22965   CRITICAL  5.2.15     5.2.20, 5.3.18
org.yaml:snakeyaml                            CVE-2022-1471    HIGH      1.26       2.0
com.fasterxml.jackson.core:jackson-databind   CVE-2020-36518   HIGH      2.11.4     2.12.6.1, 2.13.2.1
org.apache.tomcat.embed:tomcat-embed-core     CVE-2023-46589   HIGH      9.0.46     9.0.83
... 56 dòng khác` }
      ],
      task: `1. Liệt kê **ít nhất 8 câu hỏi làm rõ** (phạm vi, hạ tầng ẩn trên VM, tích hợp, vận hành, rủi ro nghiệp vụ).
2. Viết **tiêu chí thành công đo được** cho epic (bảo mật, hiệu năng, vận hành) và những gì **không** nằm trong phạm vi.
3. Trả lời PO: lợi ích của việc nâng cấp với nghiệp vụ là gì, bằng ngôn ngữ của PO.`,
      answer: `**Tóm tắt:** nâng cấp runtime là dự án "không có tính năng", nên rủi ro lớn nhất là **những thứ VM đang làm ngầm** (timezone, truststore, font, crontab, IP whitelist) mà không ai ghi lại. Requirement tốt phải chốt phạm vi hẹp ("hành vi giữ nguyên"), tiêu chí đo được và đường lui.

### Câu hỏi làm rõ
| Nhóm | Câu hỏi | Vì sao quan trọng |
|---|---|---|
| Phạm vi | Chỉ nâng runtime + framework, hay được sửa luôn nợ kỹ thuật (đổi API, đổi schema)? | Trộn refactor vào migration thì không còn so sánh "trước/sau" được |
| Phạm vi | Có freeze tính năng trên policy-service trong lúc nâng cấp không? | Hai nhánh song song kéo dài là ác mộng merge |
| Hạ tầng ẩn | VM đang có cấu hình gì ngoài jar: timezone, truststore, font, crontab, file local, proxy? | Container không có sẵn những thứ này |
| Batch | Batch in thư tái tục chạy ở đâu, khối lượng tháng cao nhất bao nhiêu, hạn chót mấy giờ? | Batch thường bị quên khi chuyển lên Kubernetes |
| Tích hợp | Đối tác nào whitelist **IP của VM**? core-policy dùng TLS phiên bản nào? | IP đi ra từ cụm K8s khác; Java mới tắt TLS cũ |
| Hiệu năng | Baseline hiện tại (p95, p99, throughput) đo ở đâu? SLO mong muốn? | Không có baseline thì không chứng minh được "không chậm hơn" |
| Downtime | Có được phép downtime khi cutover không? Cửa sổ nào? | Quyết định blue-green hay big bang |
| Rollback | Giữ VM cũ bao lâu sau cutover? Ai được quyết định quay lại? | Đường lui phải có thật, không chỉ trên giấy |
| Bảo mật | Ngưỡng chấp nhận: 0 CRITICAL/HIGH có bản vá? Ngoại lệ ai duyệt? | Tiêu chí "xong" của audit |
| Vận hành | Ai trực khi service chạy trên K8s: team dev hay team hạ tầng? Log, metric ở đâu? | Thay đổi quy trình on-call |

### Tiêu chí thành công (đề xuất)
- **Bảo mật:** image production 0 lỗ hổng CRITICAL/HIGH có bản vá (Trivy chặn trong CI); có SBOM CycloneDX cho mỗi bản build.
- **Hành vi:** 100% bộ test hồi quy pass; so sánh response của 10.000 request thật (ghi lại, phát lại) giống bản cũ, khác biệt phải được giải thích.
- **Hiệu năng:** p95 không tệ hơn baseline quá 10%, không có GC pause > 200 ms.
- **Vận hành:** deploy bằng pipeline, không ssh; rollback về VM trong ≤ 5 phút; batch tháng chạy xong trước 07:00.
- **Chi phí:** không gia hạn license Oracle JDK (dùng bản OpenJDK miễn phí có hỗ trợ cập nhật, ví dụ Eclipse Temurin).

**Ngoài phạm vi:** đổi API cho client, đổi schema DB, tách microservice, thay JasperReports.

### Trả lời PO
"Không có màn hình mới, nhưng có ba thứ nghiệp vụ nhận được: **gỡ được finding audit** trước hạn 31/03 (nếu không, rủi ro bị đánh giá không đạt ISO 27001), **tránh 7,8 tỷ/năm** tiền license, và **deploy nhanh hơn** (từ 2 giờ thao tác tay xuống khoảng 15 phút qua pipeline), nên tính năng quý 1 lên production sớm hơn. Cái giá là khoảng 2 sprint của 2 dev; roadmap quý 1 lùi 2 tuần."

### Pitfall thực tế
- Ước lượng theo số dòng code thay vì theo số "phụ thuộc ngầm" của VM.
- Nhận tiêu chí "không ảnh hưởng nghiệp vụ" mà không định nghĩa đo bằng gì.

> Senior tip: trước khi viết dòng code nào, hãy ssh vào VM và **chụp lại toàn bộ môi trường**: lệnh chạy java đầy đủ, crontab, biến môi trường, file cấu hình ngoài jar, font, truststore, timezone. Mỗi dòng trong danh sách đó là một task migration; thiếu dòng nào là một sự cố sau cutover.`,
      pitfalls: ['Không kiểm kê cấu hình ngầm trên VM', 'Trộn refactor tính năng vào migration', 'Không có baseline hiệu năng trước khi nâng cấp']
    },
    {
      key: 'analysis',
      title: 'Phân tích & lộ trình',
      role: 'Bạn kiểm kê dependency, đánh giá rủi ro, chọn lộ trình',
      story: `Bạn ssh vào VM {{pol-app-01}}, chạy {{jdeps}} và {{mvn dependency:tree}}, gom kết quả. Một dev đề xuất: "làm một phát Java 8 lên 21 và Boot 2.3 lên 3.3 luôn cho nhanh, đằng nào cũng phải sửa hết". EM cần lộ trình và ước lượng trong 2 ngày.`,
      artifacts: [
        { name: 'vm-inventory.txt', lang: 'text', content: `pol-app-01 (RHEL 7.9, 8 vCPU, 16 GB)
$ ps -o args= -C java
/opt/jdk1.8.0_202/bin/java -Xms12g -Xmx12g -Duser.timezone=Asia/Ho_Chi_Minh
  -Djavax.net.ssl.trustStore=/etc/pki/acme/partners.jks -jar /opt/policy/policy-service.jar
$ crontab -l
0 1 25 * * curl -s -X POST http://localhost:8080/internal/batch/renewal-letters
$ ls /usr/share/fonts/msttcore/
arial.ttf  arialbd.ttf  times.ttf  timesbd.ttf
$ grep -h "Full GC" gc-2026-10-14.log | tail -2      (thứ Tư 14/10, 08:00-18:00, ParallelGC)
[Full GC (Ergonomics) ... ParOldGen: 1118M->1081M(8192M)] ... 1.87 secs
[Full GC (Ergonomics) ... ParOldGen: 1124M->1079M(8192M)] ... 1.91 secs
GC log trước 07/10 đã bị logrotate xoá (giữ 7 ngày) -> không có số liệu đêm batch 25/09` },
        { name: 'deps-and-jdeps.txt', lang: 'text', content: `Dependency đáng chú ý (mvn dependency:tree)
  spring-boot 2.3.12 / spring-cloud Hoxton.SR12 (Netflix Hystrix, OpenFeign)
  springfox-swagger2 2.9.2           -> không hỗ trợ Spring Boot 3
  ehcache 2.10                       -> Boot 3 bỏ hỗ trợ Ehcache 2
  cxf-spring-boot-starter-jaxws 3.4  -> javax.xml.ws, cần CXF 4.x (jakarta)
  hibernate-core 5.4 (+ hibernate-types-52 cho jsonb)
  lombok 1.18.12                     -> không chạy với JDK 21
  powermock 2.0.7 (124 test)         -> không chạy ổn định trên JDK 17+
  acme-audit-common 1.4 (nội bộ)     -> kéo log4j 1.2.17
  pom.xml <properties>: jackson.version=2.11.4, snakeyaml.version=1.26 (ghi đè version của Boot)

import javax.* trong src/main: persistence 96 file, validation 61, xml.bind 22,
                               servlet 18, annotation 17, crypto 4, net.ssl 3

$ jdeps --jdk-internals target/policy-service.jar
policy-service.jar -> JDK removed internal API
   com.acme.policy.util.LegacyCrypto -> sun.misc.BASE64Encoder  JDK internal API (JDK removed internal API)
JDK Internal API                 Suggested Replacement
sun.misc.BASE64Encoder           Use java.util.Base64 @since 1.8` }
      ],
      task: `1. Phân loại các vấn đề trong inventory theo: **chặn biên dịch / chặn chạy / đổi hành vi âm thầm / hạ tầng**.
2. Chọn lộ trình: nâng một lần hay từng bước? Vẽ các bước, mỗi bước deploy được và rollback được.
3. Từ số liệu VM, ước lượng bộ nhớ cho container. Bạn còn thiếu số liệu gì?`,
      answer: `**Tóm tắt:** đi **từng bước, mỗi bước lên production được**: (A) Boot 2.7 + Java 17 trên VM, vẫn javax; (B) Boot 3.3 + Java 21 + jakarta, đóng container, chuyển lên K8s bằng blue-green. Heap 12 GB là lãng phí (live set ~1,1 GB ngày thường), nhưng **chưa có số liệu đêm batch** nên kích thước container mới là giả định, phải đo lại.

### Phân loại
| Loại | Mục | Cách xử lý |
|---|---|---|
| Chặn biên dịch | {{sun.misc.BASE64Encoder}}, Lombok 1.18.12, springfox, Ehcache 2, CXF 3.4 (javax.xml.ws), {{WebSecurityConfigurerAdapter}} (bị bỏ ở Security 6) | Thay thư viện / API tương đương |
| Chặn chạy | PowerMock trên JDK 17+ (strong encapsulation), version Jackson/SnakeYAML bị ghi đè trong pom | Bỏ PowerMock, xoá property ghi đè để Boot quản lý version |
| Đổi hành vi âm thầm | Spring 6 bỏ khớp dấu / cuối URL; Hibernate 6 đổi cách đặt tên sequence mặc định; Java mới tắt TLS 1.0/1.1; timezone | Test hồi quy + so sánh response |
| Hạ tầng | {{-Duser.timezone}}, truststore {{/etc/pki}}, font MS core cho PDF, crontab batch, heap cố định 12 GB | Đưa vào Dockerfile, Secret, Helm, CronJob |

Lưu ý: không phải mọi {{javax}} đều đổi sang {{jakarta}}. {{javax.crypto}} và {{javax.net.ssl}} là một phần của JDK, **giữ nguyên**; chỉ các API Jakarta EE (persistence, validation, servlet, xml.bind, annotation…) mới đổi namespace.

### Lộ trình
1. **Bước 0 (3 ngày):** lưới an toàn: bổ sung test hồi quy cho API chính, ghi lại 10.000 request thật để phát lại, đo baseline hiệu năng trên môi trường perf.
2. **Bước A (1 sprint):** Boot 2.3 → 2.7, chạy trên Java 17 **trên VM**; bỏ PowerMock, thay {{sun.misc}}, nâng Lombok, gỡ log4j 1.x (yêu cầu team nội bộ ra acme-audit-common 2.0). Lên production, đã xử lý phần lớn CVE.
3. **Bước B (1–2 sprint):** Boot 3.3 + Java 21: jakarta bằng OpenRewrite, Security 6, Hibernate 6, CXF 4, springdoc, Caffeine thay Ehcache, Resilience4j thay Hystrix. Đóng container, lên K8s bằng **blue-green** với VM, giữ VM 2 tuần để quay lại.

Vì sao không làm một lần: khi lỗi xảy ra sẽ không biết do Java, do Boot, do Hibernate hay do container. Bước A cũng tự nó **gỡ được rủi ro** (CVE, Java 8 hết hỗ trợ) ngay cả khi bước B bị trễ. Bước B gộp "code" và "nền tảng" vì RHEL 7 đã hết hỗ trợ, cài Java 21 lên VM cũ là đầu tư bỏ đi; bù lại bằng blue-green có đường lui về VM.

### Ước lượng bộ nhớ
- Old gen sau Full GC: ~1,08 GB → **live set ~1,1 GB**. Heap 12 GB làm Full GC của ParallelGC mất ~1,9 s.
- Đề xuất ban đầu: heap ~1,5 GB, container 2 GiB (phần còn lại cho metaspace, thread stack, code cache, GC, buffer).
- **Thiếu số liệu:** GC log chỉ có ngày thường; log đêm batch 25/09 đã bị xoá. Batch sinh PDF (JasperReports, font, AWT) dùng nhiều **native memory** hơn API. Phải đo đêm 25/10 trên VM (bật GC log và theo dõi RSS) **trước khi** chốt kích thước cho batch.

> Senior tip: khi đề xuất "đi từng bước", hãy cho EM thấy mỗi bước **tự nó có giá trị** nếu dự án dừng giữa chừng. Lộ trình mà chỉ có giá trị khi xong 100% sẽ bị cắt ngân sách ở 70%.`,
      pitfalls: ['Đổi cả javax.crypto / javax.net.ssl sang jakarta', 'Định cỡ container từ GC log ngày thường', 'Nâng một lần nhiều thành phần rồi không biết lỗi do đâu']
    },
    {
      key: 'design',
      title: 'Thiết kế: container, probes, resource, pipeline',
      role: 'Bạn review Dockerfile và manifest đầu tiên của đồng đội',
      story: `Bước A đã lên production ngày 03/11 (Boot 2.7.18, Java 17, vẫn chạy VM). Đêm batch 25/10 không đo được vì người được giao nghỉ phép, việc này được ghi "làm sau". Đồng đội viết bản đầu tiên của Dockerfile và manifest cho bước B; bạn review trước khi DevOps dựng Helm chart và pipeline.`,
      artifacts: [
        { name: 'Dockerfile (draft)', lang: 'text', content: `FROM openjdk:21
COPY target/policy-service.jar /app.jar
ENV TZ=UTC
EXPOSE 8080
ENTRYPOINT java -Xms12g -Xmx12g -jar /app.jar` },
        { name: 'deployment.yaml (draft)', lang: 'yaml', content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: policy-service
spec:
  replicas: 4
  template:
    spec:
      containers:
        - name: app
          image: registry.acme.local/policy/policy-service:latest
          resources:
            limits: { memory: 2Gi }
          livenessProbe:
            httpGet: { path: /actuator/health, port: 8080 }
            initialDelaySeconds: 10
            timeoutSeconds: 1
          # readinessProbe: TODO
# batch tái tục: TODO (trên VM đang là crontab)` }
      ],
      task: `1. Liệt kê các vấn đề trong Dockerfile và manifest (ít nhất 8), giải thích hậu quả cụ thể khi chạy.
2. Viết Dockerfile và phần manifest đã sửa: JVM flags, probes, resources, graceful shutdown, timezone, truststore, font, batch.
3. Phác thảo pipeline GitLab CI từ commit tới production.`,
      answer: `**Tóm tắt:** bản nháp "bê nguyên VM vào container": heap 12 GB trong giới hạn 2 GiB, java không phải PID 1, liveness kiểm tra cả DB, không readiness, mất timezone/truststore/font/batch. Bản sửa: image JRE nhỏ chạy non-root, **heap theo phần trăm giới hạn container**, startup/liveness/readiness tách biệt, cấu hình môi trường đưa vào manifest, batch thành CronJob có kích thước riêng.

### Vấn đề trong bản nháp
1. **{{-Xmx12g}} trong container 2 GiB:** heap lớn dần tới vượt giới hạn → kernel kill (OOMKilled, exit 137), không có {{OutOfMemoryError}}, không heap dump.
2. **ENTRYPOINT dạng shell:** {{/bin/sh -c}} là PID 1, java là tiến trình con → SIGTERM khi rolling update không tới java, không graceful shutdown, request đang chạy bị cắt sau 30 s.
3. **Liveness gọi /actuator/health:** gồm cả kiểm tra DB; DB chậm 10 giây → **mọi pod cùng bị restart**, biến sự cố DB thành sự cố toàn service.
4. **initialDelaySeconds 10, timeout 1 s:** app khởi động ~45 s → bị kill trước khi lên → CrashLoopBackOff.
5. **Không readiness:** pod nhận traffic khi Hibernate, cache chưa sẵn sàng.
6. **openjdk:21:** image này đã ngừng cập nhật, dùng JDK đầy đủ, chạy root.
7. **TZ=UTC** trong khi VM chạy {{-Duser.timezone=Asia/Ho_Chi_Minh}}: code gọi {{LocalDate.now()}} cho ngày hiệu lực hợp đồng sẽ lệch ngày trong khoảng 00:00–07:00.
8. **Thiếu truststore đối tác, font MS core** (PDF lỗi font), **batch crontab** biến mất, tag {{latest}} không truy vết được.

### Dockerfile đã sửa
~~~text
FROM eclipse-temurin:21-jre-jammy AS layers
WORKDIR /app
COPY target/policy-service.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract   # tách layer: dependency ít đổi, cache tốt

FROM eclipse-temurin:21-jre-jammy
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=layers /app/dependencies/ ./
COPY --from=layers /app/spring-boot-loader/ ./
COPY --from=layers /app/snapshot-dependencies/ ./
COPY --from=layers /app/application/ ./
USER 10001
ENV TZ=Asia/Ho_Chi_Minh
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+ExitOnOutOfMemoryError", "org.springframework.boot.loader.launch.JarLauncher"]
~~~
(Boot 3.3 đã có {{-Djarmode=tools}} thay cho layertools; layertools vẫn chạy nhưng bị đánh dấu deprecated.)

### Manifest (phần chính)
~~~yaml
resources:
  requests: { cpu: "1", memory: 2Gi }    # memory request = limit: không bị evict trước
  limits:   { cpu: "2", memory: 2Gi }    # JVM thấy 2 CPU -> số GC thread hợp lý
startupProbe:                            # cho phép khởi động tối đa 120 s
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 24
livenessProbe:                           # chỉ "JVM còn sống", KHÔNG kiểm tra DB
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
readinessProbe:                          # có thể gồm DB: chỉ ngừng nhận traffic, không restart
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
lifecycle:
  preStop: { exec: { command: ["sleep", "10"] } }   # chờ Ingress gỡ endpoint
terminationGracePeriodSeconds: 45                   # kèm server.shutdown=graceful
~~~
- Spring Boot tự bật nhóm health {{liveness}}/{{readiness}} khi phát hiện chạy trên Kubernetes.
- Truststore đối tác: Secret mount vào {{/etc/acme/truststore}}, đường dẫn qua biến môi trường. Font: đóng gói dạng **JasperReports font extension** trong jar, không phụ thuộc OS.
- Code: thay {{LocalDate.now()}} bằng {{Clock}} inject với {{ZoneId.of("Asia/Ho_Chi_Minh")}}; {{TZ}} chỉ là lưới an toàn.
- **Batch:** CronJob riêng, {{timeZone: Asia/Ho_Chi_Minh}} (GA từ Kubernetes 1.27), {{concurrencyPolicy: Forbid}}. Batch sinh PDF dùng nhiều native memory hơn API, nên **resource và heap của batch phải được đo riêng**, không dùng lại con số 2 GiB của API.
- Heap 75% của 2 GiB = 1,5 GiB, còn ~512 MiB cho metaspace, thread, code cache, GC, direct buffer. Đây là điểm xuất phát; xác nhận bằng NMT khi test tải.

### Pipeline
build + unit test → test tích hợp (Testcontainers) → SBOM (CycloneDX) → build image, tag theo commit SHA → **Trivy chặn CRITICAL/HIGH có bản vá** → deploy SIT bằng Helm → test hồi quy + phát lại request → UAT → production (duyệt tay sau CAB).

> Senior tip: con số {{MaxRAMPercentage=75}} trên blog là cho app "bình thường". App có thư viện native (font, AWT, nén, Netty) cần nhiều khoảng trống hơn. Đừng chọn phần trăm theo thói quen; đo bằng {{-XX:NativeMemoryTracking=summary}} với **đúng workload nặng nhất**.`,
      pitfalls: ['Mang -Xmx của VM vào container', 'Liveness probe kiểm tra DB', 'ENTRYPOINT dạng shell làm mất SIGTERM', 'Dùng chung kích thước API cho batch']
    },
    {
      key: 'dev',
      title: 'Phát triển: migration bằng OpenRewrite',
      role: 'Bạn chạy OpenRewrite và xử lý các lỗi biên dịch còn lại',
      story: `Bạn tạo nhánh {{upgrade/boot3}} từ bản Boot 2.7 đang chạy production và chạy recipe OpenRewrite nâng lên Spring Boot 3.3 (gồm Java 17+, javax → jakarta, đổi tên property). Recipe sửa 287 file trong 4 phút. Sau đó {{mvn compile}} vẫn còn lỗi.`,
      artifacts: [
        { name: 'rewrite-run.txt', lang: 'bash', content: `$ mvn -U org.openrewrite.maven:rewrite-maven-plugin:run \\
    -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \\
    -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_3
[WARNING] Changes have been made to src/main/java/com/acme/policy/web/PolicyController.java by:
[WARNING]     org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_3
[WARNING]         org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta
... (287 file)
[WARNING] Please review and commit the results.

$ mvn -q compile
[ERROR] SecurityConfig.java:[19,41] cannot find symbol
  symbol: class WebSecurityConfigurerAdapter
[ERROR] SwaggerConfig.java:[6,39] package springfox.documentation.swagger2.annotations does not exist
[ERROR] PolicyEntity.java:[38,1] cannot find symbol
  symbol: class TypeDef
[ERROR] CoreSoapClient.java:[4,24] package jakarta.xml.ws does not exist
[ERROR] CacheConfig.java:[3,34] package net.sf.ehcache does not exist` }
      ],
      task: `1. Với từng lỗi biên dịch, nêu nguyên nhân và cách sửa; viết code cho {{SecurityConfig}} và cho cột jsonb trong {{PolicyEntity}}.
2. Liệt kê những thay đổi **OpenRewrite không làm thay bạn** hoặc **biên dịch được nhưng đổi hành vi**, và cách bạn phát hiện chúng.
3. Bạn chia commit / merge request thế nào để review được?`,
      answer: `**Tóm tắt:** OpenRewrite làm tốt phần cơ học (đổi import, đổi tên property, nâng version được quản lý), nhưng **không thay được thư viện bên thứ ba không có bản jakarta**, không viết lại cấu hình Security theo kiểu mới trong mọi trường hợp, và hoàn toàn không biết những thay đổi **hành vi** lúc chạy. Phần đó là việc của bạn và của bộ test hồi quy.

### Lỗi biên dịch và cách sửa
| Lỗi | Nguyên nhân | Sửa |
|---|---|---|
| {{WebSecurityConfigurerAdapter}} | Đã bị xoá trong Spring Security 6 | Khai báo bean {{SecurityFilterChain}} |
| springfox | Không hỗ trợ Boot 3 | {{springdoc-openapi-starter-webmvc-ui}} 2.x, đổi annotation sang {{io.swagger.v3}} |
| {{@TypeDef}} | Hibernate 6 bỏ cơ chế TypeDef | {{@JdbcTypeCode(SqlTypes.JSON)}}, bỏ thư viện hibernate-types-52 |
| {{jakarta.xml.ws}} | Recipe đổi import, nhưng pom vẫn CXF 3.4 (javax) | Nâng {{cxf-spring-boot-starter-jaxws}} lên 4.x, sinh lại stub từ WSDL |
| {{net.sf.ehcache}} | Boot 3 bỏ Ehcache 2 | Caffeine qua {{spring.cache.caffeine.spec}} |

~~~java
@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())                 // API stateless, token đi trong header
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/internal/**").hasRole("BATCH")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().denyAll())                  // mặc định từ chối, tránh lộ endpoint mới
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .build();
    }
}

@Entity
class PolicyEntity {
    @JdbcTypeCode(SqlTypes.JSON)                          // Hibernate 6: map jsonb không cần thư viện ngoài
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> riders;
}
~~~
Chú ý {{antMatchers}} cũ đã đổi thành {{requestMatchers}}; so lại **từng quy tắc** với bản cũ, đừng tin recipe: sai một dòng là lộ endpoint {{/internal}}.

### Thay đổi OpenRewrite không bắt được
- **Version bị ghi đè trong pom:** {{jackson.version=2.11.4}}, {{snakeyaml.version=1.26}} vẫn nằm trong properties → Boot 3 chạy với thư viện cũ, lỗi lúc chạy hoặc giữ nguyên CVE. Xoá hết property ghi đè, để BOM quản lý.
- **Dấu / cuối URL:** Spring 6 mặc định không còn coi {{/policies/123/}} giống {{/policies/123}} → 404 cho client cũ. Phát hiện bằng phát lại request thật.
- **Sequence Hibernate 6:** {{@GeneratedValue}} không chỉ định generator sẽ tìm sequence theo tên mới. Dùng {{hibernate.id.db_structure_naming_strategy=legacy}} trong lúc chuyển, kiểm tra bằng {{ddl-auto=validate}} trên bản sao schema production.
- **TLS:** JDK mới tắt TLS 1.0/1.1; đối tác cũ sẽ lỗi handshake (chỉ lộ ra khi test tích hợp thật).
- **Property đổi tên** mà recipe bỏ sót: thêm {{spring-boot-properties-migrator}} tạm thời, nó in cảnh báo lúc khởi động; xoá trước khi lên production.

### Chia merge request
1. MR "chỉ OpenRewrite" (cơ học, 287 file, review bằng cách đọc recipe + chạy lại thấy giống).
2. MR cho từng thay thế thư viện (Security, springdoc, Hibernate types, CXF 4, Caffeine, Resilience4j), mỗi cái có test riêng.
3. MR hạ tầng (Dockerfile, Helm, CI).
Reviewer đọc được từng MR trong 30 phút, thay vì một MR 6.000 dòng không ai đọc thật.

> Senior tip: chạy OpenRewrite ở **commit riêng, không sửa tay gì thêm**. Khi cần chạy lại với recipe mới hơn, bạn chỉ việc bỏ commit đó và chạy lại, thay vì gỡ rối giữa thay đổi máy và thay đổi người.`,
      pitfalls: ['Gộp thay đổi của OpenRewrite với sửa tay trong một commit', 'Để lại property ghi đè version trong pom', 'Tin rằng biên dịch được là chạy đúng']
    },
    {
      key: 'review',
      title: 'Code review & CI',
      role: 'Bạn review MR của đồng đội, pipeline mới báo đỏ',
      story: `Pipeline GitLab CI mới đã chạy (build → test → SBOM → image → Trivy → deploy SIT → hồi quy). Đồng đội đẩy thêm một commit "fix test cho xanh" vào MR !412 và nhờ bạn approve để kịp cắt bản UAT thứ Sáu.`,
      artifacts: [
        { name: 'MR-412-last-commit.diff', lang: 'java', content: `commit 7e1f0c2  "fix test cho xanh"

--- a/src/test/java/com/acme/policy/api/PolicyApiRegressionIT.java
     @Test
     void getPolicy_withTrailingSlash() {
-        assertThat(get("/api/v1/policies/P123456/").statusCode()).isEqualTo(200);
+        assertThat(get("/api/v1/policies/P123456/").statusCode()).isEqualTo(404);
     }

--- a/src/test/java/com/acme/policy/doc/RenewalLetterIT.java
+    @Disabled("font không có trong container, xử lý sau")
     @Test
     void renewalLetter_rendersVietnameseName() {

--- a/pom.xml
     <properties>
         <java.version>21</java.version>
         <jackson.version>2.11.4</jackson.version>` },
        { name: 'pipeline-88231.log', lang: 'text', content: `[test]       Tests run: 812, Failures: 0, Errors: 0, Skipped: 1
[sbom]       cyclonedx-maven-plugin: target/bom.json (214 components)
[image]      registry.acme.local/policy/policy-service:7e1f0c2
[trivy]      policy-service:7e1f0c2 (ubuntu 22.04)  Total: 0 (HIGH: 0, CRITICAL: 0)
             Java (jar)  Total: 3 (HIGH: 3, CRITICAL: 0)
             com.fasterxml.jackson.core:jackson-databind  CVE-2020-36518  HIGH  2.11.4  2.12.6.1, 2.13.2.1
             ...
[trivy]      exit code 1 (--severity HIGH,CRITICAL --ignore-unfixed --exit-code 1)
[regression] SKIPPED (stage trước lỗi)
Pipeline #88231: FAILED` },
        { name: 'access-log-sample.txt', lang: 'text', content: `F5 access log VM 7 ngày (01-07/12), đường dẫn có dấu / cuối:
  GET /api/v1/policies/{id}/          41.882 request   user-agent: AgentApp/4.2.1 (Android)
  GET /api/v1/policies/{id}/premium/   3.115 request   user-agent: partner-bancassurance/2.0
Phiên bản AgentApp hiện tại trên store: 4.6.0 (4.2.1 chiếm ~12% thiết bị đại lý)` }
      ],
      task: `Viết comment review cho commit "fix test cho xanh" (ghi rõ **blocker / major / nit**), giải thích vì sao Trivy đỏ, và đề xuất cách làm pipeline xanh **mà không hạ chuẩn**. Nêu thêm 2 kiểm tra bạn muốn có trong pipeline cho dự án nâng cấp này.`,
      answer: `**Tóm tắt:** commit này làm test xanh bằng cách **sửa kỳ vọng cho khớp với lỗi**: đổi 200 thành 404 sẽ làm hỏng 41.882 request/tuần của app đại lý bản cũ và 3.115 request của đối tác bancassurance; tắt test font thì PDF thư tái tục sẽ lỗi trên production. Trivy đỏ là đúng: property ghi đè làm Boot 3 vẫn dùng Jackson 2.11.4. Không approve.

### Comment review
1. **[Blocker] Đổi kỳ vọng 200 → 404.** Test hồi quy tồn tại để bảo vệ **hành vi client đang dùng**. Access log cho thấy AgentApp 4.2.1 (~12% thiết bị đại lý) và partner-bancassurance gọi có dấu / cuối. Spring 6 không còn khớp dấu / cuối mặc định. Cách sửa, theo thứ tự ưu tiên:
   - Ngắn hạn: bật lại khớp dấu / cuối có chủ đích ({{PathMatchConfigurer.setUseTrailingSlashMatch(true)}}, đã deprecated trong Spring 6 nhưng vẫn chạy), kèm log/metric đếm request có dấu / cuối theo user-agent.
   - Dài hạn: báo đối tác và team mobile sửa client, đặt hạn; Spring 6.2 có {{UrlHandlerFilter}} để xử lý gọn ở tầng filter khi nâng tiếp.
   Giữ nguyên test với kỳ vọng 200.
2. **[Blocker] @Disabled test font.** Đây chính là test bảo vệ batch in thư tái tục. Container không có font MS core như VM, nên tên khách hàng tiếng Việt sẽ lỗi font hoặc ném {{JRFontNotFoundException}}. Sửa đúng: đóng gói font thành JasperReports font extension trong jar (kiểm tra license font), bật lại test.
3. **[Blocker] jackson.version=2.11.4 trong pom.** Ghi đè version do Spring Boot 3.3 quản lý (dòng 2.17), giữ lại CVE-2020-36518 và có thể gây {{NoSuchMethodError}} lúc chạy vì các module Jackson lệch version nhau. Xoá property, để BOM quản lý; kiểm tra luôn {{snakeyaml.version}}.
4. **[Major] Quy trình:** commit "fix test cho xanh" ngay trước hạn cắt bản là dấu hiệu áp lực tiến độ. Báo EM: UAT lùi 1–2 ngày rẻ hơn nhiều so với lỗi in 41.000 thư.
5. **[Nit]** Tên commit nên nói thay đổi hành vi gì, không nói "cho xanh".

### Làm pipeline xanh đúng cách
- Xoá property ghi đè → Trivy hết HIGH ở jar. Image Ubuntu 22.04 đã 0 HIGH/CRITICAL.
- Cờ {{--ignore-unfixed}} là hợp lý (không chặn lỗ hổng chưa có bản vá), nhưng mọi lỗ hổng chưa vá phải có ticket theo dõi. Ngoại lệ ({{.trivyignore}}) chỉ khi được security duyệt, có ngày hết hạn.
- Không thêm {{allow_failure: true}} cho stage Trivy hay hồi quy.

### Hai kiểm tra nên thêm
- **Phát lại request + so sánh response** (10.000 request thật đã ghi ở bước 0) giữa bản VM và bản mới trên SIT; khác status code hoặc khác body (bỏ qua timestamp) thì chặn. Bắt được dấu / cuối, định dạng ngày, thứ tự field JSON.
- **Kiểm tra dependency hội tụ:** {{maven-enforcer-plugin}} với rule {{dependencyConvergence}} và cấm {{log4j:log4j}}, {{javax.*}} của Jakarta EE trong classpath (bannedDependencies).

> Senior tip: khi thấy test hồi quy bị sửa kỳ vọng trong một dự án migration, câu hỏi đầu tiên luôn là "**client nào đang dựa vào hành vi cũ?**". Access log trả lời câu đó trong 5 phút; một buổi họp không trả lời được.`,
      pitfalls: ['Sửa kỳ vọng test cho khớp với lỗi', '@Disabled test vì môi trường thiếu font', 'Đặt allow_failure cho stage bảo mật']
    }
    ,
    {
      key: 'test',
      title: 'Kiểm thử: hiệu năng trước/sau, GC, tích hợp',
      role: 'Bạn cùng QA đọc kết quả perf và SIT, quyết định có lên UAT được không',
      story: `Ngày 08/12, môi trường perf chạy cùng kịch bản Gatling {{agent_peak}} trên bản VM (Java 17 sau bước A) và bản K8s (bước B, 4 pod). SIT báo lỗi khi gọi core-policy. QA hỏi thêm về batch: UAT chỉ có 500 hợp đồng đến hạn, chạy thử 500 thư mất 3 phút và thành công.`,
      artifacts: [
        { name: 'perf-compare.txt', lang: 'text', content: `Gatling agent_peak: 220 RPS (quote 60%, get policy 30%, update 10%), 30 phút

                          VM (bước A)              K8s (bước B)
  runtime                 Java 17, ParallelGC      Java 21, G1
  heap                    -Xmx12g                  MaxRAMPercentage=75 (1.5 GiB)
  instance                4 VM x 8 vCPU            4 pod x 2 CPU (limit)
  p50 / p95 / p99         39 / 176 / 590 ms        33 / 121 / 240 ms
  GC pause max            1.84 s (Full GC)         41 ms
  CPU                     9% của 32 vCPU           41% của 8 CPU
  memory (working set)    -                        1.71 GiB / 2 GiB (85%)
  khởi động               48 s                     29 s

GC log pod policy-service-6d9c7-2kq8r:
[2026-12-08T10:14:22.118+0700][info][gc] GC(1841) Pause Young (Normal) (G1 Evacuation Pause) 1102M->298M(1536M) 12.417ms
[2026-12-08T10:14:31.902+0700][info][gc] GC(1842) Pause Young (Normal) (G1 Evacuation Pause) 1110M->301M(1536M) 11.877ms` },
        { name: 'sit-core-policy.log', lang: 'text', content: `2026-12-08T09:02:11.418+07:00 ERROR [policy-service-6d9c7-2kq8r] CoreSoapClient : getPolicyHistory failed
jakarta.xml.ws.WebServiceException: Could not send Message.
  ...
Caused by: javax.net.ssl.SSLHandshakeException: No appropriate protocol (protocol is disabled or cipher suites are inappropriate)
(core-policy SIT/PROD: IBM WebSphere 8.5, chỉ bật TLSv1; trên VM Java 8u202 gọi được)` }
      ],
      task: `1. Đọc bảng so sánh: bản mới tốt hơn hay tệ hơn, nhờ đâu? Có gì khiến bạn **chưa yên tâm**?
2. Xử lý lỗi TLS với core-policy thế nào (ngắn hạn và dài hạn)? Ai phải đồng ý?
3. QA nói "batch chạy 500 thư OK". Bạn có đồng ý cho lên UAT/production với kết quả đó không? Cần thêm gì?`,
      answer: `**Tóm tắt:** API nhanh hơn rõ rệt (p99 590 → 240 ms) chủ yếu nhờ **G1 với heap nhỏ** thay cho Full GC 1,8 s của ParallelGC trên heap 12 GB. Nhưng bộ nhớ container đã ở **85% giới hạn** chỉ với tải API, còn batch PDF (nặng native memory hơn) mới được thử 500 thư. Lỗi TLS là lỗi môi trường đã đoán trước: JDK mới tắt TLS 1.0.

### Đọc kết quả hiệu năng
- **Vì sao nhanh hơn:** VM dùng ParallelGC (mặc định Java 8): Young GC nhanh nhưng thỉnh thoảng Full GC dừng toàn bộ ~1,8 s trên heap 12 GB → p99 590 ms. Pod dùng G1 (mặc định Java 9+ khi có từ 2 CPU và 1792 MB trở lên), heap 1,5 GiB, Young GC ~12 ms, chưa thấy Full GC → p99 240 ms.
- Log GC: mỗi lần dọn 1.102M → 298M, tức **live set ~300 MB** dưới tải API; heap 1,5 GiB dư cho API.
- **CPU 41% của 8 CPU** so với 9% của 32 vCPU: tổng CPU dùng gần tương đương (~3,3 vs ~2,9 core), nhưng giờ chỉ đặt 8 CPU thay vì 32 → tiết kiệm phần lớn tài nguyên.
- **Điều chưa yên tâm:** working set 1,71 GiB / 2 GiB trong khi heap đang dùng chưa tới 1,1 GiB. Phần ngoài heap (~600 MB) là native: metaspace, thread stack, code cache, cấu trúc GC, buffer. Chỉ còn 15% khoảng trống, và đây là workload **nhẹ hơn** batch.

Kiểm chứng bằng NMT trên pod perf:
~~~bash
# bật trong JAVA_TOOL_OPTIONS của pod perf: -XX:NativeMemoryTracking=summary
kubectl -n policy-perf exec policy-service-6d9c7-2kq8r -- jcmd 1 VM.native_memory summary
kubectl -n policy-perf exec policy-service-6d9c7-2kq8r -- grep VmRSS /proc/1/status
~~~
Nếu RSS lớn hơn tổng "committed" của NMT nhiều, phần chênh lệch là bộ nhớ do **thư viện native tự malloc** (NMT không theo dõi được), điển hình là font/AWT của JasperReports.

### Lỗi TLS với core-policy
- Nguyên nhân: Java 8u202 còn bật TLS 1.0; từ 8u291/11.0.11 trở đi TLS 1.0/1.1 nằm trong {{jdk.tls.disabledAlgorithms}}. Đây là **thay đổi tốt**, core-policy mới là phía lỗi thời.
- **Dài hạn (đúng):** team core-policy bật TLS 1.2 trên WebSphere 8.5 (có hỗ trợ). Mở ticket ngay, vì phụ thuộc team khác.
- **Ngắn hạn (có kiểm soát):** file {{java.security}} override chỉ dùng cho pod này, mount từ ConfigMap, nạp bằng {{-Djava.security.properties}}, bỏ TLSv1 khỏi danh sách cấm; kết nối chỉ trong mạng nội bộ. Bắt buộc **security duyệt bằng văn bản, có ngày hết hạn**, và ghi vào risk register của audit, vì đây chính là loại finding audit đang yêu cầu đóng.

### Batch: không đủ để go-live
500 thư trong 3 phút chứng minh **đúng chức năng**, không chứng minh **bộ nhớ**. Tháng cao điểm có trên 40.000 thư; native memory của JasperReports (cache font, glyph, buffer ảnh) và phân mảnh malloc tăng theo thời gian chạy, không theo số lượng một lần. Yêu cầu:
1. Sinh dữ liệu giả 41.000 hợp đồng đến hạn trên perf, chạy batch **đủ khối lượng** trong đúng cấu hình CronJob, bật NMT, theo dõi RSS suốt quá trình.
2. Nếu không kịp trước go-live: ghi **rủi ro mở** có người chấp nhận, và chuẩn bị phương án dự phòng cho đêm 25: chạy lại batch trên VM cũ (còn giữ 2 tuần) hoặc Job thủ công với giới hạn bộ nhớ lớn hơn.

> Senior tip: khi so sánh hiệu năng trước/sau một lần nâng cấp, hãy tách các yếu tố: Java 17 → 21, ParallelGC → G1, heap 12 GB → 1,5 GB, VM → container. Nếu chỉ báo cáo "nhanh hơn 2,5 lần", lần sau có ai đổi GC hay heap sẽ không ai biết con số đó đến từ đâu.`,
      pitfalls: ['Chỉ nhìn heap mà bỏ qua memory working set của container', 'Bật lại TLS 1.0 toàn cục cho nhanh', 'Coi test chức năng batch 500 thư là đủ']
    },
    {
      key: 'deploy',
      title: 'Deploy: blue-green từ VM sang Kubernetes',
      role: 'Bạn viết kế hoạch cutover và kiểm tra trạng thái sau cutover',
      story: `CAB duyệt cutover tối thứ Ba 12/01/2027. Blue = 4 VM (bản bước A), green = 4 pod trên K8s (bản bước B), F5 chuyển traffic. Ticket PLAT-341 "chạy batch tái tục đủ khối lượng trên perf" được dời sang sprint sau vì perf thiếu dữ liệu giả; EM ghi "chấp nhận rủi ro, VM giữ đến 26/01". 23:40, bạn kiểm tra lần cuối trước khi đóng change.`,
      artifacts: [
        { name: 'cutover-2101.txt', lang: 'text', content: `21:00  tmsh modify ltm virtual vs_policy_443 pool pool_policy_k8s     (blue -> green)
21:01  pol-app-01: comment dòng crontab renewal-letters (đã kiểm tra: crontab -l không còn lệnh)
21:30  smoke: 42/42 PASS; replay 10.000 request: 9.996 giống, 4 khác (timestamp)  -> OK
23:40  $ kubectl -n policy get deploy,cronjob,hpa
NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/policy-service   4/4     4            4           3h12m

NAME                           SCHEDULE     TIMEZONE           SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/renewal-letter   0 1 25 * *   Asia/Ho_Chi_Minh   False     0        <none>          3h12m

NAME                                                 REFERENCE                   TARGETS        MINPODS   MAXPODS   REPLICAS
horizontalpodautoscaler.autoscaling/policy-service   Deployment/policy-service   cpu: 38%/65%   4         8         4` },
        { name: 'values-prod.yaml', lang: 'yaml', content: `image:
  repository: registry.acme.local/policy/policy-service
  tag: 9b04d1e
resources:            # dùng chung cho Deployment và CronJob (templates/cronjob.yaml include .Values.resources)
  requests: { cpu: "1", memory: 2Gi }
  limits:   { cpu: "2", memory: 2Gi }
jvm:
  opts: "-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
batch:
  renewal:
    schedule: "0 1 25 * *"
    timeZone: Asia/Ho_Chi_Minh
    threads: 8          # giữ như trên VM (8 vCPU)
    backoffLimit: 1
    restartPolicy: Never` }
      ],
      task: `1. Viết kế hoạch cutover blue-green: chuẩn bị, các bước, kiểm tra sau mỗi bước, **tiêu chí rollback** bằng số, cách rollback, khi nào được tắt VM.
2. Những điểm riêng khi hai phiên bản **dùng chung database** và có **batch** là gì?
3. Đọc artifact lúc 23:40: có gì cần sửa trước đêm 25/01?`,
      answer: `**Tóm tắt:** blue-green ở đây có đường lui thật vì **schema không đổi** và VM còn chạy; cutover bằng một lệnh F5, rollback cũng bằng một lệnh. Điểm dễ sai là những thứ **không đi qua load balancer**: batch (không được chạy ở cả hai nơi) và **CronJob đang dùng chung kích thước 2 GiB, heap 75%, 8 thread của API**, đúng cái workload chưa từng được đo.

### Kế hoạch cutover
| Thời điểm | Việc | Kiểm tra |
|---|---|---|
| T-1 ngày | Green chạy song song, nhận traffic nội bộ (đại lý test) qua host riêng | Error rate, p95, log lỗi |
| 21:00 | F5 chuyển virtual server sang pool K8s | 5xx < 0,5%, p95 < 200 ms trong 15 phút |
| 21:01 | Tắt crontab batch trên VM | {{crontab -l}} không còn dòng batch |
| 21:30 | Smoke 42 case + phát lại 10.000 request | Khác biệt chỉ ở timestamp |
| T+1 ngày | Theo dõi giờ cao điểm 10:00–11:00 của đại lý | p99, GC, memory working set |
| T+14 ngày | Tắt VM nếu không có rollback, **sau** khi qua một kỳ batch ngày 25 | Batch xong trước 07:00 |

**Tiêu chí rollback:** 5xx > 1% trong 5 phút; p95 > 300 ms trong 10 phút; bất kỳ lỗi dữ liệu nào (ghi sai hợp đồng); pod restart > 3 lần/giờ. **Rollback:** đổi lại pool F5 về VM (dưới 1 phút) + bật lại crontab nếu đang gần ngày 25.

### Điểm riêng khi dùng chung DB và có batch
- **Schema:** không migration trong cutover. Hibernate 6 chạy {{ddl-auto=validate}} và sequence ở chế độ legacy, để VM và pod cùng ghi một DB được.
- **Ghi đồng thời:** trong lúc chuyển, cả hai bản cùng xử lý request; cache cục bộ (Caffeine ở bản mới, Ehcache ở bản cũ) có thể lệch tới hết TTL. Chấp nhận được với TTL 5 phút, ghi vào kế hoạch.
- **Batch chỉ được chạy ở một nơi:** VM và CronJob cùng chạy thì khách nhận 2 thư. Tắt crontab VM khi bật CronJob, ngược lại khi rollback; batch nên idempotent (đánh dấu thư đã sinh theo hợp đồng + kỳ) để chạy lại an toàn.
- **IP đi ra:** pod gọi đối tác qua NAT của cụm; IP này phải được whitelist **trước** cutover.

### Điều cần sửa trước 25/01
1. **CronJob dùng chung {{resources}} của API** (2 GiB, heap 75% = 1,5 GiB). Test perf đã thấy API ở 85% bộ nhớ, còn batch PDF nặng native hơn và **chưa từng chạy đủ khối lượng** (PLAT-341 bị dời). Tách {{batch.resources}} riêng: đề xuất tạm 4 GiB và heap cố định 1,5 GiB (dư ~2,5 GiB cho native) cho đến khi có số đo.
2. **threads: 8** chép từ VM 8 vCPU, trong khi pod giới hạn 2 CPU: 8 lần render PDF song song làm tăng cả heap lẫn native mà không nhanh hơn. Lấy theo {{Runtime.availableProcessors()}} hoặc đặt 2.
3. **backoffLimit: 1** và batch chạy từ 01:00, hạn 07:00: nếu bị kill hai lần thì Job dừng hẳn. Cần alert {{KubeJobFailed}} tới on-call và runbook chạy lại.
4. Chạy PLAT-341 **trước 25/01**, không phải "sprint sau"; nếu không kịp, runbook dự phòng phải ghi rõ: bật lại crontab trên VM (còn tới 26/01) hoặc chạy Job thủ công với bộ nhớ lớn hơn.

> Senior tip: blue-green chỉ bảo vệ những gì đi qua load balancer. Trước mỗi cutover hãy liệt kê mọi thứ **tự chạy mà không có request**: cron, consumer, scheduler, job dọn dẹp. Đó là nơi hai môi trường cùng chạy hoặc không môi trường nào chạy.`,
      pitfalls: ['Batch chạy ở cả VM và K8s sau cutover', 'Tắt VM trước khi qua một kỳ batch', 'Dùng chung resource của API cho CronJob']
    },
    {
      key: 'bugfix',
      title: 'Sự cố production & fix bug',
      role: 'Bạn là on-call, batch thư tái tục thất bại lúc rạng sáng',
      story: `Các điểm ở giai đoạn deploy được tạo ticket nhưng chưa ai làm kịp: CronJob vẫn dùng {{values-prod.yaml}} như cũ. **Thứ Hai 25/01/2027, 04:42**, alert {{KubeJobFailed}} gọi bạn dậy. Đơn vị in phải nhận đủ file qua SFTP trước **07:00**, nếu không thư tái tục giao trễ, vi phạm thời hạn thông báo cho khách hàng.`,
      artifacts: [
        { name: 'kubectl-0450.txt', lang: 'text', content: `$ kubectl -n policy get jobs,pods -l app=renewal-letter
NAME                                COMPLETIONS   DURATION   AGE
job.batch/renewal-letter-30013560   0/1           3h41m      3h50m

NAME                                READY   STATUS      RESTARTS   AGE
pod/renewal-letter-30013560-8xk2d   0/1     OOMKilled   0          3h50m
pod/renewal-letter-30013560-q7m4w   0/1     OOMKilled   0          2h2m

$ kubectl -n policy describe pod renewal-letter-30013560-8xk2d
    State:          Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Mon, 25 Jan 2027 01:00:04 +0700
      Finished:     Mon, 25 Jan 2027 02:47:31 +0700
    Limits:
      cpu:     2
      memory:  2Gi
Events:  Warning  BackoffLimitExceeded  job/renewal-letter-30013560  Job has reached the specified backoff limit` },
        { name: 'renewal-batch.log', lang: 'text', content: `01:00:09.402 INFO  [main] RenewalLetterJob : start period=2027-02 due=41200 threads=8
02:46:58.120 INFO  [renewal-4] RenewalLetterJob : progress 18200/41200 (170/min) heapUsed=1.12GiB heapCommitted=1.50GiB
   (không còn dòng nào sau 02:46:58; không có java.lang.OutOfMemoryError; không có heap dump)
02:47:44.017 INFO  [main] RenewalLetterJob : start period=2027-02 due=41200 threads=8
02:47:51.630 INFO  [main] RenewalLetterJob : skip 18200 letters already GENERATED
04:40:12.884 INFO  [renewal-2] RenewalLetterJob : progress 36100/41200 (157/min) heapUsed=1.09GiB heapCommitted=1.50GiB

Grafana pod 8xk2d (01:00-02:47):
  container_memory_working_set_bytes   1.58 GiB -> 2.00 GiB, tăng gần tuyến tính
  jvm_memory_used_bytes{area="heap"}  răng cưa 0.40 - 1.15 GiB, không tăng dần
  jvm_memory_used_bytes{area="nonheap"} 0.19 GiB ổn định` },
        { name: 'manual-job-nmt-0520.txt', lang: 'text', content: `Job thủ công renewal-letter-manual (05:02): limit 4Gi, -Xmx1536m, threads=2,
-XX:NativeMemoryTracking=summary, MALLOC_ARENA_MAX chưa đặt. Đo lúc 05:20 (đã xử lý 3.400/5.100):

$ kubectl -n policy exec renewal-letter-manual-6qz8d -- jcmd 1 VM.native_memory summary
Total: reserved=3402MB, committed=1912MB
-                 Java Heap (reserved=1536MB, committed=1536MB)
-                     Class (reserved=1050MB, committed=44MB)
-                    Thread (reserved=31MB, committed=31MB)
-                      Code (reserved=248MB, committed=58MB)
-                        GC (reserved=86MB, committed=86MB)
-                    Symbol (reserved=29MB, committed=29MB)
-                     Other (reserved=96MB, committed=96MB)
...
$ kubectl -n policy exec renewal-letter-manual-6qz8d -- grep VmRSS /proc/1/status
VmRSS:   2493112 kB` }
      ],
      task: `1. Nguyên nhân gốc là gì? Dẫn chứng bằng artifact, giải thích vì sao **không có OutOfMemoryError**, và chỉ ra quyết định / giả định nào ở các giai đoạn trước dẫn tới đây.
2. Việc làm **ngay** để đơn vị in nhận đủ file trước 07:00, an toàn (không gửi trùng thư).
3. Sửa dài hạn và các mục cho postmortem.`,
      answer: `**Tóm tắt:** container batch bị kernel kill vì **tổng bộ nhớ tiến trình** (heap 1,5 GiB đã commit hết + native) vượt giới hạn 2 GiB, không phải vì heap đầy. Heap 75% của 2 GiB chỉ chừa ~512 MiB cho native, trong khi batch PDF (8 thread JasperReports, font/AWT, malloc) cần nhiều hơn và **tăng dần theo thời gian chạy**. Cấu hình này đến từ con số đo trên tải API, chép sang CronJob qua Helm dùng chung, với batch chưa từng chạy đủ khối lượng.

### Dẫn chứng
- {{Reason: OOMKilled}}, {{Exit Code: 137}} (128 + 9, SIGKILL), {{Limits memory: 2Gi}}: kernel kill do vượt giới hạn cgroup.
- Log dừng đột ngột lúc 02:46:58, **không có {{OutOfMemoryError}}**, không heap dump: JVM không hề biết. {{-XX:+ExitOnOutOfMemoryError}} và heap dump chỉ phản ứng khi **heap** cạn; ở đây heap còn trống (dùng 1,12 / 1,50 GiB).
- Grafana: heap răng cưa ổn định 0,40–1,15 GiB (không rò heap), nhưng working set tăng tuyến tính 1,58 → 2,00 GiB → phần tăng nằm **ngoài heap**.
- Job thủ công: NMT committed 1.912 MB, RSS 2.493.112 kB ≈ 2.435 MB → khoảng **520 MB không nằm trong NMT**: bộ nhớ do thư viện native tự cấp phát (rasterizer font, AWT của JasperReports) và phân mảnh của malloc glibc. Riêng phần NMT thấy được đã là 1.912 MB, sát 2 GiB.

### Chuỗi quyết định dẫn tới sự cố
1. Phân tích: định cỡ từ GC log **ngày thường**; log đêm batch đã bị xoá, việc đo đêm 25/10 bị "làm sau".
2. Thiết kế: đã ghi "batch phải đo riêng", nhưng Helm chart cho CronJob include chung {{.Values.resources}}.
3. Test: API đã ở 85% bộ nhớ; batch chỉ thử 500 thư (3 phút), không đủ để native memory tăng.
4. Deploy: PLAT-341 dời sang sprint sau; threads 8 chép từ VM; cảnh báo ở buổi cutover chưa được làm.
Trên VM không lộ vì heap 12 GB nằm trong máy 16 GB, còn ~4 GB cho native.

### Ngay bây giờ (04:50 → 07:00)
1. **Đã làm đúng một điều:** batch idempotent, lần chạy 2 bỏ qua 18.200 thư đã sinh. Còn 41.200 − 36.100 = **5.100 thư**.
2. 05:02 chạy **Job thủ công** từ CronJob ({{kubectl create job --from=cronjob/renewal-letter ... --dry-run=client -o yaml}}, sửa limit 4Gi, {{-Xmx1536m}} cố định, threads 2, bật NMT), apply. Giữ heap như cũ để vừa chạy xong vừa đo được phần native.
3. Tốc độ ~170 thư/phút → 5.100 thư mất ~30 phút; xong 05:33. Kiểm tra mỗi hợp đồng có đúng 1 thư cho kỳ 2027-02 (truy vấn đếm theo hợp đồng + kỳ), rồi đẩy SFTP và báo đơn vị in.
4. Phương án dự phòng nếu Job thủ công cũng lỗi: bật lại crontab trên VM {{pol-app-01}} (VM còn tới 26/01), batch idempotent nên an toàn.
5. **Không** tăng bộ nhớ cho Deployment API giữa đêm: API không bị ảnh hưởng, thay đổi không cần thiết lúc 5 giờ sáng chỉ tạo thêm rủi ro.

### Sửa dài hạn
- **Tách cấu hình batch:** {{batch.resources}} riêng (4 GiB), heap cố định theo số đo thay vì phần trăm; threads = số CPU của pod.
- Đặt {{MALLOC_ARENA_MAX=2}} cho batch (glibc mặc định tạo nhiều arena theo số core **của node**, không theo giới hạn CPU của container) và đo lại; cân nhắc jemalloc nếu phân mảnh vẫn cao.
- **NMT trong perf** cho mọi workload, so với RSS; alert khi {{container_memory_working_set_bytes}} / limit > 90% trong 10 phút, cho cả Job.
- **PLAT-341 trước kỳ 25/02**: batch đủ 41.000 thư trên perf; không tắt VM cho tới khi một kỳ batch trên K8s thành công.
- Runbook "batch thất bại" và alert {{KubeJobFailed}} sớm hơn: alert khi tiến độ batch tụt sau kế hoạch (ví dụ chưa tới 50% lúc 03:30).

### Postmortem (không đổ lỗi)
Timeline (01:00 → 02:47 kill lần 1 → 04:40 kill lần 2 → 04:42 alert → 05:33 xong → 05:45 SFTP), impact (không có thư trễ, 2 giờ 50 phút batch bị gián đoạn), nguyên nhân theo 5 Whys (giới hạn bộ nhớ → kích thước chép từ API → batch chưa từng đo đủ khối lượng → ticket bị dời → không có tiêu chí "phải qua một kỳ batch" trong definition of done của migration), điều làm tốt (batch idempotent, VM còn giữ), action item có người phụ trách và hạn.

> Senior tip: khi pod bị OOMKilled mà log không có {{OutOfMemoryError}}, đừng tăng {{-Xmx}}: tăng heap trong cùng giới hạn còn làm **giảm** chỗ cho native và chết sớm hơn. Hãy so ba con số: giới hạn container, RSS của tiến trình, tổng committed của NMT. Khoảng cách giữa chúng cho biết bộ nhớ nằm ở đâu.`,
      pitfalls: ['Tăng -Xmx khi bị OOMKilled', 'Chạy lại batch không idempotent', 'Thay đổi cấu hình API giữa đêm khi nó không bị ảnh hưởng']
    }
  ],
  interview: {
    story: `### Kể lại theo STAR (khoảng 2 phút)
- **Situation:** công ty bảo hiểm 1,8 triệu hợp đồng; service tính phí và tra cứu hợp đồng chạy Java 8u202 + Spring Boot 2.3 trên 4 VM RHEL 7, có finding audit ISO 27001 về phần mềm hết hỗ trợ, 9 CVE CRITICAL, và báo giá license Oracle JDK 7,8 tỷ/năm.
- **Task:** tôi là technical owner của việc nâng lên Java 21 + Spring Boot 3, chuyển lên Kubernetes và dựng CI/CD trước hạn audit 31/03, không đổi hành vi với client.
- **Action:** kiểm kê cấu hình ngầm của VM (timezone, truststore, font, crontab); đi hai bước, mỗi bước lên production được (Boot 2.7 + Java 17 trên VM, rồi Boot 3.3 + Java 21 trên K8s); OpenRewrite cho phần cơ học, sửa tay Security 6, Hibernate 6, CXF 4; pipeline có SBOM, Trivy chặn HIGH/CRITICAL, phát lại 10.000 request thật để so sánh; cutover blue-green bằng F5, giữ VM 2 tuần.
- **Result:** xong trước hạn 7 tuần, 0 CVE CRITICAL/HIGH có bản vá, p99 từ 590 ms xuống 240 ms (G1 với heap 1,5 GiB thay ParallelGC trên heap 12 GB), tài nguyên đặt trước giảm từ 32 vCPU xuống 8 CPU, không gia hạn license. Kỳ batch đầu tiên bị OOMKilled do native memory; batch idempotent nên chạy tiếp được bằng Job thủ công, thư giao đúng hạn.
- **Bài học:** migration chưa xong cho tới khi **mọi workload** (kể cả batch tháng) chạy được một chu kỳ trên nền tảng mới; và bộ nhớ container phải được định cỡ theo workload nặng nhất, đo bằng NMT chứ không chỉ heap.`,
    questions: [
      { q: 'Vì sao bạn không nâng thẳng Java 8 + Boot 2.3 lên Java 21 + Boot 3 một lần?', a: `Vì khi có lỗi tôi cần biết lỗi do đâu. Một lần nâng gộp Java, Spring, Hibernate, Security, thư viện SOAP và cả nền tảng chạy; một test hồi quy đỏ có thể đến từ bất kỳ thứ nào. Tôi chia hai bước: Boot 2.7 + Java 17 trên VM (vẫn javax), lên production, đã gỡ phần lớn CVE và rủi ro Java 8 hết hỗ trợ; sau đó mới Boot 3.3 + Java 21 + jakarta + container. Mỗi bước tự nó có giá trị nếu dự án dừng giữa chừng. Bước hai gộp code và nền tảng vì RHEL 7 đã hết hỗ trợ, nhưng có blue-green với VM để lui lại trong một phút.` },
      { q: 'Chuyển javax sang jakarta: OpenRewrite làm được gì và không làm được gì?', a: `Nó làm tốt phần cơ học: đổi import javax.persistence, validation, servlet, xml.bind, annotation sang jakarta, đổi tên property của Boot, nâng version thư viện được Boot quản lý. Nó không làm được: thay thư viện bên thứ ba chưa có bản jakarta (springfox phải sang springdoc, Ehcache 2 sang Caffeine, CXF 3 lên 4 và sinh lại stub), viết lại cấu hình Security theo SecurityFilterChain cho mọi trường hợp, và nó không biết các thay đổi hành vi lúc chạy như dấu / cuối URL, cách đặt tên sequence của Hibernate 6, TLS 1.0 bị tắt. Cũng cần nhớ javax.crypto và javax.net.ssl là của JDK, giữ nguyên. Tôi chạy recipe ở commit riêng không sửa tay để có thể chạy lại.` },
      { q: 'Làm sao bạn chứng minh bản mới đúng và không chậm hơn bản cũ?', a: `Ba lớp. Một là 812 test hồi quy, và quy tắc không được sửa kỳ vọng test để cho xanh (chúng tôi đã chặn một commit đổi 200 thành 404 vì access log cho thấy 12% app đại lý vẫn gọi URL có dấu / cuối). Hai là ghi lại 10.000 request thật rồi phát lại trên cả bản cũ và bản mới, so status và body, chỉ chấp nhận khác biệt đã giải thích được. Ba là cùng kịch bản Gatling 220 RPS trên hai bản: p99 từ 590 xuống 240 ms. Tôi báo cáo tách nguyên nhân: phần lớn đến từ G1 với heap 1,5 GiB thay cho Full GC 1,8 giây của ParallelGC trên heap 12 GB, không phải "Java 21 nhanh hơn" chung chung.` },
      { q: 'Pod bị OOMKilled nhưng log không có OutOfMemoryError. Bạn chẩn đoán thế nào?', a: `OOMKilled với exit code 137 nghĩa là kernel kill tiến trình vì vượt giới hạn bộ nhớ cgroup; JVM không được báo trước nên không có OutOfMemoryError, không có heap dump, ExitOnOutOfMemoryError cũng không kích hoạt. Tôi so ba con số: giới hạn container, RSS của tiến trình java và tổng committed của Native Memory Tracking. Ca của chúng tôi: heap răng cưa ổn định nhưng working set tăng tuyến tính; NMT committed khoảng 1,9 GB, RSS khoảng 2,4 GB, nên có khoảng 500 MB do thư viện native tự malloc (font, AWT của JasperReports) và phân mảnh glibc. Cách sửa là tăng khoảng trống ngoài heap, giảm thread render, đặt MALLOC_ARENA_MAX; tuyệt đối không tăng Xmx trong cùng giới hạn.` },
      { q: 'Blue-green khi hai phiên bản dùng chung database và có batch: bạn chú ý những gì?', a: `Thứ nhất là schema: không chạy migration trong cutover, Hibernate 6 để validate và dùng chiến lược đặt tên sequence legacy để VM và pod cùng ghi một DB. Thứ hai là những thứ không đi qua load balancer: batch phải chạy đúng một nơi, nên tắt crontab trên VM khi bật CronJob và ngược lại khi rollback, đồng thời làm batch idempotent theo hợp đồng và kỳ để chạy lại không gửi trùng thư. Thứ ba là IP đi ra để đối tác whitelist trước. Cuối cùng, chỉ tắt môi trường cũ sau khi **mọi workload** đã chạy qua một chu kỳ, với chúng tôi là sau một kỳ batch ngày 25; nhờ giữ VM mà đêm sự cố chúng tôi có thêm một phương án dự phòng.` }
    ]
  },
  tags: ['migration', 'java21', 'spring-boot-3', 'kubernetes', 'oomkilled', 'blue-green', 'ci-cd']
}
);
