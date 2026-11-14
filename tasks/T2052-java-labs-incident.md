# T2052 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2021

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Retry storm làm sập service phụ thuộc**: client retry 3 lần không backoff/jitter trên 3 tầng (gateway→order→payment) nhân 27 lần tải khi payment chậm; artifact: log retry, metrics RPS theo tầng, cấu hình Resilience4j sai; cách sửa: retry budget, exponential backoff + jitter, circuit breaker, idempotency key

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã hoàn tất 2 lab level senior ở cuối `js/data/labs-incident.js`, id nối tiếp số lớn nhất (032 → 033, 034):

- **lab-incident-033** — Retry storm 3 tầng gateway → order → payment: cả ba tầng retry 3 lần, chờ cố định 200 ms, không backoff/jitter, không retry budget, không circuit breaker, không idempotency key. PSP chậm 8 giây → 900 request/giây ở gateway biến thành 24.300 request/giây ở PSP (3 × 3 × 3 = 27 lần). Hikari cạn vì @Transactional bọc lời gọi PSP (định luật Little: 8.100 × 24,6 ≈ 199.260 connection cần so với 120 có), CPU 22%, gateway 504 31%. Artifact: trace JSON (3 attempt payment/order/gateway), metric RPS theo tầng + cấu hình Resilience4j, log PSP. Cách sửa: chỉ retry một tầng, exponential backoff + jitter, retry budget, circuit breaker đặt trước retry, deadline, timeout budget giảm dần, idempotency key, bulkhead, không retry 503 (tôn trọng Retry-After).
- **lab-incident-034** — Poison message Kafka: một message thiếu `orderId` ở partition 7 làm `JsonDeserializer` ném `JsonMappingException`, `ErrorHandlingDeserializer` bọc thành `DeserializationException`; `DefaultErrorHandler(new FixedBackOff(0, Long.MAX_VALUE))` retry vô hạn, không DLQ → seek lại offset 5.518.302, lag partition 7 = 298.447 sau 20 phút, 480.000 dòng log (400 dòng/giây), CPU 1,8/4 core, consumer group không rebalance, 11 partition còn lại lag 0. Artifact: hai lần `kafka-consumer-groups.sh`, log pod lặp cùng offset, metric theo partition + config. Cách sửa: finite retry + `DeadLetterPublishingRecoverer` (hoặc `@RetryableTopic` + `DltStrategy.FAIL_ON_ERROR`), `addNotRetryableExceptions(DeserializationException.class)`, producer validate/schema, idempotency key, alert lag theo từng partition.

Ghi chú về lần chạy trước: file đã có lab-033/034 từ lần chạy bị gián đoạn nhưng số liệu không nhất quán (ví dụ `inv_429` 968 > `inv_in` 611; order fail 26,3 s trong khi trace là 24,6 s; `{{kafka_consumergroup_lag{partition="7"}}}` lồng dấu ngoặc). Đã thay bằng hai lab tự nhất quán, giữ nguyên id 033/034; các lab 001–032 không đổi.

Nghiệm thu:
- `node --check js/data/labs-incident.js` → OK.
- `node scripts/validate.js labs-incident.js` → chỉ còn lỗi `index-light.js` đã cũ (file sinh tự động, cần `node scripts/build-light-index.js`); không có lỗi nào thuộc `labs-incident.js` (markup, số `{{ }}` khớp, không backtick, không ký tự lạ).
- **Bị chặn ngoài phạm vi task:** `node scripts/build-light-index.js` và `node scripts/validate.js` toàn repo không chạy được vì `js/data/q-spring-data.js` đang lỗi cú pháp (template literal của đáp án `spring-080` bị thiếu dấu backtick đóng ở cuối dòng 13391, trước `follow:`; parser báo `Unexpected identifier 'tắt'` tại dòng 13403). File này thuộc task khác (T2050), nên theo luật 3 AGENTS.md tôi không tự sửa. Khi file kia được sửa, chạy lại `node scripts/build-light-index.js` rồi `node scripts/validate.js` để xác nhận toàn repo OK.
- KHÔNG commit.

Reviewed-by: (chờ review)
