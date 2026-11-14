# T2049 — 6 câu hỏi Senior Java (concurrency) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2041

Thêm **6 câu hỏi phỏng vấn mới** (topic: concurrency) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: CompletableFuture trong service thật: thenCompose vs thenApply, allOf gom kết quả và xử lý lỗi từng phần, orTimeout/completeOnTimeout, executor mặc định ForkJoinPool.commonPool và vì sao nên truyền executor riêng, mất MDC/trace context qua thread, so sánh với structured concurrency (Java 21 preview) và virtual threads.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu hỏi mới (concurrency-073 … concurrency-078), chỉ chèn vào `js/data/q-concurrency-jvm.js`, không sửa mục cũ.
- concurrency-073 (senior): allOf gom kết quả và **xử lý lỗi từng phần** (handle → Result), so với anyOf và allOf().join() trực tiếp.
- concurrency-074 (senior): orTimeout vs completeOnTimeout — cơ chế Delayer, vì sao timeout **không dừng** việc gốc, timeout nhiều tầng.
- concurrency-075 (senior): pipeline thenCompose (tuần tự) vs thenCombine/allOf (song song) — thiết kế đồ thị phụ thuộc.
- concurrency-076 (senior): mất MDC/trace context qua CompletableFuture; Micrometer context-propagation (ContextSnapshot), OTel, virtual thread + ScopedValue.
- concurrency-077 (lead): so sánh CompletableFuture vs StructuredTaskScope (preview) vs virtual thread — tiêu chí chọn.
- concurrency-078 (lead): anyOf (first-success/failover) vs allOf, bẫy exception-as-result và huỷ nhánh thua.

Kiểm tra: `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js về lessons không nằm trong PATH là có sẵn từ trước, không liên quan task này). Đếm id: concurrency 71 → 77, không trùng. Không commit.
Reviewed-by: kilo (T2049R)
