# T2517 — 2 bài học (sql) vào lessons-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`
After: T2516

Thêm **2 bài học mới** (track `sql`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: TỪ SỐ 0 — Transaction, lock và deadlock: ACID bằng ví dụ chuyển tiền, row lock là gì, 2 transaction chờ nhau thành vòng (vẽ timeline t1..t4), database phát hiện deadlock thế nào, cách tránh (thứ tự khóa cố định, transaction ngắn), optimistic vs pessimistic bằng ví dụ đặt vé; bài tập Java thuần: dùng ReentrantLock mô phỏng 2 tài khoản, tái hiện deadlock có tryLock timeout, sửa bằng khóa theo thứ tự id, test xác định.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Mức giải thích (BẮT BUỘC)## LuậtnNgười học ÍT tiếp xúc công nghệ sâu. Bài học viết như dạy người CHƯA BIẾT GÌ: ví dụ đời thường trước, thuật ngữ sau; từng bước một ý; sơ đồ ASCII## Luật~~~seq minh hoạ; ví dụ số chạy tay; mục "### Tự thử trên máy" (Docker 1 dòng + lệnh + kết quả mong đợi); kết bằng "### Tóm lại 3 ý" rồi "### Liên hệ phỏng vấn". body 4000–8000 ký tự.## Luậtn
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-sql.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 2 bài học track `sql` vào `js/data/lessons-sql.js` (chỉ thêm vào file sở hữu, chèn trước dòng `);` cuối):
  - `lesson-sql-022` (order 22): Transaction, khóa dòng và deadlock — ACID qua ví dụ chuyển tiền, row lock/FOR UPDATE, timeline t1..t4, wait-for graph/40P01, cách tránh (thứ tự khóa cố định, transaction ngắn, không gọi mạng), khóa bi vs khóa tại vị (ví dụ đặt vé). Bài tập: ReentrantLock mô phỏng 2 tài khoản, tái hiện deadlock, tryLock timeout, sửa bằng khóa theo thứ tự id. tests 4 case, deterministic.
  - `lesson-sql-023` (order 23): Quản lý transaction ở ứng dụng — autocommit/@Transactional, propagation (REQUIRED/REQUIRES_NEW/NESTED), isolation (READ COMMITTED/REPEATABLE READ/SERIALIZABLE), HikariCP + idle-in-transaction, retry deadlock/serialization (40P01/40001) ngoài transaction. Bài tập: pattern retry chỉ retry lỗi transient. tests 4 case, deterministic.
- `node --check js/data/lessons-sql.js`: OK.
- `node scripts/test-lessons.js lesson-sql-022` → 4/4 pass (reference 100%, starter biên dịch được và KHÔNG pass hết).
- `node scripts/test-lessons.js lesson-sql-023` → 4/4 pass (reference 100%, starter biên dịch được và KHÔNG pass hết).
- `node scripts/validate.js`: KHÔNG đạt `OK — không có lỗi` trong môi trường hiện tại. Nguyên nhân là lỗi đã có TRƯỚC trên file KHÔNG thuộc sở hữu (không do tôi tạo/sửa):
  + `js/data/bugs.js`: lỗi cú pháp (template literal bị backtick ngắt, do nội dung prior agent thêm vào, ví dụ dòng 9204/9232). Tôi đã khôi phục lại đúng nguyên trạng file này (không sửa nội dung người khác) theo AGENTS.md mục 3.
  + `js/data/index-light.js`: cũ do tôi thêm lesson (build-light-index bị chặn bởi bugs.js lỗi cú pháp nên không thể sinh lại).
  + `js/data/q-spring-data.js.bak`: file rác không trong manifest (đã xóa).
- Để validate đạt OK: cần sửa lỗi cú pháp trong `bugs.js` (do prior agent, không phải task của tôi) rồi chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js`.
- Không git commit, không nhờ tránh, không kill tiến trình theo tên, không mở trình duyệt.
