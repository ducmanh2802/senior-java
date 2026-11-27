# T2684 — 3 câu hỏi Senior Java (concurrency) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2813

Thêm **3 câu hỏi phỏng vấn mới** (topic: concurrency) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý**.

Chủ đề: virtual threads trên Spring Boot 3.2+ (spring.threads.virtual.enabled): pinning với synchronized trên JDK 21, ThreadLocal và MDC, khi nào KHÔNG nên bật; CompletableFuture timeout + fallback (orTimeout, completeOnTimeout); thiết kế bulkhead khi gọi 3 đối tác chậm.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu hỏi concurrency (id nối tiếp sau concurrency-098): concurrency-099 (senior, virtual threads: pinning do synchronized JDK 21, ThreadLocal/MDC, khi KHÔNG bật spring.threads.virtual.enabled — góc điều tra production bằng JFR VirtualThreadPinned, khác concurrency-007), concurrency-100 (senior, CompletableFuture: orTimeout/completeOnTimeout, phân bổ ngãn thời gian tổng, không treo commonPool — sâu hơn concurrency-005), concurrency-101 (lead, bulkhead tách ngăn cho 3 đối tác chậm: Semaphore per đối tác theo Little's Law, timeout/fallback riêng, circuit breaker, sơ đồ seq — khác concurrency-011/012). Mỗi câu có **Tóm tắt**, Hiểu nhanh, Thuật ngữ, cơ chế từng bước, code ≤ 30 dòng, bảng so sánh, pitfall, ví dụ đời thực có số liệu, trả lời mẫu, > Senior tip, follow 2-3 câu, tags, refs (link đã kiểm tra). Tiếng Việt có dấu, không backtick, không `${`.

validate: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không báo lỗi cho concurrency-099/100/101 (các LỖI/Cảnh báo còn lại trong validate là của file khác do các agent khác sở hữu, không đụng theo luật 3 AGENTS.md).