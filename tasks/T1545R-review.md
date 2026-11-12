# T1545R — Fact-check nội dung mới của T1545

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1545 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-ai-001: Sửa tên model giả "claude-sonnet-4-5" thành model thật "claude-3-5-sonnet-20241022" trong ví dụ code gọi Anthropic Messages API (dòng ~44). Các nội dung khác (API contract, retry policy, metrics, checklist) đều đúng kỹ thuật.
- Không có lỗi markup, không có `${` hay backtick lẫn vào template literal.
- node scripts/validate.js → OK
- node scripts/test-lessons.js → 231/231 pass
