# T2090 — 6 câu hỏi Senior Java (jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2089

Thêm **6 câu hỏi phỏng vấn mới** (topic: jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Hibernate 6/JPA: N+1 và cách đo, fetch join vs EntityGraph vs batch size, optimistic lock @Version và xử lý OptimisticLockException, bulk update bỏ qua persistence context, open-session-in-view, lưu batch 100k bản ghi.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu hỏi JPA với id: jpa-064, jpa-065, jpa-066, jpa-067, jpa-068, jpa-069.
- jpa-064 (senior): N+1 query, đo bằng datasource-proxy & Hibernate statistics, khi nào chấp nhận N+1.
- jpa-065 (senior): So sánh fetch join, @EntityGraph, @BatchSize, default_batch_fetch_size — chiến lược kết hợp fetch join to-one + batch size to-many.
- jpa-066 (lead): @Version các kiểu (int/long/Timestamp/Instant), retry exponential backoff + jitter, long-running conversation (wizard) xử lý collision.
- jpa-067 (senior): Bulk update @Modifying bỏ qua persistence context, chiến lược flush/clear, native query RETURNING, @QueryHints flush mode MANUAL.
- jpa-068 (senior): OSIV (spring.jpa.open-in-view) tắt an toàn: đo baseline, DTO + fetch trong service, migration dần vertical slice + feature flag.
- jpa-069 (lead): Batch insert 100k: Hibernate batch, StatelessSession, Spring Batch chunk, parallel @Async — so sánh throughput, config tối ưu (SEQUENCE pooled, batch_size, flush/clear chunk).
Validation: `node --check`, `build-light-index.js`, `validate.js` → OK.
Reviewed-by: kilo (T2090R)
