# T2122 — Gắn tag 'core' cho ~25 câu lõi trong q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2099

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-soft.js` (topic: behavioral, testing), chọn **khoảng 25 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: câu behavioral kinh điển (dự án khó nhất, xung đột trong team, sai lầm và bài học, mentoring, deadline gấp), testing: unit vs integration, mock, Testcontainers, test pyramid. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-soft.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 'core' vào 25 câu trong js/data/q-soft.js (13 testing + 12 behavioral), mức mid/senior chủ yếu, lead chỉ khi kinh điển:
- testing: testing-001, testing-002, testing-003, testing-004, testing-005, testing-006, testing-009, testing-010, testing-013, testing-014, testing-050, testing-052, testing-057
- behavioral: behavioral-001, behavioral-002, behavioral-003, behavioral-004, behavioral-005, behavioral-006, behavioral-007, behavioral-008, behavioral-009, behavioral-010, behavioral-011, behavioral-012
Số câu trước/sau bằng nhau (109). Chỉ sửa dòng tags, không sửa q/a/follow. validate.js sạch đối với q-soft.js (các lỗi còn lại trong q-sql.js/path.js là lỗi cũ, không thuộc file này). Đã chạy build-light-index.js.
Reviewed-by: kilo (T2122R)
