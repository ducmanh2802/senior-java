# T1358R — Fact-check nội dung mới của T1358

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1358 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa trong `js/data/q-system-design.js` (nội dung mới của T1358, theo từng id câu hỏi):
- architecture-022 (multi-tenancy): `{\lsql` → `{{sql` (lỗi markup); `{{session_mode = transaction}}` → `{{pool_mode = transaction}}` (PgBouncer không có flag `session_mode`); `{{SET LOCAL tenant_id}}` → `{{SET LOCAL app.tenant_id = 'B'}}` (thiếu giá trị và namespace trong SET LOCAL); `re-use` / `connection pool reuse` / `forget` → tiếng Việt (chữ nước ngoài lẫn vào).
- design-022 (ledger): `{{\lsql` → `{{sql` (lỗi markup); `(millions of employees receiving salary into the same payout account)` → tiếng Việt.
- design-023 (statement generation): `ghiVERRIDE` → `ghi đè`; `không ghi OVERRIDE` → `không ghi đè`.

Kết quả: `node scripts/validate.js q-system-design.js` không báo lỗi nào về file này (node --check cũng OK). Không thể chốt `validate.js` toàn repo tới `OK` vì `scripts/build-light-index.js` ném SyntaxError khi xử lý `js/data/q-concurrency-jvm.js` (lỗi backtick trong template literal, nội dung của agent khác, chưa commit) — file này không do task này sở hữu nên không sửa theo quy tắc 3 AGENTS.md; đề xuất integrator sửa q-concurrency-jvm.js rồi chạy build-light-index + validate lại. Các sửa đổi của T1358R chỉ thay đổi văn bản đáp án câu hỏi cũ, không thêm/xoá mục, không ảnh dụng index-light.
