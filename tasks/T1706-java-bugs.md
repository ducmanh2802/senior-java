# T1706 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T1566

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) cache "check-then-act" không an toàn luồng trong service tỉ giá: hai request cùng lúc gọi API ngoài 2 lần và ghi đè giá trị (sửa: computeIfAbsent/ lock theo key, giải thích vì sao); (2) nút "Thanh toán" bấm 2 lần tạo 2 đơn trùng do thiếu idempotency key (sửa: idempotency key + ràng buộc unique + trả lại kết quả cũ).

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `bug-020` (cache tỉ giá check-then-act: 2 request cùng lúc gọi provider 2 lần/ghi đè; fix `ConcurrentHashMap.computeIfAbsent` theo key) và `bug-021` (checkout thiếu idempotency key: bấm 2 lần tạo 2 đơn; fix kiểm tra+trả kết quả cũ, khoá theo key, unique constraint + đọc lại khi trùng).
- Mỗi bài: 4 test, latch tái hiện race/call đồng thời deterministic, reference pass 4/4, starter compile và không pass hết. Chỉ JDK chuẩn, không public class ngoài `Main`, Java 17.
- Đã chạy: `node --check js/data/bugs.js` (OK), `node scripts/build-light-index.js`, `node scripts/test-bugs.js bug-020`, `node scripts/test-bugs.js bug-021`, `node scripts/test-bugs.js` (21/21), `node scripts/validate.js` → `OK — không có lỗi.` (`js/data/index-light.js` được sinh lại bởi script build-light-index). Chưa commit.
Reviewed-by: verify-only (code/UI task)
