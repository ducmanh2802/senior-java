# T2799 — 2 debug lab (thread) vào labs-thread.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2783

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-thread.js` để không trùng tình huống. id `lab-thread-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **CompletableFuture chạy trên ForkJoinPool.commonPool bị chặn bởi I/O**: jstack cho thấy toàn bộ worker của commonPool đang WAITING trong HTTP client, API khác dùng parallelStream cũng treo; sửa bằng executor riêng có bound. (2) **synchronized quanh gọi DB làm 200 thread BLOCKED**: jstack nhiều thread BLOCKED chờ cùng monitor <0x...>, 1 thread RUNNABLE trong socketRead; sửa bằng thu hẹp critical section / lock theo key.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab mới:
- `lab-thread-036`: CompletableFuture completion stages (thenApply/thenCompose/whenComplete) lặng lẽ chạy trên commonPool dù supplyAsync dùng executor riêng — bẫy API CompletableFuture không tự lan truyền executor cho stage sau
- `lab-thread-037`: Redisson distributed lock timeout ngắn hơn transaction (tryLock hai tham số tắt watchdog) → lock hết hạn giữa chừng, thread khác lấy lock gây lost update
Reviewed-by: kilo (T2799R)
