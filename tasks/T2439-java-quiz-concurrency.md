# T2439 — 10 câu trắc nghiệm (concurrency) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2438

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `concurrency`; id `qz-concurrency-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-concurrency-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống concurrency xử lý event: thread pool rejection, BlockingQueue, CompletableFuture timeout, race khi đếm, virtual threads.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm concurrency vào quiz.js với id: qz-concurrency-046 đến qz-concurrency-055. Các chủ đề: thread pool rejection (046), synchronized atomic counter (047), CompletableFuture orTimeout (048), BlockingQueue put/take (049), LongAdder (050, multi), virtual thread pinning (051), virtual thread best practices (052, multi), ScheduledExecutorService scheduleAtFixedRate (053), ThreadPoolExecutor rejection với CompletableFuture (054), ThreadLocal memory leak (055, multi). Validation pass: node --check, build-light-index, validate.js.
Reviewed-by: kilo (T2439R)
