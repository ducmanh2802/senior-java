# T2316 — 5 câu phỏng vấn SQL/PostgreSQL mới

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2237

Thêm 5 câu: đọc EXPLAIN ANALYZE để tìm vì sao query chậm (có plan thật), composite index và thứ tự cột, deadlock giữa 2 transaction cập nhật 2 bảng theo thứ tự ngược nhau (cách điều tra bằng log PostgreSQL), SELECT ... FOR UPDATE SKIP LOCKED làm job queue, VACUUM/autovacuum và table bloat trên bảng cập nhật nhiều. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm) — task trước từng xoá nhầm câu cũ.

## Nghiệm thu
`node --check js/data/q-sql.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
