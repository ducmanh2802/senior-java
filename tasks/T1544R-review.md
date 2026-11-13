# T1544R — Fact-check nội dung mới của T1544

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1544 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Hoàn thành 6 câu hỏi mới (ai-077 → ai-082) vào js/data/q-ai.js, đồng thời sửa lỗi chính tả và làm rõ nội dung cho 5 câu hỏi cũ (ai-072 → ai-076).
- Câu hỏi mới: least privilege + audit cho agent (ai-077), checkpoint/resume cho agent chạy dài (ai-078), sync vs async decision (ai-079), fan-out/orchestration (ai-080), testing agent với mock LLM + contract test (ai-081), debug run với tracing (ai-082).
- `node scripts/validate.js` → OK — không có lỗi.
- Không thay đổi file khác, không commit.
