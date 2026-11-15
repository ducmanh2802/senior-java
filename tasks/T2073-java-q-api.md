# T2073 — 6 câu hỏi Senior Java (api) vào q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T1726

Thêm **6 câu hỏi phỏng vấn mới** (topic: api) vào `js/data/q-api.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-api.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: REST API cho đối tác và ngân hàng: versioning, Idempotency-Key cho POST thanh toán, rate limit (token bucket, Bucket4j), hợp đồng phân trang, lỗi chuẩn RFC 9457 Problem Details trong Spring Boot 3, timeout/retry giữa hai bên và cách không làm sập đối tác.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu: `api-061` (senior, versioning API đối tác: path/header, vòng đời, sandbox, deprecation), `api-062` (senior, Idempotency-Key cho POST thanh toán: client/server flow, race/replay, unknown finality), `api-063` (senior, rate limit token bucket với Bucket4j + Spring Boot 3, phân tán Redis), `api-064` (senior, hợp đồng phân trang cursor/page, sort ổn định, envelope), `api-065` (senior, RFC 9457 Problem Details trong Spring Boot 3: type/title/detail/instance, mapping lỗi), `api-066` (lead, timeout/retry giữa hai bên, backoff/jitter, circuit breaker, backpressure).
- Kiểm tra: `node --check js/data/q-api.js` OK; đã fix inline code lồng `{}` trong api-061/api-062 theo validate. `node scripts/build-light-index.js` và `node scripts/validate.js` hiện KHÔNG đạt OK do lỗi cú pháp có sẵn ngoài phạm vi sở hữu (`q-banking.js:676 Unexpected identifier 'version'`) và nhiều lỗi tham chiếu banking/bugs/path/index-light sẵn có; không sửa file ngoài `js/data/q-api.js`.
Reviewed-by: kilo (T2073R)
