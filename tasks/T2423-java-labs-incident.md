# T2423 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2406

Đã thêm 2 lab `incident` level senior vào cuối `js/data/labs-incident.js` (id nối tiếp 043 → 044, 045):
- `lab-incident-044` — Retry storm do batch listener retry cả lô khi gặp một message lỗi format (`amount = null` → core-banking 500): lag 2.016.000 trên cả 6 partition; sửa bằng phân loại retryable/non-retryable, ExponentialBackOff + jitter, DeadLetterPublishingRecoverer, BatchListenerFailedException, producer schema validation, alert lag từng partition.
- `lab-incident-045` — Gọi webhook đối tác đồng bộ không timeout: 200/200 thread Tomcat cạn, API đặt hàng 503; sửa bằng connect/read timeout, outbox + worker bất đồng bộ, bulkhead, circuit breaker, idempotency.

Mỗi lab: 3 artifact (config/log/metric hoặc jstack), 3 câu hỏi, 3 hints, 5 rubric, `answer` ~7–9k ký tự (có `### Nguyên nhân gốc` / `### Dẫn chứng` / `### Cách sửa` / `### Phòng ngừa`).

Kiểm tra:
- `node --check js/data/labs-incident.js` → OK.
- Isolated load: `window.LABS` = 45 bài, `incident` = 45; `lab-incident-044`/`045` đủ field.
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` OK.
- `node scripts/validate.js`: **không còn lỗi ở `labs-incident.js`**. Các lỗi còn lại thuộc task khác, không sửa (đúng luật 3): `labs-sql.js` (T2422 đang dở, lỗi cú pháp `Unexpected identifier 'tắt'`) và `quiz_backup.js` (file backup chưa khai báo trong data-manifest). Khi T2422 xong và file backup được dọn, validate sẽ OK toàn cục.

## Notes

Đã hoàn thành. Không commit.

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Retry storm + poison message**: một message lỗi format làm consumer Kafka retry vô hạn, consumer lag tăng tới 2 triệu, các partition khác cũng trễ; sửa bằng phân loại lỗi retryable/non-retryable, backoff, DLQ, alert theo lag.
2. **Webhook đối tác timeout làm cạn thread pool**: service gọi webhook đồng bộ không timeout, Tomcat threads busy 200/200; sửa bằng timeout, chuyển sang outbox + worker bất đồng bộ, bulkhead.

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
Reviewed-by: kilo (T2423R)
