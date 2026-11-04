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
}
);
