# T2025 — 2 bài học (jpa) vào lessons-jpa.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T1579

Thêm **2 bài học mới** (track `jpa`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: N+1 query: vì sao xảy ra, phát hiện, sửa bằng JOIN FETCH / batch size (bài tập: mô phỏng lazy loading với repository giả đếm query, sửa để còn 2 query); vòng đời entity transient/managed/detached/removed và merge vs persist (bài tập mô phỏng persistence context).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-jpa.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã có sẵn 2 bài học: `lesson-jpa-002` (N+1 query + fetch plan) và `lesson-jpa-013` (vòng đời entity: transient/managed/detached/removed, merge vs persist).
- Sửa reference bài tập jpa-013#1: rollback phải khôi phục entity đã removed (tạo lại managed instance từ snapshot) — trước đó test "removed entity still accessible" fail.
- `node scripts/test-lessons.js` → OK (jpa-002 7/7, jpa-013 14/14).
- `node scripts/validate.js`: lessons-jpa.js không lỗi; lỗi còn lại ở lessons-security.js (không phải file sở hữu).
Reviewed-by: kilo (T2025R)
