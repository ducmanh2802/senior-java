# T1414R — Fact-check nội dung mới của T1414

Status: TODO
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1414 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-ai-002 (js/data/lessons-ai.js): sửa bước 2 — nguyên nhân sai chỗ: chạy phone trước CCCD mà pattern không có ranh giới từ mới cắt CCCD "012345678901" thành phone "0123456789" + "01" (không phải chạy CCCD trước phone). Thứ tự email → phone → CCCD → card giữ nguyên.
- validate.js: lessons-ai.js không còn lỗi (lỗi còn lại: q-concurrency-jvm.js cú pháp và index-light.js cũ — file của người khác, không nelophan).
- test-lessons.js: lesson-ai-001..005 đều pass.

Status: DONE
