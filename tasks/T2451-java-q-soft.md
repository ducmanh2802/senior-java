# T2451 — 4 câu hỏi Senior Java (testing) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2436

Thêm **4 câu hỏi phỏng vấn mới** (topic: testing) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: testing cho backend Senior: Testcontainers với PostgreSQL/Kafka, test idempotency và concurrency, contract test, test pyramid trên microservices, test migration DB; cách thuyết phục team tăng chất lượng trước khi chuyển QA.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu hỏi testing vào js/data/q-soft.js (id nối tiếp testing-061): testing-062 (Testcontainers PostgreSQL+Kafka, singleton container, isolation dữ liệu), testing-063 (idempotency Idempotency-Key + concurrency CyclicBarrier), testing-064 (test pyramid microservices + contract test Pact, ai sở hữu E2E), testing-065 (thuyết phục team/quản lý đầu tư chất lượng trước QA bằng số liệu defect escape rate, diff coverage, flaky rate). Mỗi câu: level senior/lead, có Tóm tắt, cơ chế từng bước, code Java ≤ 30 dòng, bảng trade-off, bẫy production, Ví dụ đời thực có số liệu, Trả lời mẫu 150-220 từ, Senior tip, follow 2-3 câu. Đã chạy node --check js/data/q-soft.js, node scripts/build-light-index.js, node scripts/validate.js q-soft.js → OK — không có lỗi.
Reviewed-by: kilo (T2451R)
