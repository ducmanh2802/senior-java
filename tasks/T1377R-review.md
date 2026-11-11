# T1377R — Fact-check nội dung mới của T1377

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1377 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
T1377 chỉ thêm section "Ví dụ đời thực" vào câu hỏi scenario-127 (incident command). Đã kiểm tra:
- `pg_stat_activity` dùng đúng cho theo dõi lock/connection PostgreSQL
- Feature flag `payment_retry_strict` và mã lỗi `RETRY_REQUIRED` hợp lý
- Rollback cấu hình qua feature flag là phản ứng sự cố đúng
- Timeline 20:58→21:22 = 24 phút khớp với "thời gian ảnh hưởng 24 phút"
- Hành động postmortem (chặn chọn nhầm env, audit trail) phù hợp
- Markup: {{}} cho inline code, ** cho bold, - cho bullet, > cho tip — đúng chuẩn
`node scripts/validate.js` → OK. Không có lỗi kỹ thuật, không cần sửa.
