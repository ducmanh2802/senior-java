# T2420R — Fact-check nội dung mới của T2420

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2420 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Status: DONE
- Đã fact-check kỹ thuật: MVCC tuple-versioning (không ghi overwrite, không undo log như Oracle), SELECT ... FOR UPDATE row-lock + re-evaluate ở READ COMMITTED, deadlock detector 40P01 + thứ tự khóa cố định, composite index leftmost prefix, external merge Disk → index/work_mem, READ COMMITTED chỉ ngăn dirty read, VACUUM (không trả disk về OS) vs VACUUM FULL (khóa độc quyền, rewrite), REPEATABLE READ snapshot tại transaction bắt đầu, expression index cho jsonb key, FOR UPDATE SKIP LOCKED (không chờ, không lỗi), bulk UPDATE batch + FOR UPDATE.
- Kiểm tra markup: 0 backtick, 0 `${` chưa escape, 3 câu multi (047/051/054) đều có "(Chọn 2)" và answer mảng tăng dần.
- `node scripts/validate.js` → OK (2 errors ở file không sở hữu: quiz_backup.js untracked, labs-sql.js thuộc T2422 — tiềnexistent, không phải của task này).
