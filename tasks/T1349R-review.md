# T1349R — Fact-check nội dung mới của T1349

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đã review toàn bộ nội dung MỚI của T1349 trong `js/data/q-system-design.js` (design-021…design-026: phần `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, và markup `-> Senior tip:` → `> Senior tip:`). Không lỗi kiến thức trong phần cũ tại HEAD; chỉ sửa phần mới.

Lỗi đã sửa (theo id):
- design-021: `{\lsql` → `{{sql` (mã markup không hợp lệ); `{{session_mode = transaction}}` → `{{pool_mode = transaction}}` (PgBouncer không có flag session_mode); `{{SET LOCAL tenant_id}}` → `{{SET LOCAL app.tenant_id = 'B'}}` (PostgreSQL custom GUC phải có dấu chấm); `forget tenant_id` → `quên tenant_id`; `connection pool reuse` / `re-use` → tiếng Việt.
- design-022: `{\lsql` → `{{sql`; `(millions of employees receiving salary into the same payout account)` → tiếng Việt.
- design-025: `ghiVERRIDE` / `không ghi OVERRIDE` → `ghi đè`.

`node --check js/data/q-system-design.js` OK. `node scripts/validate.js`: không còn lỗi nào thuộc q-system-design.js.

LỖI CÒN LẠI (không thuộc task này, không sửa vì file không sở hữu / đã có ở HEAD): lessons-ai.js lỗi cú pháp (working tree của agent khác), q-remote.js lỗi cú pháp (working tree của agent khác; đồng thời chặn `node scripts/build-light-index.js`, nên index-light.js báo cũ), projects.js và path.js lỗi tham chiếu lesson-ai-* (dự án trên HEAD). Index-light không làm mới vì nội dung tôi sửa chỉ thay trường `a` (id/topic/level không đổi) và build-light-index.js bị chặn bởi q-remote.js của agent khác.

## Notes
