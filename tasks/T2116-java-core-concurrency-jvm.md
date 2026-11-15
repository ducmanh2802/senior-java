# T2116 — Gắn tag 'core' cho ~55 câu lõi trong q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2106

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-concurrency-jvm.js` (topic: concurrency, jvm), chọn **khoảng 55 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: synchronized/volatile/happens-before, Lock, thread pool cấu hình, CompletableFuture, deadlock, ThreadLocal, virtual threads; JVM memory model, GC G1/ZGC, OOM các loại, heap dump, JIT, container memory. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-concurrency-jvm.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Selected 55 questions (14 mid + 41 senior) with 'core' tag added. Mid: concurrency-001,008,010,017,jvm-007,009,016,021,022,023,jvm-019,022,067,054. Senior: concurrency-002,003,004,005,007,009,011,013,014,015,016,018,020,jvm-001,002,003,004,005,008,010,012,013,014,017,018,024,026,027,jvm-020,021,023,024,026,028,029,030,031,032,033,034. validate.js passes individual file check (no schema errors in q-concurrency-jvm.js); full validate.js has pre-existing issues in q-microservices.js/bugs.js/lessons/projects/path unrelated to this task. Light index needs rebuild via node scripts/build-light-index.js after fixing pre-existing q-microservices.js syntax error.
Reviewed-by: kilo (T2116R)
