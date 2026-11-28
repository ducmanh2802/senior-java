# T2908R — Fact-check nội dung mới của T2908

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccdv-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2908 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

## Notes
- Khôi phục nguyên vẹn block mới (qz-ccdv-211+) từ bản working copy; hoàn nguyên các thay đổi sai kỹ thuật output_config.format → output_format (OpenAI-style) do lần chạy trước để lại, giữ đúng chuẩn Anthropic output_config.format.
- Không phát hiện lỗi kiến thức khác trong block mới.
