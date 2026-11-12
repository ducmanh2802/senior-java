# T1369R — Fact-check nội dung mới của T1369

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1369 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed diff `HEAD -- js/data/q-scenario.js` (new content T1369): added `### Ví dụ đời thực` and `### Trả lời mẫu khi phỏng vấn` for `scenario-111`–`scenario-116`.
- Fact-check: no incorrect APIs/flags/defaults/mechanisms, no unfounded numbers, no markup issues (no backticks/`${`), terminology consistent. Content aligns with PostgreSQL 15/Kafka 3.x concepts.
- Không có lỗi kỹ thuật cần sửa.
- `node --check js/data/q-scenario.js` OK. `node scripts/validate.js` → OK. No file content changes required.
